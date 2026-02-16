//backend/src/routes/getVocabs.js

import express from "express";
import sql from "mssql";
import { connectDB } from "../db.Config.js";


const router = express.Router();

router.get("/", async (req, res) => {
  console.log("getVocabs (SQL Version with Auth) started");

  try {
    const userId =
      req.headers["x-ms-client-principal-id"] || "local-test-user";

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("user_id", sql.NVarChar, userId)
      .query(`
        SELECT learning_item_id as id,
               title,
               content,
               language,
               metadata,
               created_at
        FROM dbo.LearningItem
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("SQL ERROR:", error);
    res.status(500).json({ error: error.message });
  // } finally {
  //   await sql.close();
  }
});

export default router;
