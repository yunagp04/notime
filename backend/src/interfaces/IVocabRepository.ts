import { LearningItem } from "../models/LearningItem";

export interface IVocabRepository {
// Global & User Vocab
    findGlobalItem(word: string): Promise<any | null>;
    saveGlobalItem(word: string, definition: string): Promise<string>;
    linkUserItem(userId: string, learningItemId: string, listId: string): Promise<void>;
    getAllVocabs(userId: string, listId?: string): Promise<any[]>;
    
    // SRS & Review
    initReviewState(userId: string, itemId: string): Promise<void>;
    getReviewState(userId: string, itemId: string): Promise<any | null>;
    updateReviewState(itemId: string, userId: string, nextReview: Date, difficulty: number, interval: number): Promise<void>;
    
    // Analytics
    saveReviewHistory(history: any): Promise<void>;
    getReviewSummary(userId: string): Promise<any>;
    getReviewHistory(userId: string): Promise<any[]>;

    // AI & Search
    saveEmbedding(itemId: string, vector: number[]): Promise<void>;
    searchByVector(userId: string, searchVector: number[]): Promise<any[]>;

    // Missing (อย่าลืมเติมใน Repo ด้วยนะโบร!)
    getVocabs(userId: string, listId?: string): Promise<any[]>;
    updateVocab(userId: string, itemId: string, data: { definition?: string; listId?: string }): Promise<void>;
    deleteVocab(userId: string, itemId: string): Promise<void>;
    getDueVocabs(userId: string): Promise<any[]>;

    getRandomVocabs(userId: string, limit: number): Promise<any[]>;
    getVocabsByList(userId: string, listId: string): Promise<any[]>;
}