// backend/src/services/base.service.js
import { connectDB } from "../config/db.Config.js";
import sql from "mssql";

export class BaseService {
  constructor(tableName, idColumn) {
    this.tableName = tableName; // เช่น 'dbo.LearningItem'
    this.idColumn = idColumn;   // เช่น 'learning_item_id'
  }

  async getAll(userId, customQuery = null) {
    const pool = await connectDB();
    const query = customQuery || `
      SELECT t.* FROM ${this.tableName} t
      INNER JOIN dbo.UserLearningItem uli ON t.${this.idColumn} = uli.learning_item_id
      WHERE uli.user_id = @user_id
    `;
    const result = await pool.request()
      .input("user_id", sql.UniqueIdentifier, userId)
      .query(query);
    return result.recordset;
  }

  async delete(userId, id, joinTable = "dbo.UserLearningItem", joinCol = "learning_item_id") {
    const pool = await connectDB();
    const result = await pool.request()
      .input("id", sql.UniqueIdentifier, id)
      .input("user_id", sql.UniqueIdentifier, userId)
      .query(`
        DELETE t FROM ${this.tableName} t
        INNER JOIN ${joinTable} j ON t.${this.idColumn} = j.${joinCol}
        WHERE t.${this.idColumn} = @id AND j.user_id = @user_id
      `);
    return result.rowsAffected[0] > 0;
  }

  async updateBase(userId, id, data) {
    const pool = await connectDB();
    const request = pool.request()
      .input("id", sql.UniqueIdentifier, id);

    const setClause = Object.keys(data)
        .map(key => {
            request.input(key, data[key]);
            return `${key} = @${key}`; // อัปเดตตรงๆ ที่ตารางหลัก
        })
        .join(", ");

    // ปรับ Query ให้สั้นและตรงจุด ไม่ต้อง Join ตาราง User หากไม่จำเป็น
    const query = `UPDATE ${this.tableName} SET ${setClause}, updated_at = GETUTCDATE() WHERE ${this.idColumn} = @id`;
    
    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  }
}