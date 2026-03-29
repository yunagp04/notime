import { IAIService } from "../interfaces/IAIService";

export class VectorService {
    constructor(private aiService: IAIService) {}

    async convertToVector(text: string): Promise<number[]> {

        console.log(`Converting "${text}" to Vector...`);
        return [0.12, -0.5, 0.88];
    }

    async findSemanticSimilar(vector: number[], limit: number = 5) {
        console.log("Searching for similar words in database...");
    }
}