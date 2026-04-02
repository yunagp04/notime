import { Request, Response } from 'express';
import { INotificationRepository } from '../interfaces/INotificationRepository';

export class NotificationController {
    constructor(private repo: INotificationRepository) {}

    async subscribe(req: any, res: Response) {
        const { subscription } = req.body; // ก้อน JSON จากหน้าบ้าน
        const userId = req.userId;
        try {
            await this.repo.saveSubscription(userId, subscription);
            return res.status(201).json({ message: "ลงทะเบียนรับแจ้งเตือนสำเร็จ" });
        } catch (error: any) {
            return res.status(500).json({ error: "ลงทะเบียนล้มเหลว", details: error.message });
        }
    }

    async updateSettings(req: any, res: Response) {
        const { mode, listId, maxItems } = req.body;
        const userId = req.userId; // ได้มาจาก authMiddleware
        
        try {
            // ส่งต่อให้ Repo ไปจัดการกับ SQL
            await this.repo.updateNotificationSettings(userId, { mode, listId, maxItems }); 
            return res.json({ message: "บันทึกการตั้งค่าการแจ้งเตือนเรียบร้อยแล้ว!" });
        } catch (error: any) {
            console.error("Update Settings Error:", error.message);
            return res.status(500).json({ error: "ไม่สามารถบันทึกการตั้งค่าได้" });
        }
    }

    async triggerWorker(req: any, res: Response) {
        try {
            console.log(`[${new Date().toLocaleString()}] ⏰ Cron-job triggered: Starting notification process...`);
            
            // 1. เรียกใช้ Method ใหม่ที่เรากำลังจะสร้างข้างล่างนี้
            const result = await this.checkAndSendNotifications();
            
            return res.status(200).json({ 
                success: true, 
                message: "Worker executed successfully",
                details: result 
            });
        } catch (error: any) {
            console.error("❌ Notification Error:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    private async checkAndSendNotifications() {
        // 1. ดึงคิวที่ถึงกำหนดส่ง (status = 'pending' และ scheduled_at <= now)
        const pendingQueue = await this.repo.getPendingQueue();
        
        if (pendingQueue.length === 0) {
            console.log("😴 No pending notifications to send.");
            return { sentCount: 0 };
        }

        console.log(`📥 Processing ${pendingQueue.length} notifications...`);

        for (const item of pendingQueue) {
            try {
                // 2. ส่งแจ้งเตือน (ตรงนี้คุณต้องใช้ Web-push Library ส่งไปที่ endpoint)
                // ตัวอย่างสมมติการเรียกส่ง:
                // await this.webPushService.send(item.pushsubscription_s, "ได้เวลาทบทวนคำศัพท์แล้ว!"); 

                // 3. อัปเดตสถานะเป็น 'sent' ใน Database
                await this.repo.updateQueueStatus(item.queue_id, 'sent');
                console.log(`✅ Sent notification for User: ${item.user_id}`);
            } catch (err) {
                console.error(`❌ Failed to send for Queue ${item.queue_id}:`, err);
                // ถ้าส่งไม่สำเร็จอาจจะอัปเดตสถานะเป็น 'failed' แทน
                await this.repo.updateQueueStatus(item.queue_id, 'failed');
            }
        }

        return { sentCount: pendingQueue.length };
    }
}
