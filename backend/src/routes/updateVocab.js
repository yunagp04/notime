// backend/src/routes/updateVocab.js

import express from "express";
import sql from "mssql";
import { connectDB } from "../db.Config.js";


const router = express.Router();

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { title, content } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }

    const userId =
      req.headers["x-ms-client-principal-id"] || "local-test-user";

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", sql.UniqueIdentifier, id)
      .input("user_id", sql.NVarChar, userId)
      .input("title", sql.NVarChar, title)
      .input("content", sql.NVarChar, content)
      .query(`
        UPDATE dbo.LearningItem
        SET title = @title,
            content = @content,
            updated_at = GETUTCDATE()
        WHERE learning_item_id = @id
        AND user_id = @user_id
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
  // } finally {
  //   await sql.close();
  }
});

export default router;
