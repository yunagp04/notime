// backend/src/routes/saveVocab.js

import express from "express";
import sql from "mssql";
import { connectDB } from "../db.Config.js";
import getUserIdFromProvider from "../utils/getUserIdFromProvider.js";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("saveVocab started");

  try {
    const providerId = req.headers["x-ms-client-principal-id"] ||
                       process.env.DEV_PROVIDER_ID;

    if (!providerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { title, content, language, metadata } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "title จำเป็นต้องมี",
      });
    }

    const pool = await connectDB();
  
    const realUserId = await getUserIdFromProvider(pool, providerId);

    console.log("realUserId:", realUserId);
    console.log("type:", typeof realUserId);

    const result = await pool
      .request()
      .input("user_id", sql.UniqueIdentifier, realUserId)
      .input("item_type", sql.NVarChar, "vocabulary")
      .input("title", sql.NVarChar, title)
      .input("content", sql.NVarChar, content || null)
      .input("language", sql.NVarChar, language || "en")
      .input("metadata", sql.NVarChar, metadata || null)
      .query(`
        DECLARE @newId UNIQUEIDENTIFIER = NEWID();

        INSERT INTO dbo.LearningItem (
            learning_item_id,
            item_type,
            title,
            content,
            language,
            metadata,
            created_at,
            updated_at
        )
        VALUES (
            @newId,
            @item_type,
            @title,
            @content,
            @language,
            @metadata,
            GETUTCDATE(),
            GETUTCDATE()
        );

        INSERT INTO dbo.UserLearningItem (
            user_id,
            learning_item_id,
            role,
            created_at
        )
        VALUES (
            @user_id,
            @newId,
            'owner',
            GETUTCDATE()
        );

        SELECT @newId AS id;
      `);

    res.status(201).json({
      message: "บันทึกสำเร็จ!",
      id: result.recordset[0].id,
    });

  } catch (error) {
    console.error("SQL ERROR:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;