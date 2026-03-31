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
}