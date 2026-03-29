import { BaseService } from "./base.service.js";
import sql from "mssql";
import { connectDB } from "../config/db.Config.js";
import { v4 as uuidv4 } from "uuid";

class VocabService extends BaseService {
  constructor() {
    super("dbo.LearningItem", "learning_item_id");
  }

    async create(userId, { title, content, language }) {
        const pool = await connectDB();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const newId = uuidv4();
            const request = new sql.Request(transaction);

            // 1. สร้าง LearningItem
            await request
            .input("id", sql.UniqueIdentifier, newId)
            .input("title", sql.NVarChar, title)
            .input("content", sql.NVarChar, content || null)
            .query(`INSERT INTO dbo.LearningItem (learning_item_id, item_type, title, content, created_at)
                    VALUES (@id, 'vocabulary', @title, @content, GETUTCDATE())`);

            // 2. ค้นหา ID ของ List ที่ชื่อ 'New Items' ของ User นี้
            let listResult = await request
                .input("uId", sql.UniqueIdentifier, userId)
                .query(`SELECT ul.list_id FROM dbo.UserList ul 
                        JOIN dbo.ListMember lm ON ul.list_id = lm.list_id 
                        WHERE lm.user_id = @uId AND ul.list_name = 'New Items'`);

            let listId = listResult.recordset[0]?.list_id;

            // *** ถ้าไม่มีลิสต์ชื่อ 'New Items' ให้สร้างใหม่ ***
            if (!listId) {
                listId = uuidv4();
                // ต้องมี input แยกสำหรับลิสต์ใหม่และ userId
                await request
                    .input("newListId", sql.UniqueIdentifier, listId)
                    .input("ownerId", sql.UniqueIdentifier, userId) 
                    .query(`
                        INSERT INTO dbo.UserList (list_id, list_name, created_at) 
                        VALUES (@newListId, 'New Items', GETUTCDATE());
                        
                        INSERT INTO dbo.ListMember (list_id, user_id, user_role, joined_at) 
                        VALUES (@newListId, @ownerId, 'owner', GETUTCDATE());
                    `);
            }

            // 3. Link คำเข้ากับ List
            await request
            .input("linkListId", sql.UniqueIdentifier, listId)
            .input("linkItemId", sql.UniqueIdentifier, newId)
            .query(`INSERT INTO dbo.ListEntry (list_id, learning_item_id, added_at) VALUES (@linkListId, @linkItemId, GETUTCDATE())`);

            // 3.5 บันทึกสิทธิ์เพื่อให้คำนี้ปรากฏใน "คลังคำศัพท์ทั้งหมด"
            await request
                .input("uliUserId", sql.UniqueIdentifier, userId)
                .input("uliItemId", sql.UniqueIdentifier, newId)
                .query(`INSERT INTO dbo.UserLearningItem (user_id, learning_item_id, added_at)
                        VALUES (@uliUserId, @uliItemId, GETUTCDATE())`);

            await transaction.commit();
            return newId;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

}

export const vocabService = new VocabService();