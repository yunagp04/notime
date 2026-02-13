// backend/src/services/gemini.service.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeVocab(word) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(`${word} meaning briefly`);
    return result.response.text();
}