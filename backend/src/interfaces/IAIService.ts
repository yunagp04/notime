export interface IAIService {
    getDefinition(word: string, context?: string): Promise<string>;

    // callAI(prompt: string): Promise<string>;

    generateEmbedding(text: string): Promise<number[]>;
}