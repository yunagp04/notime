// SqlNotificationRepository.ts
import { INotificationRepository } from '../interfaces/INotificationRepository';
import sql from 'mssql';
import { poolPromise } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export class SqlNotificationRepository implements INotificationRepository {
    private async getRequest() {
        const pool = await poolPromise;
        return pool.request();
    }

    async saveSubscription(userId: string, sub: any): Promise<void> {
        const req = await this.getRequest();
        await req
            .input('userId', sql.UniqueIdentifier, userId)
            .input('endpoint', sql.NVarChar, sub.endpoint)
            .input('p256dh', sql.NVarChar, sub.keys.p256dh)
            .input('auth', sql.NVarChar, sub.keys.auth)
            .query(`
                IF EXISTS (SELECT 1 FROM PushSubscription WHERE endpoint = @endpoint)
                    UPDATE PushSubscription SET user_id = @userId WHERE endpoint = @endpoint
                ELSE
                    INSERT INTO PushSubscription (subscription_id, user_id, endpoint, p256dh_key, auth_key, created_at)
                    VALUES (NEWID(), @userId, @endpoint, @p256dh, @auth, GETDATE())
            `);
    }

    async getSubscriptions(userId: string): Promise<any[]> {
        const req = await this.getRequest();
        const result = await req
            .input('userId', sql.UniqueIdentifier, userId)
            .query(`SELECT * FROM PushSubscription WHERE user_id = @userId`);
        return result.recordset;
    }

    async getPendingQueue(): Promise<any[]> {
        const req = await this.getRequest();
        const result = await req.query(`
            SELECT q.*, s.endpoint, s.p256dh_key, s.auth_key 
            FROM NotificationQueue q
            JOIN PushSubscription s ON q.user_id = s.user_id
            WHERE q.status = 'pending' AND q.scheduled_at <= GETDATE()
        `);
        return result.recordset;
    }

    async updateQueueStatus(queueId: string, status: string): Promise<void> {
        const req = await this.getRequest();
        await req
            .input('id', sql.UniqueIdentifier, queueId)
            .input('status', sql.NVarChar, status)
            .query(`UPDATE NotificationQueue SET status = @status, sent_at = GETDATE() WHERE queue_id = @id`);
    }

    async getUsersWithDueItems(maxPerNotify: number = 10): Promise<any[]> {
        const req = await this.getRequest();
        // ใช้ TOP (@max) เพื่อจำกัดจำนวนคำต่อการแจ้งเตือน 1 ครั้ง
        const result = await req
            .input('max', sql.Int, maxPerNotify)
            .query(`
                SELECT u.user_id, 
                    (SELECT COUNT(*) FROM (
                        SELECT TOP (@max) learning_item_id 
                        FROM ReviewState
                        WHERE user_id = u.user_id AND next_review_at <= GETDATE()
                        ORDER BY next_review_at ASC 
                    ) AS SubQuery) as due_count
                FROM [User] u
                WHERE EXISTS (
                    SELECT 1 FROM ReviewState rs
                    WHERE rs.user_id = u.user_id AND rs.next_review_at <= GETDATE()
                )
            `);
        return result.recordset;
    }

    async getDueCountForUser(userId: string): Promise<number> {
        const req = await this.getRequest();
        const result = await req
            .input('userId', sql.UniqueIdentifier, userId)
            .query(`
                SELECT COUNT(*) as count 
                FROM ReviewState
                WHERE user_id = @userId AND next_review_at <= GETDATE()
            `);
        return result.recordset[0]?.count || 0;
    }

    async getAllActiveSubscribers(): Promise<any[]> {
        const req = await this.getRequest();
        const result = await req.query(`
            SELECT u.user_id, u.noti_mode, u.noti_list_id 
            FROM [User] u
            WHERE EXISTS (SELECT 1 FROM PushSubscription s WHERE s.user_id = u.user_id)
        `);
        return result.recordset;
    }

    async getWordsForNotification(userId: string, mode: string, listId?: string, limit: number = 10): Promise<any[]> {
        const req = await this.getRequest();
        let query = `SELECT TOP (@limit) learning_item_id FROM ReviewState WHERE user_id = @userId AND next_review_at <= GETDATE() `;

            if (mode === 'list' && listId) {
                query += `AND list_id = @listId `;
            }
            
            if (mode === 'random') {
                query += `ORDER BY NEWID()`; 
            } else {
                query += `ORDER BY next_review_at ASC`; 
            }
        const result = await req
            .input('userId', sql.UniqueIdentifier, userId)
            .input('listId', sql.UniqueIdentifier, listId)
            .input('limit', sql.Int, limit)
            .query(query);
        return result.recordset;
    }

    async addToQueue(userId: string, itemId: string | null, scheduledAt: Date, message?: string): Promise<void> {
        const req = await this.getRequest();
        // 🎯 เพิ่มการเช็ค: ถ้ามี User คนนี้รออยู่ใน Queue สถานะ pending แล้ว "ห้ามเพิ่มซ้ำ"
        const checkQuery = `
            SELECT 1 FROM NotificationQueue 
            WHERE user_id = @userId AND status = 'pending'
        `;
        
        const existing = await req
            .input('userId', sql.UniqueIdentifier, userId)
            .query(checkQuery);

        if (existing.recordset.length > 0) {
            console.log(`⚠️ Skip: User ${userId} already has a pending notification.`);
            return;
        }
        
        await req
            .input('id', sql.UniqueIdentifier, uuidv4())
            .input('userId', sql.UniqueIdentifier, userId)
            .input('itemId', sql.UniqueIdentifier, itemId)
            .input('scheduled', sql.DateTime, scheduledAt)
            .input('message', sql.NVarChar, message || 'ได้เวลาทบทวนศัพท์แล้ว!')
            .query(`INSERT INTO NotificationQueue (queue_id, user_id, learning_item_id, scheduled_at, status, custom_message, created_at)
                    VALUES (@id, @userId, @itemId, @scheduled, 'pending', @message, GETDATE())`);
    }

    async updateNotificationSettings(userId: string, settings: any): Promise<void> {
        const req = await this.getRequest();
        await req
            .input('userId', sql.UniqueIdentifier, userId)
            .input('mode', sql.NVarChar, settings.mode)
            .input('listId', sql.UniqueIdentifier, settings.listId || null)
            .input('maxItems', sql.Int, settings.maxItems || 10)
            .query(`
                UPDATE [User] 
                SET noti_mode = @mode, 
                    noti_list_id = @listId, 
                    max_items_per_notif = @maxItems 
                WHERE user_id = @userId
            `);
    }
}