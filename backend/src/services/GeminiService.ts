import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAIService } from "../interfaces/IAIService";

export class GeminiService implements IAIService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private embeddingModel: any;

    constructor() {
        // ดึง API Key จาก .env
        const apiKey = process.env.GEMINI_API_KEY || "";
        this.genAI = new GoogleGenerativeAI(apiKey);

        // ใช้รุ่น Gemini 2 Flash สำหรับการประมวลผลข้อความ (เร็วและประหยัด)
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash" 
        });

        // ใช้รุ่น Embedding 2 สำหรับสร้าง Vector (เพื่อใช้ในระบบค้นหาคำที่ใกล้เคียง)
        this.embeddingModel = this.genAI.getGenerativeModel({ 
            model: "gemini-embedding-001" 
        });
    }

    async getDefinition(word: string, targetLanguage: string = 'Thai', context: string = 'General'): Promise<string> {
        try {
            // และสั่งให้คืนค่าแค่ข้อความเพียวๆ
            const prompt = `Translate the vocabulary "${word}" to ${targetLanguage}. 
                            The context is "${context}". 
                            Provide a concise definition and one short example sentence. 
                            (Return only the result, no markdown, no extra formatting)`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            
            const text = response.text().trim();
            // Fallback กรณี AI คืนค่าว่าง
            return text || "ไม่สามารถดึงข้อมูลได้ในขณะนี้"; 

        } catch (error: any) {
            // เปลี่ยนชื่อ Log ให้สื่อความหมายตามสไตล์ใหม่
            console.error("❌ GeminiService Error (getDefinition):", error.message);
            return "ไม่สามารถดึงข้อมูลได้ในขณะนี้"; 
        }
    }

    /**
     * สร้าง Embedding Vector ขนาด 768 มิติ
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            // เรียกใช้ embedContent ผ่านรุ่น Embedding 2
            const result = await this.embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (error: any) {
            console.error("Gemini SDK Error (Embedding):", error.message);
            // คืนค่า Array ว่างขนาด 768 ในกรณีที่ Error
            return new Array(768).fill(0);
        }
    }

    /**
     * เรียกใช้ AI สำหรับ Prompt ทั่วไป
     */
    async callAI(prompt: string): Promise<string> {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error("Gemini CallAI Error:", error.message);
            return "AI Error";
        }
    }
}