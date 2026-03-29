// backend/src/controllers/ai.controller.js
import { aiFactory } from "../services/ai_engine/ai.factory.js";
import { vocabService } from "../services/vocab.service.js";
import { connectDB } from "../config/db.Config.js";
import getUserIdFromProvider from "../utils/getUserIdFromProvider.js";
import sql from "mssql";

export const aiController = {
  async generateBatch(req, res) {
    try {
      const pool = await connectDB();
      const providerUserId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;

      const userRes = await pool.request()
            .input("pId", sql.NVarChar, providerUserId)
            .query("SELECT user_id FROM dbo.UserAuthProvider WHERE provider_user_id = @pId");
      
      if (userRes.recordset.length === 0) return res.status(404).json({ error: "User not found" });
      const realUserId = userRes.recordset[0].user_id;

      const { listId } = req.body;
      console.log("🔍 Debug: Generating for List ID:", listId);

      // ปรับ Query: เพิ่ม TRIM และดักจับความว่างเปล่าให้ดีขึ้น
      const query = `
        SELECT TOP 5 li.learning_item_id AS id, li.title 
        FROM dbo.LearningItem li
        INNER JOIN dbo.ListEntry le ON li.learning_item_id = le.learning_item_id
        WHERE le.list_id = @list_id
        AND (TRIM(li.content) IS NULL 
             OR TRIM(li.content) = '' 
             OR li.content LIKE '%ยังไม่มีความหมาย%'
             OR li.content LIKE '%<em>%')
      `;
      
      const { recordset: rows } = await pool.request()
          .input("list_id", sql.UniqueIdentifier, listId)
          .query(query);

      console.log("📦 Words found to generate:", rows.length);
      if (rows.length === 0) return res.json({ message: "No words to generate" });

      const ai = aiFactory.getProvider("gemini"); 
      const aiText = await ai.analyzeBatch(rows);
      
      console.log("🤖 AI Raw Response:", aiText);

      let parsed;
      try {
          const cleanJson = aiText.replace(/```json|```/g, "").trim();
          parsed = JSON.parse(cleanJson);
          // ถ้า AI ตอบมาเป็น Object ตัวเดียว ให้ยัดใส่ Array
          if (!Array.isArray(parsed)) parsed = [parsed];
      } catch (parseErr) {
          console.error("❌ JSON Parse Failed:", aiText);
          return res.status(500).json({ error: "AI response format invalid" });
      }

      for (const item of parsed) {
        const original = rows.find(r => r.title === (item.title || item.word));
        if (original) {
            await vocabService.updateBase(null, original.id, { content: item.meaning });
            // หน่วงเวลา 500ms ระหว่างบันทึกแต่ละคำเพื่อให้ Database และ API ไม่ทำงานหนักเกินไป
            await new Promise(resolve => setTimeout(resolve, 500)); 
          }
      }

      res.json({ message: "Generated successfully", count: parsed.length });
    } catch (err) {
      console.error("❌ Batch Gen Error:", err.message);
      res.status(500).json({ error: "Generate failed: " + err.message });
    }
  }
};

// export const aiController = {
//   async generateBatch(req, res) {
//     try {
//       const pool = await connectDB();
//       const providerUserId = req.headers["x-ms-client-principal-id"] || process.env.DEV_PROVIDER_ID;

//       const userRes = await pool.request()
//             .input("pId", sql.NVarChar, providerUserId)
//             .query("SELECT user_id FROM dbo.UserAuthProvider WHERE provider_user_id = @pId");
      
//       if (userRes.recordset.length === 0) return res.status(404).json({ error: "User not found" });
//       const realUserId = userRes.recordset[0].user_id;

//       const { listId } = req.body;
//       console.log("🔍 Debug: Generating for List ID:", listId);

//       // แก้ไข Query ให้สะอาดขึ้น และใช้เงื่อนไข LIKE ที่คลุมเครือข่ายข้อความในหน้าเว็บ
//       const query = `
//         SELECT TOP 3 li.learning_item_id AS id, li.title 
//         FROM dbo.LearningItem li
//         INNER JOIN dbo.ListEntry le ON li.learning_item_id = le.learning_item_id
//         WHERE le.list_id = @list_id
//         AND (li.content IS NULL 
//              OR li.content = '' 
//              OR li.content LIKE '%ยังไม่มีความหมาย%'
//              OR li.content LIKE '%<em>%')
//       `;
      
//       const { recordset: rows } = await pool.request()
//           .input("list_id", sql.UniqueIdentifier, listId)
//           .query(query);

//       console.log("📦 Words found to generate:", rows.length);

//       if (rows.length === 0) return res.json({ message: "No words to generate (Maybe they already have content?)" });

//       const ai = aiFactory.getProvider("gemini"); 
//       const aiText = await ai.analyzeBatch(rows);
      
//       console.log("🤖 AI Raw Response:", aiText); // ดูว่า AI ตอบมาเป็น JSON หรือข้อความธรรมดา

//       let parsed;
//       try {
//           // กำจัด Markdown (```json ... ```) ที่ AI มักจะใส่มาให้โดยอัตโนมัติ
//           const cleanJson = aiText.replace(/```json|```/g, "").trim();
//           parsed = JSON.parse(cleanJson);
//       } catch (parseErr) {
//           console.error("❌ JSON Parse Failed:", aiText);
//           return res.status(500).json({ error: "AI response format invalid" });
//       }

//       for (const item of parsed) {
//           // ตรวจสอบชื่อ Property ให้ตรงกับที่ AI ตอบมา (บางที AI ใช้ word แทน title)
//           const original = rows.find(r => r.title === (item.title || item.word));
//           if (original) {
//               await vocabService.updateBase(null, original.id, { content: item.meaning });
//           }
//       }

//       res.json({ message: "Generated successfully", count: parsed.length });
//     } catch (err) {
//       console.error("❌ Batch Gen Error:", err.message);
//       res.status(500).json({ error: "Generate failed: " + err.message });
//     }
//   }
// };