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
            .input('id', sql.UniqueIdentifier, uuidv4())
            .input('userId', sql.UniqueIdentifier, userId)
            .input('endpoint', sql.NVarChar, sub.endpoint)
            .input('p256dh', sql.NVarChar, sub.keys.p256dh)
            .input('auth', sql.NVarChar, sub.keys.auth)
            .query(`INSERT INTO PushSubscription (subscription_id, user_id, endpoint, p256dh_key, auth_key, created_at)
                    VALUES (@id, @userId, @endpoint, @p256dh, @auth, GETDATE())`);
    }

    // ✅ เพิ่มส่วนที่ขาดหายไปเพื่อให้ Interface สมบูรณ์
    async getSubscriptions(userId: string): Promise<any[]> {
        const req = await this.getRequest();
        const result = await req
            .input('userId', sql.UniqueIdentifier, userId)
            .query(`SELECT * FROM PushSubscription WHERE user_id = @userId`);
        return result.recordset;
    }

    async addToQueue(userId: string, itemId: string, scheduledAt: Date): Promise<void> {
        const req = await this.getRequest();
        await req
            .input('id', sql.UniqueIdentifier, uuidv4())
            .input('userId', sql.UniqueIdentifier, userId)
            .input('itemId', sql.UniqueIdentifier, itemId)
            .input('scheduled', sql.DateTime, scheduledAt)
            .query(`INSERT INTO NotificationQueue (queue_id, user_id, learning_item_id, scheduled_at, status, created_at)
                    VALUES (@id, @userId, @itemId, @scheduled, 'pending', GETDATE())`);
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
}