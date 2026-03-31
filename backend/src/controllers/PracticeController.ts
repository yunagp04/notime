import { Request, Response } from 'express';
import { IVocabRepository } from '../interfaces/IVocabRepository';
import { PracticeSession } from '../managers/PracticeSession';

export class PracticeController {
    constructor(
        private repo: IVocabRepository,
        private session: PracticeSession
    ) {}

    async getTodayTasks(req: any, res: Response) {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        try {
            const tasks = await this.session.startSession(userId as string);
            return res.status(200).json(tasks);
        } catch (error) {
            return res.status(500).json({ error: "ดึงข้อมูลล้มเหลว" });
        }
    }

    async submitReview(req: any, res: Response) {
        const { itemId, rating } = req.body;
        const userId = req.userId;

        try {
            const currentItem = await this.repo.getReviewState(userId, itemId);
            await this.session.submitReview(currentItem, userId, rating);
            await this.repo.saveReviewHistory({ 
                userId, 
                itemId, 
                rating, 
                responseTime: 0, 
                prevState: JSON.stringify(currentItem) // เก็บ state ก่อนหน้าไว้ดูย้อนหลัง
            });
            
            return res.status(200).json({ message: "บันทึกเรียบร้อย" });
        } catch (error) {
            return res.status(500).json({ error: "บันทึกล้มเหลว" });
        }
    }
}