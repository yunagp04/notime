import { IVocabRepository } from "../interfaces/IVocabRepository";
import { LearningItem } from "../models/LearningItem";
import sql from 'mssql';
import { poolPromise } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export class SqlVocabRepository implements IVocabRepository {

    constructor() {
        console.log("SQL Repository Initialized");
    }

    async getAllVocabs(userId: string, listId?: string): Promise<any[]> {
        const pool = await poolPromise;
        const request = pool.request().input('userId', sql.UniqueIdentifier, userId);
        
        // เริ่มต้น Query พื้นฐาน
        let query = `
            SELECT 
                li.learning_item_id as id, 
                li.title as word, 
                li.content as definition, 
                ISNULL(rs.difficulty, 0) as difficulty, 
                rs.next_review_at as nextReview
            FROM LearningItem li
            LEFT JOIN UserLearningItem uli ON li.learning_item_id = uli.learning_item_id
            LEFT JOIN ReviewState rs ON li.learning_item_id = rs.learning_item_id
            WHERE uli.user_id = @userId
        `;

        // 🚩 ถ้าหน้าบ้านส่ง listId มา ให้กรองเพิ่มเฉพาะในลิสต์นั้น
        if (listId) {
            request.input('listId', sql.UniqueIdentifier, listId);
            query += ` AND uli.list_id = @listId`;
        }

        query += ` ORDER BY li.created_at DESC`;

        const result = await request.query(query);
        return result.recordset;
    }

    async getOrCreateDefaultList(userId: string): Promise<string> {
        const pool = await poolPromise;
        // 1. ลองหาลิสต์ชื่อ New Item ของ User คนนี้ก่อน
        const result = await pool.request()
            .input("userId", sql.UniqueIdentifier, userId)
            .query(`SELECT list_id FROM UserList WHERE user_id = @userId AND list_name = 'New Item'`);

        if (result.recordset.length > 0) {
            return result.recordset[0].list_id; // เจอแล้ว ส่ง ID กลับไป
        }

        // 2. ถ้าไม่เจอ (เช่น User เก่าที่ยังไม่มีลิสต์นี้) ให้สร้างใหม่ให้เขาเลย
        const newListId = uuidv4();
        await pool.request()
            .input("id", sql.UniqueIdentifier, newListId)
            .input("userId", sql.UniqueIdentifier, userId)
            .query(`INSERT INTO UserList (list_id, user_id, list_name, created_at) VALUES (@id, @userId, 'New Item', GETDATE())`);
        
        return newListId;
    }

    async getDueVocabs(userId: string): Promise<any[]> {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.UniqueIdentifier, userId)
            .query`
                SELECT 
                    li.learning_item_id as id,
                    li.title,
                    li.content,
                    rs.next_review_at,
                    rs.repetition,
                    rs.difficulty
                    FROM LearningItem li
                    INNER JOIN ReviewState rs 
                    ON li.learning_item_id = rs.learning_item_id
                    WHERE rs.user_id = @userId
                    AND rs.next_review_at <= GETUTCDATE()
            `;
        return result.recordset;
    
    }

    async addVocab(listId: string, item: any): Promise<any> {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();
            const itemId = uuidv4(); 

            // 1. Insert ลงตารางแม่ก่อน
            await transaction.request()
                .input("id", sql.UniqueIdentifier, itemId)
                .input("type", sql.NVarChar, "vocabulary")
                .input("title", sql.NVarChar, item.word)
                .input("content", sql.NVarChar, item.definition)
                .query(`INSERT INTO LearningItem (learning_item_id, item_type, title, content, created_at, updated_at) 
                        VALUES (@id, @type, @title, @content, GETDATE(), GETDATE())`);

            // 2. 🚩 แก้ชื่อตารางเป็น UserLearningItem (ตามรูปที่โบรส่งมา)
            await transaction.request()
                .input("userId", sql.UniqueIdentifier, item.userId)
                .input("listId", sql.UniqueIdentifier, listId)
                .input("itemId", sql.UniqueIdentifier, itemId)
                .query(`INSERT INTO UserLearningItem (user_id, list_id, learning_item_id, added_at, role) 
                        VALUES (@userId, @listId, @itemId, GETDATE(), 'owner')`); // เพิ่ม 'owner' ตาม schema

            // 3. สร้างสถานะการจำเริ่มต้น
            await transaction.request()
                .input("itemId", sql.UniqueIdentifier, itemId)
                .input("userId", sql.UniqueIdentifier, item.userId)
                .query(`
                    INSERT INTO ReviewState (learning_item_id, user_id, next_review_at, difficulty, interval_days, repetition)
                    VALUES (@itemId, @userId, GETUTCDATE(), 2.5, 0, 0)
                `);

            await transaction.commit();
            return { id: itemId, ...item };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async updateVocab(itemId: string, item: { word: string, definition: string }): Promise<void> {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.UniqueIdentifier, itemId)
            .input('title', sql.NVarChar, item.word)
            .input('content', sql.NVarChar, item.definition)
            .query(`
                UPDATE LearningItem 
                SET title = @title, content = @content, updated_at = GETDATE()
                WHERE learning_item_id = @id
            `);
    }

    async deleteVocab(itemId: string): Promise<void> {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();
            // ลบจากทุกตารางที่มี Foreign Key เชื่อมอยู่
            await transaction.request().input('id', sql.UniqueIdentifier, itemId).query('DELETE FROM ReviewState WHERE learning_item_id = @id');
            await transaction.request().input('id', sql.UniqueIdentifier, itemId).query('DELETE FROM ListEntry WHERE learning_item_id = @id');
            await transaction.request().input('id', sql.UniqueIdentifier, itemId).query('DELETE FROM ItemEmbedding WHERE learning_item_id = @id');
            await transaction.request().input('id', sql.UniqueIdentifier, itemId).query('DELETE FROM ReviewHistory WHERE learning_item_id = @id');
            await transaction.request().input('id', sql.UniqueIdentifier, itemId).query('DELETE FROM LearningItem WHERE learning_item_id = @id');
            
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async saveEmbedding(itemId: string, vector: number[]): Promise<void> {
        const pool = await poolPromise;
        
        const vectorBuffer = Buffer.from(new Float32Array(vector).buffer);

        await pool.request()
            .input("itemId", sql.UniqueIdentifier, itemId)
            .input("vector", sql.VarBinary(sql.MAX), vectorBuffer)
            .input("version", sql.NVarChar, 'text-embedding-004')
            .query(`
                INSERT INTO ItemEmbedding (learning_item_id, vector_data, model_version)
                VALUES (@itemId, @vector, @version)
            `);
    }

    async getReviewState(itemId: string): Promise<any> {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.UniqueIdentifier, itemId)
            .query(`
                SELECT 
                    learning_item_id AS learningItemId,
                    next_review_at AS nextReviewAt,
                    difficulty,
                    interval_days AS intervalDays,
                    repetition
                FROM ReviewState WHERE learning_item_id = @id
            `); //
        return result.recordset[0];
    }

    async updateReviewState(
        itemId: string, 
        userId: string,
        nextReview: Date, 
        difficulty: number, 
        interval: number
    ): Promise<void> {
        const pool = await poolPromise;
        await pool.request()
            .input("id", sql.UniqueIdentifier, itemId)
            .input("uid", sql.UniqueIdentifier, userId) // ส่ง userId เข้า SQL
            .input("next", sql.DateTime2, nextReview)
            .input("diff", sql.Float, difficulty)
            .input("inter", sql.Int, interval)
            .query(`
                UPDATE ReviewState 
                SET next_review_at = @next, 
                    difficulty = @diff, 
                    interval_days = @inter,
                    last_reviewed_at = GETDATE()
                WHERE learning_item_id = @id AND user_id = @uid
            `);
    }

    async saveReviewHistory(history: { 
        userId: string, 
        itemId: string, 
        rating: number, 
        responseTime: number, 
        prevState: string 
    }): Promise<void> {
        const pool = await poolPromise;
        await pool.request()
            .input("historyId", sql.UniqueIdentifier, uuidv4()) // ใช้ uuidv4 เจน ID ใหม่
            .input("userId", sql.UniqueIdentifier, history.userId)
            .input("itemId", sql.UniqueIdentifier, history.itemId)
            .input("rating", sql.Int, history.rating)
            .input("time", sql.Int, history.responseTime)
            // .input("prevState", sql.NVarChar, history.prevState)
            .input("prevState", sql.NVarChar, history.prevState || "{}")
            .query(`
                INSERT INTO ReviewHistory (
                    history_id, 
                    user_id, 
                    learning_item_id, 
                    rating, 
                    response_time_ms, 
                    reviewed_at, 
                    prev_state_json
                ) 
                VALUES (@historyId, @userId, @itemId, @rating, @time, GETDATE(), @prevState)
            `);
    }

    async getReviewHistory(userId: string): Promise<any[]> {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.UniqueIdentifier, userId)
            .query(`
                SELECT 
                    CAST(reviewed_at AS DATE) as date, 
                    COUNT(*) as count
                FROM ReviewHistory
                WHERE user_id = @userId 
                AND reviewed_at >= DATEADD(day, -7, GETDATE())
                GROUP BY CAST(reviewed_at AS DATE)
                ORDER BY date ASC
            `);
        return result.recordset;
    }

    async getReviewSummary(userId: string): Promise<any> {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.UniqueIdentifier, userId)
            .query(`
                SELECT 
                    SUM(CASE WHEN repetition = 0 THEN 1 ELSE 0 END) as New,
                    SUM(CASE WHEN repetition > 0 AND repetition <= 3 THEN 1 ELSE 0 END) as Learning,
                    SUM(CASE WHEN repetition > 3 THEN 1 ELSE 0 END) as Mastered,
                    COUNT(*) as Total
                FROM ReviewState
                WHERE user_id = @userId
            `);
        return result.recordset[0];
    }

    async searchByVector(userId: string, searchVector: number[]): Promise<any[]> {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("userId", sql.UniqueIdentifier, userId)
            .query(`
                SELECT 
                    li.learning_item_id as id,
                    li.title as word,
                    li.content as definition,
                    ie.vector_data
                FROM LearningItem li
                JOIN UserLearningItem uli ON li.learning_item_id = uli.learning_item_id
                JOIN ItemEmbedding ie ON li.learning_item_id = ie.learning_item_id
                WHERE uli.user_id = @userId
            `);

        // 🧮 คำนวณความคล้ายคลึงในฝั่ง TypeScript
        const items = result.recordset.map(row => {
            const itemVector = Array.from(new Float32Array(row.vector_data.buffer));
            const similarity = this.cosineSimilarity(searchVector, itemVector);
            return { ...row, similarity, vector_data: undefined }; // ไม่ส่ง vector กลับไปหน้าบ้าน
        });

        // เรียงลำดับตามความเหมือน (มากไปน้อย) และเอาแค่ Top 10
        return items.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
    }

    // Helper for vector similarity calculation
    private cosineSimilarity(v1: number[], v2: number[]): number {
        let dotProduct = 0, normA = 0, normB = 0;
        for (let i = 0; i < v1.length; i++) {
            dotProduct += v1[i]! * v2[i]!;
            normA += v1[i]! * v1[i]!;
            normB += v2[i]! * v2[i]!;
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    // Find user record by Azure Easy Auth principal ID
    async getUserByAuthProviderID(providerId: string): Promise<any> {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("providerId", sql.NVarChar, providerId)
            .query("SELECT TOP 1 [user_id] FROM [UserAuthProvider] WHERE [provider_user_id] = @providerId");
        return result.recordset[0] || null;
    }

    // async getUserByAuthProviderID(providerId: string): Promise<any> {
    //     console.log(`SQL SELECT: Finding user with providerId: ${providerId}`);
    //     const pool = await poolPromise;
    //     const result = await pool.request()
    //         .input("providerId", sql.NVarChar, providerId)
    //         .query("SELECT TOP 1 * FROM UserAuthProvider WHERE provider_user_id = @providerId");
    //     return result.recordset[0] || null;
    // }

    // Create a new user account during first-time login
    async registerNewUser(authData: any): Promise<any> {
        const pool = await poolPromise;
        const userId = uuidv4();
        const defaultListId = uuidv4();
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();
            await transaction.request()
                .input("id", sql.UniqueIdentifier, userId)
                .input("email", sql.NVarChar, authData.email)
                .input("name", sql.NVarChar, authData.name)
                .query(`INSERT INTO [User] (user_id, email, display_name, created_at, preferred_language) 
                        VALUES (@id, @email, @name, GETDATE(), 'en')`);

            await transaction.request()
            .input("listId", sql.UniqueIdentifier, defaultListId)
            .input("userId", sql.UniqueIdentifier, userId)
            .query(`INSERT INTO UserList (list_id, user_id, list_name, created_at) 
                    VALUES (@listId, @userId, 'New Words', GETDATE())`);

            await transaction.request()
                .input("authId", sql.UniqueIdentifier, uuidv4())
                .input("userId", sql.UniqueIdentifier, userId)
                .input("provider", sql.NVarChar, authData.provider)
                .input("puid", sql.NVarChar, authData.providerUserId)
                .query(`INSERT INTO UserAuthProvider (user_auth_id, user_id, provider_name, provider_user_id, created_at) 
                        VALUES (@authId, @userId, @provider, @puid, GETDATE())`);

            await transaction.commit();
            return { user_id: userId, ...authData };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    // async registerNewUser(authData: any): Promise<any> {
    //     console.log(`SQL INSERT Registering new user: ${authData.name}`);

    //     const pool = await poolPromise;
    //     const userId = uuidv4();
        
    //     const transaction = new sql.Transaction(pool);
    //     try {
    //         await transaction.begin();

    //         await transaction.request()
    //             .input("id", sql.UniqueIdentifier, userId)
    //             .input("email", sql.NVarChar, authData.email)
    //             .input("name", sql.NVarChar, authData.name)
    //             .input("lang", sql.NVarChar, "th")
    //             .query(`INSERT INTO [User] (user_id, email, display_name, created_at, preferred_language, is_generating) 
    //                     VALUES (@id, @email, @name, GETDATE(), @lang, 0)`);

    //         await transaction.request()
    //             .input("authId", sql.UniqueIdentifier, uuidv4())
    //             .input("userId", sql.UniqueIdentifier, userId)
    //             .input("provider", sql.NVarChar, authData.provider)
    //             .input("providerUserId", sql.NVarChar, authData.providerUserId)
    //             .query(`INSERT INTO UserAuthProvider (user_auth_id, user_id, provider_name, provider_user_id, created_at) 
    //                     VALUES (@authId, @userId, @provider, @providerUserId, GETDATE())`);

    //         await transaction.commit();
    //         return { userID: userId, ...authData };
    //     } catch (err) {
    //         await transaction.rollback();
    //         throw err;
    //     }
    // }

    // Persist web push subscription details
    async saveSubscription(userId: string, sub: any): Promise<void> {
        const pool = await poolPromise;
        await pool.request()
            .input('userId', sql.UniqueIdentifier, userId)
            .input('endpoint', sql.NVarChar, sub.endpoint)
            .input('p256dh', sql.NVarChar, sub.keys.p256dh)
            .input('auth', sql.NVarChar, sub.keys.auth)
            .query(`
                IF EXISTS (SELECT 1 FROM PushSubscription WHERE endpoint = @endpoint)
                    UPDATE PushSubscription SET user_id = @userId WHERE endpoint = @endpoint
                ELSE
                    INSERT INTO PushSubscription (user_id, endpoint, p256dh_key, auth_key, created_at)
                    VALUES (@userId, @endpoint, @p256dh, @auth, GETDATE())
            `);
    }

    // async saveSubscription(userId: string, sub: any): Promise<void> {
    //     const pool = await poolPromise;
    //     await pool.request()
    //         .input('userId', sql.UniqueIdentifier, userId)
    //         .input('endpoint', sql.NVarChar, sub.endpoint)
    //         .input('p256dh', sql.NVarChar, sub.keys.p256dh) // ค่าจากหน้าบ้าน
    //         .input('auth', sql.NVarChar, sub.keys.auth)     // ค่าจากหน้าบ้าน
    //         .query(`
    //             IF EXISTS (SELECT 1 FROM PushSubscription WHERE endpoint = @endpoint)
    //                 UPDATE PushSubscription SET user_id = @userId WHERE endpoint = @endpoint
    //             ELSE
    //                 -- 🚩 ใช้ชื่อคอลัมน์ตามรูปของโบร
    //                 INSERT INTO PushSubscription (user_id, endpoint, p256dh_key, auth_key, created_at)
    //                 VALUES (@userId, @endpoint, @p256dh, @auth, GETDATE())
    //         `);
    // }

    
}