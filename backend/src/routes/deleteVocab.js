//backend/src/routes/deleteVocab.js

import express from "express";
import sql from "mssql";
import { connectDB } from "../db.Config.js";


const router = express.Router();

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

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
      .query(`
        DELETE FROM dbo.LearningItem
        WHERE learning_item_id = @id
        AND user_id = @user_id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        error: "ไม่พบข้อมูล หรือไม่มีสิทธิ์ลบ",
      });
    }

    res.status(200).json({
      message: "ลบข้อมูลสำเร็จ!",
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({
      error: error.message,
    });
  // } finally {
  //   await sql.close();
  }
});

export default router;
