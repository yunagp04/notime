import { Request, Response } from 'express';
import { IVocabRepository } from '../interfaces/IVocabRepository';
import { IAIService } from '../interfaces/IAIService';
import { ISpacingAlgorithm } from '../interfaces/ISpacingAlgorithm';

export class VocabController {
    constructor(
        private repo: IVocabRepository, 
        private aiService: IAIService,
        private spacingAlgo: ISpacingAlgorithm
    ) {
        console.log("✅ VocabController Ready!");
        if (!this.repo) console.error("❌ Repo is Missing!");
    }

    async getVocabs(req: any, res: Response) {
        // 🚩 แก้ให้รับทั้ง userId และ listId จาก Query String
        const userId = req.userId;
        const listId = req.query.listId as string; 

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        try {
            // 🚩 ส่งทั้งคู่ไปที่ Repo เพื่อให้กรองข้อมูลได้ถูกต้อง
            const items = await this.repo.getAllVocabs(userId, listId); 
            return res.status(200).json(items);
        } catch (error: any) {
            console.error("SQL Error Detail:", error.message);
            return res.status(500).json({ error: "ดึงรายการล้มเหลว" });
        }
    }

    async generateOnly(req: Request, res: Response) {
        const { word } = req.body;
        try {
            if (!word) return res.status(400).json({ error: "ต้องมีคำศัพท์นะโบร" });
            
            console.log(`🤖 AI is generating definition for: ${word}`);
            const definition = await this.aiService.getDefinition(word);
            
            return res.status(200).json({ definition });
        } catch (error: any) {
            console.error("❌ AI Gen Error:", error.message);
            return res.status(500).json({ error: "AI บินไปแล้วโบร ลองใหม่นะ" });
        }
    }

    async create(req: any, res: Response) {
        const { word, listId, skipAI, definition: userDef } = req.body;
        const userId = req.userId;
        try {
            let finalDefinition = userDef;
            
            if (!skipAI && !userDef) {
                finalDefinition = await this.aiService.getDefinition(word);
            }

            const newItem = await this.repo.addVocab(listId, { 
                word, 
                definition: finalDefinition, 
                userId 
            });

            
            console.log("🔢 Step 2: Generating Embedding...");
            const vector = await this.aiService.generateEmbedding(word);

            console.log("💾 Step 3: Saving to SQL...");
            // 🚩 เช็คใน SqlVocabRepository ว่าแก้ ListEntry เป็น UserLearningItem หรือยัง
            
            await this.repo.saveEmbedding(newItem.id, vector);
            await this.repo.updateReviewState(newItem.id, userId, new Date(), 2.5, 0);

            return res.status(201).json({ message: "เพิ่มสำเร็จ", data: newItem });
        } catch (error: any) {
            console.error("❌ Add Vocab Error:", error.message); // ดูใน Terminal ว่ามันหยุดที่ Step ไหน
            return res.status(500).json({ error: "Server Error", details: error.message });
        }
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { word, definition } = req.body;
        try {
            await this.repo.updateVocab(id as string, { word, definition });
            return res.status(200).json({ message: "อัปเดตสำเร็จ" });
        } catch (error) {
            return res.status(500).json({ error: "อัปเดตล้มเหลว" });
        }
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        try {
            await this.repo.deleteVocab(id as string);
            return res.status(200).json({ message: "ลบสำเร็จ" });
        } catch (error) {
            return res.status(500).json({ error: "ลบล้มเหลว" });
        }
    }


    async getDue(req: any, res: Response) {
        // const userId = req.query.userId as string;
        const userId = req.userId;
        // if (!userId) return res.status(400).json({ error: "ต้องระบุ userId" });

        try {
            const duelist = await this.repo.getDueVocabs(userId);
            return res.status(200).json({ count: duelist.length, items: duelist });
        } catch (error) {
            console.error("getDue Error:", error);
            return res.status(500).json({ error: "ดึงข้อมูลทบทวนล้มเหลว" });
        }
    }

    async getState(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const state = await this.repo.getReviewState(id as string);
            if (!state) return res.status(404).json({ error: "ไม่พบข้อมูลสถานะ" });
            return res.status(200).json(state);
        } catch (error) {
            return res.status(500).json({ error: "ดึงสถานะล้มเหลว" });
        }
    }

    async getDashboard(req: any, res: Response) {
        const userId = req.userId;
        // if (!userId) return res.status(400).json({ error: "ระบุ userId" });

        try {
            const summary = await this.repo.getReviewSummary(userId);
            const history = await this.repo.getReviewHistory(userId);
            
            return res.status(200).json({ summary, history });
        } catch (error) {
            return res.status(500).json({ error: "ดึงข้อมูลสรุปล้มเหลว" });
        }
    }

    async getSummary(req: any, res: Response) {
        try {
            const { userId } = req.userId;

            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            // 🚩 เรียก Repository function ที่โบรมีอยู่แล้ว
            const summary = await this.repo.getReviewSummary(userId as string);
            const history = await this.repo.getReviewHistory(userId as string);
            
            res.json({
            summary, // จะได้ { New: x, Learning: y, Mastered: z, Total: n }
            history  // จะได้รายการประวัติ 7 วันล่าสุด
            });
        } catch (err) {
            res.status(500).json({ error: "ดึงสถิติสรุปไม่สำเร็จโบร" });
        }
    }

    async review(req: Request, res: Response) {
        const { userId, learningItemId, rating, responseTimeMs } = req.body;
        
        if (!userId || !learningItemId || rating === undefined) {
            return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
        }

        try {
            // ดึงสถานะปัจจุบันมาเพื่อคำนวณรอบถัดไป (Logic นี้เดี๋ยวเราไปใส่ใน Service อีกที)
            const currentState = await this.repo.getReviewState(learningItemId);
            
            // บันทึกประวัติการรีวิวลง ReviewHistory
            await this.repo.saveReviewHistory({
                userId,
                itemId: learningItemId,
                rating,
                responseTime: responseTimeMs || 0,
                prevState: JSON.stringify(currentState || {})
            });

            const result = this.spacingAlgo.calculateNextReview(currentState, rating);
            
            await this.repo.updateReviewState(
                learningItemId,
                userId,
                result.nextReviewAt as Date,
                result.difficulty,
                result.intervalDays
            );

            return res.status(200).json({
                message: "บันทึกการทบทวนสำเร็จ"
            });

        } catch (error: any) {
            console.error("Review Error:", error);
            return res.status(500).json({
                error: "บันทึกล้มเหลว", 
                SqlError: error.message, // เพิ่มบรรทัดนี้
                stack: error.stack      // (ตัวเลือก) เพิ่มบรรทัดนี้เพื่อดูว่ามันพังที่บรรทัดไหน });
            });
        }
    }

    async search(req: Request, res: Response) {
        // 🚩 ต้องดึงจาก req.query เพราะส่งมาทาง URL
        const q = req.query.q as string; 
        const userId = req.query.userId as string;

        console.log("🔍 Search Query received:", q); // เช็คใน Terminal ว่าค่าขึ้นไหม

        if (!q) {
            return res.status(400).json({ error: "กรุณาระบุคำค้นหาใน parameter q" });
        }

        try {
            // ส่ง q เข้าไปทำ Embedding
            const vector = await this.aiService.generateEmbedding(q);
            const results = await this.repo.searchByVector(userId, vector);
            
            return res.status(200).json(results);
        } catch (error: any) {
            console.error("❌ Search Error Detail:", error.message);
            return res.status(500).json({ error: "ค้นหาล้มเหลว", details: error.message });
        }
    }
}
