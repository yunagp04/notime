//backend/src/routes/getVocabs.js

import express from "express";
import sql from "mssql";
import { connectDB } from "../db.Config.js";

const router = express.Router();

router.get("/", async (req, res) => {
  console.log("getVocabs (SQL Version with Auth) started");

  try {
    const userId =
      req.headers["x-ms-client-principal-id"] || "11111111-1111-1111-1111-111111111111";

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const pool = await connectDB();

    console.log("userId:", userId);


    const result = await pool
      .request()
      .input("user_id", sql.UniqueIdentifier, userId)
      .query(`
        SELECT li.learning_item_id as id,
               li.title,
               li.content,
               li.language,
               li.metadata,
               li.created_at
        FROM dbo.LearningItem li
        JOIN dbo.UserLearningItem uli
          ON li.learning_item_id = uli.learning_item_id
        WHERE uli.user_id = @user_id
        ORDER BY li.created_at DESC
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
