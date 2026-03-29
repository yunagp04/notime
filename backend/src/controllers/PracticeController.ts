import { Request, Response } from 'express';
import { IVocabRepository } from '../interfaces/IVocabRepository';
import { PracticeSession } from '../managers/PracticeSession';

export class PracticeController {
    constructor(
        private repo: IVocabRepository,
        private session: PracticeSession
    ) {}

    async getTodayTasks(req: Request, res: Response) {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "ระบุ userId" });

        try {
            const tasks = await this.session.startSession(userId as string);
            return res.status(200).json(tasks);
        } catch (error) {
            return res.status(500).json({ error: "ดึงข้อมูลล้มเหลว" });
        }
    }

    async submitReview(req: Request, res: Response) {
        const { userId, itemId, rating } = req.body;
        try {
            const currentItem = await this.repo.getReviewState(itemId);
            await this.session.submitReview(currentItem, userId, rating);
            
            await this.repo.saveReviewHistory({ userId, itemId, rating, responseTime: 0, prevState: "{}" });
            return res.status(200).json({ message: "บันทึกเรียบร้อย" });
        } catch (error) {
            return res.status(500).json({ error: "บันทึกล้มเหลว" });
        }
    }
}