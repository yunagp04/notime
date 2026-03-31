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
}

// // NotificationController.ts
// import { Request, Response } from 'express';
// import { IUserRepository } from '../interfaces/IUserRepository';

// export class NotificationController {
//     constructor(private repo: IUserRepository) {}

//     async subscribe(req: Request, res: Response) {
//         const { userId, subscription } = req.body;
        
//         if (!userId || !subscription) {
//             return res.status(400).json({ error: "ข้อมูล Subscription ไม่ครบ" });
//         }

//         try {
//             await this.repo.saveSubscription(userId, subscription);
//             return res.status(201).json({ message: "ลงทะเบียนแจ้งเตือนสำเร็จแล้วโบร!" });
//         } catch (error: any) {
//             console.error("Subscription Error:", error.message);
//             return res.status(500).json({ error: "เซฟข้อมูลแจ้งเตือนล้มเหลว" });
//         }
//     }
// }