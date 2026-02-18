import express from "express";
import sql from "mssql";
import { analyzeBatch } from  "../services/gemini.service.js";
import { connectDB } from "../db.Config.js";

const router = express.Router();

let isGenerating = false;

router.post("/generate", async (req, res) => {
    if (isGenerating) {
        return res.status(429).json({ message: "Generation already in progress" });
    }

    try {
        isGenerating = true;

        const pool = await connectDB();

        const [rows] = await pool.request().query(
            `SELECT TOP 10 learning_item_id AS id, title FROM dbo.LearningItem WHERE content IS NULL`
        );

        if (rows.length === 0) {
            isGenerating = false;
            return res.json({ message: "No words to generate" });
        }

        const aiText = await analyzeBatch(rows);
        const parsed = JSON.parse(aiText);

        for (const item of parsed) {
            const original = rows.find(r => r.title === item.title);
            if(!original)   continue;
            await pool.request()
                .input("id", sql.Int, original.id)
                .input("content", sql.NVarChar, item.meaning)
                .query(`
                    UPDATE dbo.LearningItem
                    SET content = @content
                    WHERE learning_item_id = @id"
                `);
        }

        res.json({ message: "Generated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Generate failed" });
    } finally {
        isGenerating = false;
    }
});

export default router;