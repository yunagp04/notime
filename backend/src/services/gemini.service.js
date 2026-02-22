// backend/src/services/gemini.service.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeVocab(word) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    // const result = await model.generateContent(`Generate brief English meanings for ${word} less than 10 words plain text only.`);
    const result = await model.generateContent(`I am doing seminar about NLP pitch accent. Please explain me in easy word to understand the meaning of ${word}. (max 3 sentences, 45 words), in English and translate to Thai.`);
    return result.response.text();
}

export async function analyzeBatch(words) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const wordList = words.map(w => w.title).join("\n");

    const prompt = `
    Generate brief English meanings for the following words.
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