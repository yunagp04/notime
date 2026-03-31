import { poolPromise } from "../config/db";
import sql from "mssql";
import { IListRepository } from "../interfaces/IListRepository";
import { v4 as uuidv4 } from 'uuid';

export class SqlListRepository implements IListRepository {
    private get request() {
        return poolPromise.then(pool => pool.request());
    }

    /**
     * ดึงรายการ List ทั้งหมดของ User พร้อมนับจำนวนคำศัพท์
     */
    async getLists(userId: string): Promise<{ list_id: string; name: string; vocab_count: number }[]> {
        try {
            const req = await this.request;
            const query = `
                SELECT 
                    ul.list_id, 
                    ul.list_name as name,
                    COUNT(uli.learning_item_id) as vocab_count
                FROM UserList ul
                LEFT JOIN UserLearningItem uli 
                    ON ul.list_id = uli.list_id 
                WHERE ul.user_id = @userId   -- ✅ เปลี่ยนจาก UID เป็น user_id (ตามที่แก้ใน DB)
                GROUP BY ul.list_id, ul.list_name
            `;

            const result = await req
                .input("userId", sql.UniqueIdentifier, userId)
                .query(query);

            return result.recordset;
        } catch (err: any) {
            console.error("❌ SQL GetLists Error:", err.message);
            throw err;
        }
    }

    /**
     * สร้าง List เริ่มต้นให้ User ใหม่ (ใช้ใน AuthController)
     */
    async createDefaultList(userId: string) {
        const req = await this.request;
        const newListId = uuidv4();
        await req
            .input("id", sql.UniqueIdentifier, newListId)
            .input("userId", sql.UniqueIdentifier, userId)
            .input("name", sql.NVarChar, "รายการใหม่")
            .query(`
                INSERT INTO UserList (list_id, user_id, list_name, created_at) 
                VALUES (@id, @userId, @name, GETDATE())
            `);
    }

    /**
     * ดึง ID ของ List เริ่มต้น ถ้าไม่มีให้สร้างใหม่
     */
    async getOrCreateDefaultList(userId: string): Promise<string> {
        try {
            const req = await this.request;
            
            // 1. ลองหาลิสต์ที่มีอยู่แล้ว (แก้ UID เป็น user_id)
            const result = await req
                .input("userId", sql.UniqueIdentifier, userId)
                .query(`SELECT TOP 1 list_id FROM UserList WHERE user_id = @userId ORDER BY created_at`);

            if (result.recordset.length > 0) {
                return result.recordset[0].list_id;
            }

            // 2. ถ้าไม่มี ให้สร้างใหม่
            const newReq = await this.request;
            const newListId = uuidv4(); // ต้อง import { v4 as uuidv4 } from 'uuid';
            
            await newReq
                .input("listId", sql.UniqueIdentifier, newListId)
                .input("userId", sql.UniqueIdentifier, userId)
                .input("name", sql.NVarChar, "Default List")
                .query(`
                    INSERT INTO UserList (list_id, user_id, list_name, created_at) 
                    VALUES (@listId, @userId, @name, GETDATE())
                `);
            
            return newListId;
        } catch (err: any) {
            console.error("❌ SQL getOrCreateDefaultList Error:", err.message);
            throw err;
        }
    }

    async createList(userId: string, name: string): Promise<string> {
        const req = await this.request;
        const newListId = uuidv4();
        await req
            .input("id", sql.UniqueIdentifier, newListId)
            .input("userId", sql.UniqueIdentifier, userId)
            .input("name", sql.NVarChar, name)
            .query(`INSERT INTO UserList (list_id, user_id, list_name, created_at) 
                    VALUES (@id, @userId, @name, GETDATE())`);
        return newListId;
    }

    async updateList(userId: string, listId: string, name: string): Promise<void> {
        const req = await this.request;
        await req
            .input("id", sql.UniqueIdentifier, listId)
            .input("userId", sql.UniqueIdentifier, userId)
            .input("name", sql.NVarChar, name)
            .query(`UPDATE UserList
                    SET list_name = @name, updated_at = GETDATE() 
                    WHERE list_id = @id AND user_id = @userId`);
    }

    async deleteList(userId: string, listId: string): Promise<void> {
        const req = await this.request;
        // หมายเหตุ: การลบ List ควรระวังเรื่องคำศัพท์ที่ค้างอยู่ (Cascade Delete หรือย้ายลิสต์ก่อน)
        await req
            .input("id", sql.UniqueIdentifier, listId)
            .input("userId", sql.UniqueIdentifier, userId)
            .query(`DELETE FROM UserList WHERE list_id = @id AND user_id = @userId`);
    }
}

