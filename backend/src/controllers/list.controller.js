// backend/src/controllers/list.controller.js
import { listService } from "../services/list.service.js";
import { connectDB } from "../config/db.Config.js";
import getUserIdFromProvider from "../utils/getUserIdFromProvider.js";
import sql from "mssql";

export const listController = {
  async getMyLists(req, res) {
    try {
      const pool = await connectDB();
      const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;
      const userId = await getUserIdFromProvider(pool, providerId);
      const lists = await listService.getMyLists(userId);
      res.json(lists);
    } catch (err) { res.status(500).json({ error: "Fetch lists failed" }); }
  },

  async create(req, res) {
    try {
      const pool = await connectDB();
      const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;
      const userId = await getUserIdFromProvider(pool, providerId);
      
      const { list_name, description } = req.body; 
      const result = await listService.createList(userId, { list_name, description });
      
      res.status(201).json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async updateList(req, res) {
        try {
            const { listId } = req.params;
            const { list_name } = req.body;
            const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;

            const pool = await connectDB();
            const realUserId = await getUserIdFromProvider(pool, providerId);

            // เรียกใช้ Service เพื่ออัปเดตชื่อ
            const success = await listService.update(realUserId, listId, { list_name });
            if (!success) return res.status(404).json({ error: "ไม่พบกลุ่มคำ หรือไม่มีสิทธิ์แก้ไข" });

            res.json({ message: "แก้ไขชื่อกลุ่มสำเร็จ" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async deleteList(req, res) {
        try {
            const { listId } = req.params;
            const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;

            const pool = await connectDB();
            const realUserId = await getUserIdFromProvider(pool, providerId);

            // เรียกใช้ Service เพื่อลบเฉพาะความสัมพันธ์ (คำศัพท์ใน LearningItem จะไม่หาย)
            const success = await listService.delete(realUserId, listId);
            if (!success) return res.status(404).json({ error: "ไม่พบกลุ่มคำ หรือไม่มีสิทธิ์ลบ" });

            res.json({ message: "ลบกลุ่มคำเรียบร้อย (คำศัพท์ยังอยู่ในคลังหลัก)" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

  async getDetail(req, res) {
    try {
      const data = await listService.getListDetail(req.params.listId);
      res.json(data);
    } catch (err) { res.status(500).json({ error: "Fetch list failed" }); }
  },

  async addWord(req, res) {
    try {
      const { word, meaning } = req.body;
      const { listId } = req.params;

      const pool = await connectDB();
      // 1. ประกาศตัวแปรชื่อ providerUserId
      const providerUserId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;

      // 2. ตอนใช้งาน (input) ต้องใช้ชื่อเดียวกันคือ providerUserId
      const userRes = await pool.request()
            .input("pId", sql.NVarChar, providerUserId) 
            .query("SELECT user_id FROM dbo.UserAuthProvider WHERE provider_user_id = @pId");
      
      if (userRes.recordset.length === 0) {
          return res.status(404).json({ error: "ไม่พบ User นี้ในระบบ" });
      }
      
      const userId = userRes.recordset[0].user_id;

      await listService.addWordToList(userId, listId, word, meaning);
      
      res.json({ message: "Word added successfully" });
    } catch (err) { 
        console.error("❌ Add Word Error:", err.message);
        res.status(500).json({ error: err.message }); 
    }
  },

  async bulkDelete(req, res) {
    try {
      const { itemIds } = req.body;
      await listService.deleteMultipleItems(req.params.listId, itemIds);
      res.json({ message: "Deleted successfully" });
    } catch (err) { res.status(500).json({ error: "Delete failed" }); }
  }
};