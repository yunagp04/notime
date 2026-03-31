import { ISpacingAlgorithm, ReviewState } from '../interfaces/ISpacingAlgorithm';

export class SM2Algorithm implements ISpacingAlgorithm {
    calculateNextReview(state: any, rating: number): any {
        // 1. Map ค่าจาก Database (ที่มี underscore) เข้าตัวแปร Local
        const difficulty = state?.difficulty || 2.5;
        const repetition = state?.repetition || 0;
        const currentInterval = state?.interval_days || 0;

        let newInterval = 1;
        let newDifficulty = difficulty;
        let newRepetition = repetition;

        if (rating >= 3) {
            // อัลกอริทึม SM-2 มาตรฐาน
            if (repetition === 0) {
                newInterval = 1;
            } else if (repetition === 1) {
                newInterval = 6;
            } else {
                newInterval = Math.round(currentInterval * difficulty);
            }
            
            // คำนวณความยากใหม่
            newDifficulty = difficulty + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
            newRepetition += 1;
        } else {
            // ตอบผิด (Rating < 3) ให้เริ่มนับหนึ่งใหม่
            newInterval = 1;
            newRepetition = 0;
        }

        if (newDifficulty < 1.3) newDifficulty = 1.3;

        // 2. ตั้งวันทบทวนถัดไปจาก "วันนี้"
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + newInterval);

        return {
            // 🎯 ส่งค่ากลับโดยระบุชื่อฟิลด์ให้ชัดเจน เพื่อไป Map ลง DB ต่อ
            difficulty: newDifficulty,
            interval_days: newInterval, 
            repetition: newRepetition,
            nextReviewAt: nextDate
        };
    }
}