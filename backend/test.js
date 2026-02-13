import { analyzeVocab } from './src/services/gemini.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function runTest() {
    const result = await analyzeVocab("kawachii");
    console.log("AI says: ", result);
}
runTest();