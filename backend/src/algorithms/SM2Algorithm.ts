import { ISpacingAlgorithm, ReviewState } from '../interfaces/ISpacingAlgorithm';

export class SM2Algorithm implements ISpacingAlgorithm {
    calculateNextReview(state: ReviewState, rating: number): ReviewState {
        let { difficulty, intervalDays, repetition } = state;

        if (rating >= 3) {
            if (intervalDays === 0) intervalDays = 1;
            else if (intervalDays === 1) intervalDays = 6;
            else intervalDays = Math.round(intervalDays * difficulty);

            difficulty = difficulty + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
        } else {
            intervalDays = 1;
        }

        if (difficulty < 1.3) difficulty = 1.3;

        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

        return {
            ...state,
            difficulty,
            intervalDays,
            repetition,
            nextReviewAt
        };
    }
}