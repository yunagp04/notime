import { LearningItem } from "../models/LearningItem";

export interface IVocabRepository {
    getDueVocabs(userId: string): Promise<LearningItem[]>;
    updateReviewState(itemId: string, userId: string, nextReview: Date, difficulty: number, interval: number): Promise<void>;
    getUserByAuthProviderID(providerId: string): Promise<any>;
    registerNewUser(authData: any): Promise<any>;
    addVocab(listId: string, item: any): Promise<any>;
    saveEmbedding(itemId: string, vector: number[]): Promise<void>;
    saveReviewHistory(history: any): Promise<void>;
    getReviewState(itemId: string): Promise<any>;
    getReviewSummary(userId: string): Promise<any>;
    getReviewHistory(userId: string): Promise<any[]>;
    getAllVocabs(userId: string, listId?: string): Promise<any[]>;
    updateVocab(itemId: string, item: { word: string, definition: string }): Promise<void>;
    deleteVocab(itemId: string): Promise<void>;
    searchByVector(userId: string, searchVector: number[]): Promise<any[]>;
    saveSubscription(userId: string, subscription: any): Promise<void>;
    getAllVocabs(userId: string, listId?: string): Promise<any[]>;
}