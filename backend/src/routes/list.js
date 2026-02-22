// backend/src/routes/list.js
import express from "express";
import sql from "mssql";
import {
  createList,
  getListByInviteCode,
  cloneList,
  getMyLists,
  getListDetail,
  getOrCreateDefaultList,
  deleteMultipleItems,
  addWordToList
} from "../services/list.service.js";

import getUserIdFromProvider from "../utils/getUserIdFromProvider.js";
import { connectDB } from "../db.Config.js";
import { analyzeVocab } from "../services/gemini.service.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;
    const pool = await connectDB();
    const userId = await getUserIdFromProvider(pool, providerId);
    const lists = await getMyLists(userId);
    res.json(lists);
  } catch (err) { res.status(500).json({ error: "Fetch lists failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;
    const { list_name, description } = req.body;
    const pool = await connectDB();
    const userId = await getUserIdFromProvider(pool, providerId);
    const result = await createList(userId, list_name, description);
    res.status(201).json(result);
  } catch (err) { res.status(500).json({ error: "Create list failed" }); }
});

router.post("/default/quick-add", async (req, res) => {
  try {
    const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;
    const { word, meaning } = req.body;
    const pool = await connectDB();
    const userId = await getUserIdFromProvider(pool, providerId);
    const listId = await getOrCreateDefaultList(userId);
    await addWordToList(userId, listId, word, meaning);
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: "Quick add failed" }); }
});

router.get("/:listId", async (req, res) => {
  try {
    const data = await getListDetail(req.params.listId);
    res.json(data);
  } catch (err) { res.status(500).json({ error: "Fetch list failed" }); }
});

router.post("/:listId/add-word", async (req, res) => {
  try {
    const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;
    const { word, meaning } = req.body;
    const pool = await connectDB();
    const userId = await getUserIdFromProvider(pool, providerId);
    await addWordToList(userId, req.params.listId, word, meaning);
    res.json({ message: "Word added successfully" });
  } catch (err) { res.status(500).json({ error: "Failed to add word" }); }
});

router.post("/:listId/bulk-delete", async (req, res) => {
  try {
    const { itemIds } = req.body;
    await deleteMultipleItems(req.params.listId, itemIds);
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ error: "Delete failed" }); }
});

// เจนความหมาย AI แบบเลือกทีละคำ
router.post("/:listId/words/:itemId/generate", async (req, res) => {
    try {
        const { word } = req.body;
        const { itemId } = req.params;
        const providerId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;

        if (!providerId) return res.status(401).json({ error: "Unauthorized" });

        const pool = await connectDB();
        // แก้ไข: ส่ง pool และ providerId ให้ถูกต้องตามที่ไฟล์ utils กำหนด
        const realUserId = await getUserIdFromProvider(pool, providerId);

        // เรียกใช้ analyzeVocab (ชื่อฟังก์ชันที่คุณมีใน gemini.service.js)
        const meaning = await analyzeVocab(word); 

        // อัปเดตข้อมูล (ใช้ GETUTCDATE() ตามมาตรฐานเดิมของคุณ)
        const result = await pool.request()
            .input("id", sql.UniqueIdentifier, itemId)
            .input("user_id", sql.UniqueIdentifier, realUserId)
            .input("content", sql.NVarChar, meaning)
            .query(`
                UPDATE li
                SET li.content = @content,
                    li.updated_at = GETUTCDATE()
                FROM dbo.LearningItem li
                INNER JOIN dbo.UserLearningItem uli ON li.learning_item_id = uli.learning_item_id
                WHERE li.learning_item_id = @id
                AND uli.user_id = @user_id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลหรือไม่มีสิทธิ์แก้ไข" });
        }

        res.json({ success: true, meaning });
    } catch (err) {
        console.error("AI Gen Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;