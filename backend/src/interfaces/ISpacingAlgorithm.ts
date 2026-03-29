import { LearningItem } from "../models/LearningItem";

export interface ReviewState {
    learningItemId: string;
    nextReviewAt: Date;
    difficulty: number;
    intervalDays: number;
    repetition: number;
}

export interface ISpacingAlgorithm {
    calculateNextReview(state: ReviewState, reting: number): ReviewState;
}