import { Request, Response } from 'express';
import { IVocabRepository } from '../interfaces/IVocabRepository';
import { IAIService } from '../interfaces/IAIService';
import { ISpacingAlgorithm } from '../interfaces/ISpacingAlgorithm';
import { IListRepository } from '../interfaces/IListRepository';

export class VocabController {
    constructor(
        private repo: IVocabRepository, 
        private listRepo: IListRepository,
        private aiService: IAIService,
        private spacingAlgo: ISpacingAlgorithm
    ) {
        console.log("✅ VocabController Ready!");
    }

    /**
     * 🆕 เพิ่มคำศัพท์แบบ Smart Add (Global Cache)
     */
    async create(req: any, res: Response) {
        let { word, listId, skipAI, definition: userDef } = req.body;
        const userId = req.userId;

        if (!word || !userId) {
            return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน (word)" });
        }

        try {

            if (!listId) {
                listId = await this.listRepo.getOrCreateDefaultList(userId);
            }

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(listId)) {
                return res.status(400).json({ error: "รูปแบบ listId ไม่ถูกต้อง" });
            }
            
            // 1. เช็คคลังกลางก่อน (Global Cache)
            let globalItem = await this.repo.findGlobalItem(word);
            let itemId: string;

            if (globalItem) {
                itemId = globalItem.learning_item_id;
            } else {
                let finalDefinition = userDef;
                if (!skipAI && !userDef) {
                    finalDefinition = await this.aiService.getDefinition(word);
                }

                itemId = await this.repo.saveGlobalItem(word, finalDefinition || word);
                
                // Background: สร้าง Vector สำหรับค้นหา
                const vector = await this.aiService.generateEmbedding(word);
                await this.repo.saveEmbedding(itemId, vector);
            }

            // 2. ผูกเข้ากับ User และเริ่ม SRS
            await this.repo.linkUserItem(userId, itemId, listId);
            await this.repo.initReviewState(userId, itemId);

            return res.status(201).json({ success: true, itemId });
        } catch (error: any) {
            console.error("❌ Vocab Create Error:", error.message);
            return res.status(500).json({ error: "เพิ่มคำศัพท์ล้มเหลว", details: error.message });
        }
    }

    async getAllVocabs(req: any, res: Response) {
        const userId = req.userId;
        const listId = req.query.listId as string; 

        try {
            const items = await this.repo.getAllVocabs(userId, listId); 
            return res.status(200).json(items);
        } catch (error: any) {
            return res.status(500).json({ error: "ดึงรายการล้มเหลว", details: error.message });
        }
    }

    async getVocabs(req: any, res: Response) {
        const userId = req.userId;
        const { listId } = req.query; // รับค่าจาก Query String

        try {
            const vocabs = await this.repo.getVocabs(userId, listId);
            return res.status(200).json(vocabs);
        } catch (err) {
            return res.status(500).json({ error: "ดึงข้อมูลคำศัพท์ไม่สำเร็จ" });
        }
    }

    async generateOnly(req: Request, res: Response) {
        const { word } = req.body;
        try {
            if (!word) return res.status(400).json({ error: "ต้องมีคำศัพท์นะโบร" });
            const definition = await this.aiService.getDefinition(word);
            return res.status(200).json({ definition });
        } catch (error: any) {
            return res.status(500).json({ error: "AI บินไปแล้วโบร", details: error.message });
        }
    }

    async update(req: any, res: Response) {
        const { id } = req.params;
        const { listId, definition } = req.body;
        const userId = req.userId;

        try {
            await this.repo.updateVocab(userId, id, { listId, definition });
            return res.status(200).json({ message: "อัปเดตสำเร็จ" });
        } catch (error: any) {
            return res.status(500).json({ error: "อัปเดตล้มเหลว", details: error.message });
        }
    }

    async delete(req: any, res: Response) {
        const { id } = req.params;
        const userId = req.userId;

        try {
            await this.repo.deleteVocab(userId, id);
            return res.status(200).json({ message: "ลบสำเร็จ" });
        } catch (error: any) {
            return res.status(500).json({ error: "ลบล้มเหลว", details: error.message });
        }
    }

    async getDue(req: any, res: Response) {
        const userId = req.userId;
        try {
            const duelist = await this.repo.getDueVocabs(userId);
            return res.status(200).json({ count: duelist.length, items: duelist });
        } catch (error: any) {
            return res.status(500).json({ error: "ดึงข้อมูลทบทวนล้มเหลว", details: error.message });
        }
    }

    async getDashboard(req: any, res: Response) {
        console.log("🔍 Fetching dashboard for User:", req.userId);
        const userId = req.userId;
        try {
            const [summary, history] = await Promise.all([
                this.repo.getReviewSummary(userId),
                this.repo.getReviewHistory(userId)
            ]);
            return res.status(200).json({ summary, history });
        } catch (error: any) {
            return res.status(500).json({ error: "ดึงข้อมูลสถิติล้มเหลว", details: error.message });
        }
    }

    async getState(req: any, res: Response) {
        const { id } = req.params;
        const userId = req.userId;
        try {
            const state = await this.repo.getReviewState(userId, id);
            if (!state) return res.status(404).json({ error: "ไม่พบข้อมูลสถานะ" });
            return res.status(200).json(state);
        } catch (error: any) {
            return res.status(500).json({ error: "ดึงสถานะล้มเหลว", details: error.message });
        }
    }

    async review(req: any, res: Response) {
        const { learningItemId, rating, responseTimeMs } = req.body;
        const userId = req.userId;

        try {
            let currentState = await this.repo.getReviewState(userId, learningItemId);
            
            if (!currentState) {
                currentState = {
                    difficulty: 2.5,
                    intervalDays: 0,
                    repetition: 0
                };
            }

            await this.repo.saveReviewHistory({
                userId,
                itemId: learningItemId,
                rating,
                responseTime: responseTimeMs || 0,
                prevState: JSON.stringify(currentState)
            });

            const result = this.spacingAlgo.calculateNextReview(currentState, rating);
            
            const nextDate = result.nextReviewAt instanceof Date 
                ? result.nextReviewAt 
                : new Date(result.nextReviewAt);
                
            await this.repo.updateReviewState(
                learningItemId,
                userId,
                result.nextReviewAt,
                result.difficulty || 2.5,
                result.intervalDays || 1
            );

            return res.status(200).json({
                message: "บันทึกการทบทวนสำเร็จ",
                nextReviewAt: nextDate
            });
        } catch (error: any) {
            return res.status(500).json({ error: "บันทึกล้มเหลว", details: error.message });
        }
    }

    async search(req: any, res: Response) {
        const q = req.query.q as string; 
        const userId = req.userId as string;

        if (!q || !userId) return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });

        try {
            const vector = await this.aiService.generateEmbedding(q);
            const results = await this.repo.searchByVector(userId, vector);
            return res.status(200).json(results);
        } catch (error: any) {
            return res.status(500).json({ error: "การค้นหาขัดข้อง", details: error.message });
        }
    }

    async getRandomPractice(req: any, res: Response) {
        const userId = req.userId;
        const limit = parseInt(req.query.limit as string) || 10;
        
        try {
            const items = await this.repo.getRandomVocabs(userId, limit);
            return res.json(items);
        } catch (error: any) {
            return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลแบบสุ่มได้" });
        }
    }

    async getPracticeByList(req: any, res: Response) {
        const { listId } = req.params; // รับ ID ลิสต์จาก URL
        const userId = req.userId;

        try {
            const items = await this.repo.getVocabsByList(userId, listId);
            if (items.length === 0) {
                return res.status(404).json({ message: "ไม่พบคำศัพท์ในลิสต์นี้" });
            }
            return res.json(items);
        } catch (error: any) {
            return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลลิสต์" });
        }
    }

    async getSynonyms(req: any, res: Response) {
        const { word } = req.body;
        const targetLang = req.query.lang || 'Thai'; // ดึงจาก Settings ได้
        try {
            const prompt = `Give me 5 synonyms or related words for "${word}" in ${targetLang}. 
                            Return only a JSON array of strings, e.g. ["word1", "word2"]`;
            const aiResponse = await this.aiService.callAI(prompt);
            // Clean data นิดหน่อยเผื่อ AI แถม Markdown มา
            const synonyms = JSON.parse(aiResponse.replace(/```json|```/g, '')); 
            return res.json({ synonyms });
        } catch (error: any) {
            return res.status(500).json({ error: "ไม่สามารถหาคำเหมือนได้" });
        }
    }
}