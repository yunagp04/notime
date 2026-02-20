// backend/src/routes/generateBatch.js

import express from "express";
import sql from "mssql";
import { analyzeBatch } from "../services/gemini.service.js";
import { connectDB } from "../db.Config.js";
import getUserIdFromProvider from "../utils/getUserIdFromProvider.js";

const router = express.Router();

let isGenerating = false;

router.post("/generate", async (req, res) => {

    if (isGenerating) {
        return res.status(429).json({ message: "Generation already in progress" });
    }

    try {
        const providerId = req.headers["x-ms-client-principal-id"]   ||
                           process.env.DEV_PROVIDER_ID;

        if (!providerId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        isGenerating = true;

        const pool = await connectDB();

        const realUserId = await getUserIdFromProvider(pool, providerId);

        const { recordset: rows } = await pool.request()
            .input("user_id", sql.UniqueIdentifier, realUserId)
            .query(`
                SELECT TOP 10 li.learning_item_id AS id, li.title
                FROM dbo.LearningItem li
                INNER JOIN dbo.UserLearningItem uli
                    ON li.learning_item_id = uli.learning_item_id
                WHERE li.content IS NULL
                AND uli.user_id = @user_id
                ORDER BY li.created_at ASC
            `);

        if (rows.length === 0) {
            return res.json({ message: "No words to generate" });
        }

        const aiText = await analyzeBatch(rows);
        const parsed = JSON.parse(aiText);

        for (const item of parsed) {
            const original = rows.find(r => r.title === item.title);
            if (!original) continue;

            await pool.request()
                .input("id", sql.UniqueIdentifier, original.id)
                .input("user_id", sql.UniqueIdentifier, realUserId)
                .input("content", sql.NVarChar, item.meaning)
                .query(`
                    UPDATE li
                    SET li.content = @content,
                        li.updated_at = GETUTCDATE()
                    FROM dbo.LearningItem li
                    INNER JOIN dbo.UserLearningItem uli
                        ON li.learning_item_id = uli.learning_item_id
                    WHERE li.learning_item_id = @id
                    AND uli.user_id = @user_id
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