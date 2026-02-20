// backend/src/routes/updateVocab.js

import express from "express";
import sql from "mssql";
import { connectDB } from "../db.Config.js";
import getUserIdFromProvider from "../utils/getUserIdFromProvider.js";

const router = express.Router();

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { title, content } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }

    const providerId = req.headers["x-ms-client-principal-id"]  ||
                       process.env.DEV_PROVIDER_ID;

    if (!providerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const pool = await connectDB();

    const realUserId = await getUserIdFromProvider(pool, providerId);

    const result = await pool
      .request()
      .input("id", sql.UniqueIdentifier, id)
      .input("user_id", sql.UniqueIdentifier, realUserId)
      .input("title", sql.NVarChar, title)
      .input("content", sql.NVarChar, content)
      .query(`
        UPDATE li
        SET li.title = @title,
            li.content = @content,
            li.updated_at = GETUTCDATE()
        FROM dbo.LearningItem li
        INNER JOIN dbo.UserLearningItem uli
            ON li.learning_item_id = uli.learning_item_id
        WHERE li.learning_item_id = @id
        AND uli.user_id = @user_id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        error: "ไม่พบข้อมูล หรือไม่มีสิทธิ์แก้ไข",
      });
    }

    res.status(200).json({
      message: "อัปเดตสำเร็จ!",
    });

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;