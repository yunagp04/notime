// backend/src/routes/getVocabs.js

import express from "express";
import sql from "mssql";
import { connectDB } from "../db.Config.js";
import getUserIdFromProvider from "../utils/getUserIdFromProvider.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const providerId = req.headers["x-ms-client-principal-id"] ||
                       process.env.DEV_PROVIDER_ID;

    if (!providerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const pool = await connectDB();
    const realUserId = await getUserIdFromProvider(pool, providerId);

    const { recordset } = await pool.request()
      .input("user_id", sql.UniqueIdentifier, realUserId)
      .query(`
        SELECT 
          li.learning_item_id AS id,
          li.title,
          li.content,
          li.created_at,
          li.updated_at
        FROM dbo.LearningItem li
        INNER JOIN dbo.UserLearningItem uli
          ON li.learning_item_id = uli.learning_item_id
        WHERE uli.user_id = @user_id
        ORDER BY li.created_at DESC
      `);

    res.json(recordset);

  } catch (err) {
    console.error("GET VOCABS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch vocabs" });
  }
});

export default router;