// SqlVocabRepository.ts
import { IVocabRepository } from "../interfaces/IVocabRepository";
import sql from 'mssql';
import { poolPromise } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export class SqlVocabRepository implements IVocabRepository {
    
    constructor() {
        console.log("✅ SqlVocabRepository Ready");
    }

    /**
     * Getter สำหรับดึง Request โดยไม่ให้โค้ดติดอ่าง
     */
    private get request() {
        return (async () => {
            const pool = await poolPromise;
            return pool.request();
        })();
    }

    // ==========================================
    // 🌍 SECTION: GLOBAL VOCABULARY (LearningItem)
    // ==========================================

    async findGlobalItem(word: string): Promise<any | null> {
        const req = await this.request;
        const result = await req
            .input('word', sql.NVarChar, word.trim())
            .query('SELECT TOP 1 * FROM LearningItem WHERE title = @word');
        
        return result.recordset[0] || null;
    }

    async saveGlobalItem(word: string, definition: string): Promise<string> {
        const id = uuidv4();
        const req = await this.request;
        await req
            .input('id', sql.UniqueIdentifier, id)
            .input('title', sql.NVarChar, word.trim())
            .input('content', sql.NVarChar, definition)
            .input('type', sql.NVarChar, 'vocabulary')
            .query(`INSERT INTO LearningItem (learning_item_id, title, content, created_at, updated_at, global_count, item_type) 
                    VALUES (@id, @title, @content, GETDATE(), GETDATE(), 1, @type)`);
        return id;
    }

    // ==========================================
    // 👤 SECTION: USER VOCABULARY (UserLearningItem)
    // ==========================================

    async linkUserItem(userId: string, learningItemId: string, listId: string): Promise<void> {
        const req = await this.request;
        await req
            .input('userId', sql.UniqueIdentifier, userId)
            .input('itemId', sql.UniqueIdentifier, learningItemId)
            .input('listId', sql.UniqueIdentifier, listId)
            .query(`IF NOT EXISTS (SELECT 1 FROM UserLearningItem WHERE user_id = @userId AND learning_item_id = @itemId)
                    BEGIN
                        INSERT INTO UserLearningItem (user_id, learning_item_id, list_id, role, added_at, updated_at) 
                        VALUES (@userId, @itemId, @listId, 'owner', GETDATE(), GETDATE());
                        
                        UPDATE LearningItem SET global_count = ISNULL(global_count, 0) + 1 
                        WHERE learning_item_id = @itemId;
                    END`);
    }

    async getAllVocabs(userId: string, listId?: string): Promise<any[]> {
        const req = await this.request;
        req.input('userId', sql.UniqueIdentifier, userId);
        
        let query = `
            SELECT 
                li.learning_item_id, 
                li.title as word, 
                ISNULL(uli.custom_definition, li.content) as definition,
                uli.list_id,
                rs.difficulty,
                rs.next_review_at
            FROM UserLearningItem uli
            JOIN LearningItem li ON uli.learning_item_id = li.learning_item_id
            LEFT JOIN ReviewState rs ON uli.learning_item_id = rs.learning_item_id AND uli.user_id = rs.user_id
            WHERE uli.user_id = @userId
        `;

        if (listId) {
            req.input('listId', sql.UniqueIdentifier, listId);
            query += ` AND uli.list_id = @listId`;
        }
        query += ` ORDER BY li.title ASC`;

        const result = await req.query(query);
        return result.recordset.map(row => ({
            id: row.learning_item_id,
            word: row.word,
            definition: row.definition,
            difficulty: row.difficulty || 0,
            nextReview: row.next_review_at
        }));
    }

    async getVocabs(userId: string, listId?: string): Promise<any[]> {
        const req = await this.request;
        req.input('userId', sql.UniqueIdentifier, userId);
        
        let query = `
            SELECT 
                uli.learning_item_id as id,
                li.title as word,
                ISNULL(uli.custom_definition, li.content) as definition,
                ul.list_name,
                uli.added_at
            FROM UserLearningItem uli
            JOIN LearningItem li ON uli.learning_item_id = li.learning_item_id
            JOIN UserList ul ON uli.list_id = ul.list_id
            WHERE uli.user_id = @userId
        `;

        if (listId) {
            req.input('listId', sql.UniqueIdentifier, listId);
            query += ` AND uli.list_id = @listId`;
        }

        query += ` ORDER BY uli.added_at DESC`;

        const result = await req.query(query);
        return result.recordset;
    }

    // ==========================================
    // 🧠 SECTION: REVIEW & SRS (ReviewState)
    // ==========================================

    async initReviewState(userId: string, itemId: string): Promise<void> {
        const req = await this.request;
        await req
            .input("itemId", sql.UniqueIdentifier, itemId)
            .input("userId", sql.UniqueIdentifier, userId)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM ReviewState WHERE user_id = @userId AND learning_item_id = @itemId)
                INSERT INTO ReviewState (learning_item_id, user_id, next_review_at, difficulty, interval_days, repetition)
                VALUES (@itemId, @userId, GETUTCDATE(), 2.5, 0, 0)
            `);
    }

    async updateReviewState(itemId: string, userId: string, nextReview: Date, difficulty: number, interval: number): Promise<void> {
        const req = await this.request;

        if (!(nextReview instanceof Date) || isNaN(nextReview.getTime())) {
            throw new Error("Repository received an invalid date object");
        }

        await req
            .input("id", sql.UniqueIdentifier, itemId)
            .input("uid", sql.UniqueIdentifier, userId)
            .input("next", sql.DateTime, nextReview)
            .input("diff", sql.Float, difficulty)
            .input("inter", sql.Int, interval || 1)
            .query(`
                UPDATE ReviewState 
                SET next_review_at = @next, 
                    difficulty = @diff, 
                    interval_days = @inter,
                    last_reviewed_at = GETDATE()
                WHERE learning_item_id = @id AND user_id = @uid
            `);
    }

    async saveReviewHistory(history: any): Promise<void> {
        const req = await this.request;
        await req
            .input("historyId", sql.UniqueIdentifier, uuidv4())
            .input("userId", sql.UniqueIdentifier, history.userId)
            .input("itemId", sql.UniqueIdentifier, history.itemId)
            .input("rating", sql.Int, history.rating)
            .input("time", sql.Int, history.responseTime)
            .input("prevState", sql.NVarChar, history.prevState || "{}")
            .query(`INSERT INTO ReviewHistory (history_id, user_id, learning_item_id, rating, response_time_ms, reviewed_at, prev_state_json) 
                    VALUES (@historyId, @userId, @itemId, @rating, @time, GETDATE(), @prevState)`);
    }

    async getReviewState(userId: string, itemId: string): Promise<any | null> {
        const req = await this.request;
        const result = await req
            .input('userId', sql.UniqueIdentifier, userId)
            .input('itemId', sql.UniqueIdentifier, itemId)
            .query('SELECT * FROM ReviewState WHERE user_id = @userId AND learning_item_id = @itemId');
        
        return result.recordset[0] || null;
    }

    // ==========================================
    // 📊 SECTION: ANALYTICS & DASHBOARD
    // ==========================================

    async getReviewSummary(userId: string): Promise<any> {
        const req = await this.request;
        const result = await req
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

    async getMemoryStrength(userId: string) {
        const req = await this.request;
        const result = await req
            .input('userId', sql.UniqueIdentifier, userId)
            .query(`
                SELECT 
                    CASE 
                        WHEN interval_days > 30 THEN 'Mastered'
                        WHEN interval_days BETWEEN 10 AND 30 THEN 'Strong'
                        WHEN interval_days BETWEEN 1 AND 9 THEN 'Learning'
                        ELSE 'Struggling'
                    END as status,
                    COUNT(*) as count
                FROM ReviewState
                WHERE user_id = @userId
                GROUP BY 
                    CASE 
                        WHEN interval_days > 30 THEN 'Mastered'
                        WHEN interval_days BETWEEN 10 AND 30 THEN 'Strong'
                        WHEN interval_days BETWEEN 1 AND 9 THEN 'Learning'
                        ELSE 'Struggling'
                    END
            `);
        return result.recordset;
    }

    // ==========================================
    // 🤖 SECTION: AI & VECTOR SEARCH
    // ==========================================

    async saveEmbedding(itemId: string, vector: number[]): Promise<void> {
        const req = await this.request;
        const vectorBuffer = Buffer.from(new Float32Array(vector).buffer);
        await req
            .input("itemId", sql.UniqueIdentifier, itemId)
            .input("vector", sql.VarBinary(sql.MAX), vectorBuffer)
            .input("version", sql.NVarChar, 'text-embedding-004')
            .query(`IF NOT EXISTS (SELECT 1 FROM ItemEmbedding WHERE learning_item_id = @itemId)
                    INSERT INTO ItemEmbedding (learning_item_id, vector_data, model_version)
                    VALUES (@itemId, @vector, @version)`);
    }

    async searchByVector(userId: string, searchVector: number[]): Promise<any[]> {
        const req = await this.request;
        const result = await req
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

        const items = result.recordset.map(row => {
            const itemVector = Array.from(new Float32Array(row.vector_data.buffer));
            const similarity = this.cosineSimilarity(searchVector, itemVector);
            return { ...row, similarity, vector_data: undefined }; 
        });

        return items.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
    }

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

    async getDueVocabs(userId: string): Promise<any[]> {
        const req = await this.request;
        const result = await req
            .input('userId', sql.UniqueIdentifier, userId)
            .query(`
                SELECT 
                    rs.learning_item_id as id,
                    li.title as title,
                    ISNULL(uli.custom_definition, li.content) as content
                FROM ReviewState rs
                JOIN LearningItem li ON rs.learning_item_id = li.learning_item_id
                JOIN UserLearningItem uli ON rs.learning_item_id = uli.learning_item_id AND rs.user_id = uli.user_id
                WHERE rs.user_id = @userId 
                AND rs.next_review_at <= DATEADD(day, 1, CAST(GETUTCDATE() AS DATE))
        `);
        return result.recordset;
    }

    async updateVocab(userId: string, itemId: string, data: { definition?: string; listId?: string }): Promise<void> {
        const req = await this.request;
        await req
            .input('userId', sql.UniqueIdentifier, userId)
            .input('itemId', sql.UniqueIdentifier, itemId)
            .input('definition', sql.NVarChar, data.definition)
            .input('listId', sql.UniqueIdentifier, data.listId)
            .query(`UPDATE UserLearningItem 
                    SET
                        list_id = ISNULL(@listId, list_id),
                        custom_definition = ISNULL(@definition, custom_definition),
                        updated_at = GETDATE()
                    WHERE user_id = @userId AND learning_item_id = @itemId`);
    }

    async deleteVocab(userId: string, itemId: string): Promise<void> {
        const req = await this.request;
        await req
            .input('userId', sql.UniqueIdentifier, userId)
            .input('itemId', sql.UniqueIdentifier, itemId)
            .query(`DELETE FROM UserLearningItem WHERE user_id = @userId AND learning_item_id = @itemId`);
    }

    /**
     * ดึงประวัติการทบทวนย้อนหลัง 7 วัน เพื่อไปทำกราฟ
     */
    async getReviewHistory(userId: string): Promise<any[]> {
        const req = await this.request;
        const result = await req
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
}