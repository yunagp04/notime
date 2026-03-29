import { IVocabRepository } from "../interfaces/IVocabRepository";
import { ISpacingAlgorithm, ReviewState } from "../interfaces/ISpacingAlgorithm";

export class PracticeSession {
    constructor(
        private repo: IVocabRepository,
        private algorithm: ISpacingAlgorithm
    ) {}

    async startSession(userId: string) {
        return await this.repo.getDueVocabs(userId);
    }

    async submitReview(item: ReviewState, userId: string, quality: number) {

        const result = this.algorithm.calculateNextReview(item, quality);

        await this.repo.updateReviewState(
            result.learningItemId,
            userId,
            result.nextReviewAt,
            result.difficulty,
            result.intervalDays
        );
    }
}