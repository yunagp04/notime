import { IVocabRepository } from "../interfaces/IVocabRepository";
import { IAIService } from "../interfaces/IAIService";  
import { VectorService } from "../services/VectorService";

export class VocabManager {
    constructor(
        private repo: IVocabRepository,
        private ai: IAIService,
        private vectorService: VectorService
    ) {}

    async addVocab(listId: string, word: string) {
        const definition = await this.ai.getDefinition(word);

        const vector = await this.vectorService.convertToVector(word);

        const newItem = await this.repo.addVocab(listId, {
            word,
            definition,
            vector
        });
        return newItem;
    }
}