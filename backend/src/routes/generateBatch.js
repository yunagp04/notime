import express from "express";
import { analyzeBatch } from  "../services/gemini.service.js";
import db from "../db.js";

const router = express.Router();

let isGenerating = false;

router.post("/generate", async (req, res) => {
    if (isGenerating) {
        return res.status(429).json({ message: "Generation already in progress" });
    }

    try {
        isGenerating = true;

        const [rows] = await db.query(
            "SELECT id, title FROM vocabs WHERE contents IS NULL OR content = '' LIMIT 30"
        );

        if (rows.length === 0) {
            isGenerating = false;
            return res.json({ message: "No words to generate" });
        }

        const aiText = await analyzeBatch(rows);
        const parsed = JSON.parse(aiText);

        for (const item of parsed) {
            await db.query(
                "UPDATE vocabs SET content = ? WHERE title = ?",
                [item.meaning, item.title]
            );
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