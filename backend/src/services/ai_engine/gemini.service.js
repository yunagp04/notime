// backend/src/services/ai_engine/gemini.service.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeVocabGemini(word) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(`แปลความหมายคำว่า ${word} ให้เหมือนพจนานุกรมโดยเป็นตัวอักษรธรรมดา ไม่มีเครื่องหมายพิเศษ ไม่เกิน 10 คำ`);
    return result.response.text();
}

export async function analyzeBatchGemini(words) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const wordList = words.map(w => w.title).join("\n");

    const prompt = `
    Generate brief Thai meanings (no reading for meaning) for the following words.
    Return ONLY valid JSON array format like:

    [
    { "title": "word1", "meaning": "..." },
    { "title": "word2", "meaning": "..." }
    ]

    Words:
    ${wordList}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const clean = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    return clean;
}