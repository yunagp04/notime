import { ISpacingAlgorithm, ReviewState } from '../interfaces/ISpacingAlgorithm';

export class SM2Algorithm implements ISpacingAlgorithm {
    calculateNextReview(state: any, rating: number): any {
        const currentState = state || {
            difficulty: 2.5,
            intervalDays: 0,
            repetition: 0
        };

        let { difficulty, intervalDays, repetition } = currentState

        if (rating >= 3) {
            if (intervalDays === 0) intervalDays = 1;
            else if (intervalDays === 1) intervalDays = 6;
            else intervalDays = Math.round(intervalDays * difficulty);

            difficulty = difficulty + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
            repetition += 1; // ✅ เพิ่มบรรทัดนี้ เพื่อให้ระบบรู้ว่าจำได้ต่อเนื่องกี่ครั้งแล้ว
        } else {
            repetition = 0;   // ✅ ตอบผิดให้รีเซ็ตเป็น 0 (มีอยู่แล้ว)
            intervalDays = 1;
        }

        if (difficulty < 1.3) difficulty = 1.3;

        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + intervalDays || 1);

        return {
            ...currentState,            // ✅ เอา Spread ไว้บรรทัดแรก
            difficulty: difficulty || 2.5,
            intervalDays: intervalDays || 1,
            repetition: repetition || 0,
            nextReviewAt: nextDate
        };
    }
}