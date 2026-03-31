import { IVocabRepository } from "../interfaces/IVocabRepository";
import { ISpacingAlgorithm, ReviewState } from "../interfaces/ISpacingAlgorithm";

export class PracticeSession {
    constructor(
        private repo: IVocabRepository,
        private algorithm: ISpacingAlgorithm
    ) {}

    /**
     * ดึงคำศัพท์ที่ถึงกำหนดทบทวน (Due) สำหรับ User นั้นๆ
     */
    async startSession(userId: string) {
        // เรียกผ่าน Repo ที่เราเตรียมไว้แล้ว
        return await this.repo.getDueVocabs(userId);
    }

    /**
     * จัดการ Logic การตอบ (Rating) และอัปเดตวันทบทวนถัดไป
     */
    async submitReview(item: any, userId: string, rating: number) {
        // 1. แปลงข้อมูลจาก DB ให้เป็น Format ที่ Algorithm เข้าใจ (ReviewState)
        const currentState: ReviewState = {
            learningItemId: item.learning_item_id,
            nextReviewAt: item.next_review_at,
            difficulty: item.difficulty || 0,
            intervalDays: item.interval_days || 0,
            repetition: item.repetition || 0
        };

        // 2. ใช้ Algorithm (SM-2/FSRS) คำนวณค่าใหม่
        const result = this.algorithm.calculateNextReview(currentState, rating);

        // 3. สั่ง Repo ให้อัปเดตค่าที่คำนวณได้ลง Database
        await this.repo.updateReviewState(
            result.learningItemId,
            userId,
            result.nextReviewAt,
            result.difficulty,
            result.intervalDays
        );

        return result;
    }
}