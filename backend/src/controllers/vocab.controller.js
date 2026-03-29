import { vocabService } from "../services/vocab.service.js";
import { connectDB } from "../config/db.Config.js";
import getUserIdFromProvider from "../utils/getUserIdFromProvider.js";
import sql from "mssql";
import { aiFactory } from "../services/ai_engine/ai.factory.js";

export const vocabController = {
  async getVocabs(req, res) {
    try {
      const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;
      if (!providerId) return res.status(401).json({ error: "Unauthorized" });

      const pool = await connectDB();
      const realUserId = await getUserIdFromProvider(pool, providerId);
      
      const vocabs = await vocabService.getAll(realUserId);
      res.json(vocabs);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch vocabs" });
    }
  },

  async saveVocab(req, res) {
    try {
      const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;
      const { title, content, language, metadata } = req.body;
      
      if (!title) return res.status(400).json({ error: "title จำเป็นต้องมี" });

      const pool = await connectDB();
      // ดึง userId จากตาราง UserAuthProvider โดยตรง
      const userRes = await pool.request()
            .input("pId", sql.NVarChar, providerId)
            .query("SELECT user_id FROM dbo.UserAuthProvider WHERE provider_user_id = @pId");

      if (userRes.recordset.length === 0) return res.status(404).json({ error: "User not found" });
      const realUserId = userRes.recordset[0].user_id;

      const id = await vocabService.create(realUserId, { title, content, language, metadata });
      res.status(201).json({ message: "บันทึกสำเร็จ!", id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateVocab(req, res) {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;

      const pool = await connectDB();
      const realUserId = await getUserIdFromProvider(pool, providerId);

      const success = await vocabService.updateBase(realUserId, id, { title, content });
      if (!success) return res.status(404).json({ error: "ไม่พบข้อมูล หรือไม่มีสิทธิ์แก้ไข" });

      res.status(200).json({ message: "อัปเดตสำเร็จ!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteVocab(req, res) {
    try {
      const { id } = req.params;
      const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;

      const pool = await connectDB();
      const realUserId = await getUserIdFromProvider(pool, providerId);

      const success = await vocabService.delete(realUserId, id);
      if (!success) return res.status(404).json({ error: "ไม่พบข้อมูล หรือไม่มีสิทธิ์ลบ" });

      res.status(200).json({ message: "ลบข้อมูลสำเร็จ!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async generateSingle(req, res) {
    const startTime = Date.now(); // เริ่มจับเวลา
    try {
        const { id } = req.params;
        console.log(`\n[${new Date().toLocaleTimeString()}] 🪄 Starting Single AI Gen for ID: ${id}`);
        const pool = await connectDB();
        const result = await pool.request().input("id", sql.UniqueIdentifier, id).query("SELECT title FROM dbo.LearningItem WHERE learning_item_id = @id");
        
        if (result.recordset.length === 0) return res.status(404).json({ error: "ไม่พบคำศัพท์" });

        const word = result.recordset[0].title;
        console.log(`🔍 Processing word: "${word}"`);

        const ai = aiFactory.getProvider("gemini");
        const meaning = await ai.analyze(word); // ใช้ analyze แทน analyzeBatch

        await vocabService.updateBase(null, id, { content: meaning }); // อัปเดตลง DB
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Success! Word: "${word}" | Time used: ${duration}s`);

        res.json({ meaning, duration });
    } catch (err) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Single AI Gen failed after ${duration}s:`, err.message);
        res.status(500).json({ error: "Single AI Gen failed", details: err.message }); 
    }
  }
};