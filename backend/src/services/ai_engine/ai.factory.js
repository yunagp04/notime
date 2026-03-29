import { analyzeVocabGemini, analyzeBatchGemini } from "./gemini.service.js";

export const aiFactory = {
  getProvider(providerName = "gemini") {
    switch (providerName.toLowerCase()) {
      case "gemini":
        return {
          analyze: analyzeVocabGemini,
          analyzeBatch: analyzeBatchGemini
        };
        
      default:
        throw new Error("Provider not supported");
    }
  }
};