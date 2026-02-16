//backend/src/routes/saveVocab.js

import express from "express";
import sql from "mssql";
import { connectDB } from "../db.Config.js";


const router = express.Router();

router.post("/", async (req, res) => {
  console.log("saveVocab (SQL Version) started");

  try {
    const userId =
      req.headers["x-ms-client-principal-id"] || "local-test-user";

    const { title, content, language, metadata } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: "title และ content จำเป็นต้องมี",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("user_id", sql.NVarChar, userId)
      .input("item_type", sql.NVarChar, "vocabulary")
      .input("title", sql.NVarChar, title)
      .input("content", sql.NVarChar, content)
      .input("language", sql.NVarChar, language || "en")
      .input("metadata", sql.NVarChar, metadata || null)
      .query(`
        DECLARE @newId UNIQUEIDENTIFIER = NEWID();

        INSERT INTO dbo.LearningItem (
            learning_item_id, user_id, item_type, title, content,
            language, metadata, created_at, updated_at
        )
        VALUES (
            @newId, @user_id, @item_type, @title, @content,
            @language, @metadata, GETUTCDATE(), GETUTCDATE()
        );

        SELECT @newId AS id;
      `);

    res.status(201).json({
      message: "บันทึกสำเร็จ!",
      id: result.recordset[0].id,
      user: userId,
    });
  } catch (error) {
    console.error("SQL ERROR:", error);
    res.status(500).json({
      error: error.message,
    });
//   } finally {
//     await sql.close();
  }
});

export default router;
