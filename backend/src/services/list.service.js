// backend/src/services/list.service.js
import { BaseService } from "./base.service.js";
import { connectDB } from "../config/db.Config.js";
import sql from "mssql";
import { v4 as uuidv4 } from "uuid";

class ListService extends BaseService {
  constructor() {
    super("dbo.UserList", "list_id");
  }

  async createList(userId, { list_name, description }) {
    const pool = await connectDB();
    const listId = uuidv4();
    const inviteCode = uuidv4().slice(0, 8);
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    try {
      const request = new sql.Request(transaction);
      await request
        .input("listId", sql.UniqueIdentifier, listId)
        .input("listName", sql.NVarChar, list_name)
        .input("description", sql.NVarChar, description || null)
        .input("inviteCode", sql.NVarChar, inviteCode)
        .query(`INSERT INTO dbo.UserList (list_id, list_name, created_at, description, is_public, invite_code)
                VALUES (@listId, @listName, GETUTCDATE(), @description, 0, @inviteCode)`);

      await request
        .input("mlId", sql.UniqueIdentifier, listId)
        .input("muId", sql.UniqueIdentifier, userId)
        .query(`INSERT INTO dbo.ListMember (list_id, user_id, user_role, joined_at)
                VALUES (@mlId, @muId, 'owner', GETUTCDATE())`);

      await transaction.commit();
      return { listId, inviteCode };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getMyLists(userId) {
  const pool = await connectDB();
  const result = await pool.request()
    .input("user_id", sql.UniqueIdentifier, userId)
    .query(`
      SELECT ul.*, 
        (SELECT COUNT(*) FROM dbo.ListEntry le WHERE le.list_id = ul.list_id) AS total_words
      FROM dbo.UserList ul
      JOIN dbo.ListMember lm ON ul.list_id = lm.list_id
      WHERE lm.user_id = @user_id
      ORDER BY ul.created_at DESC
    `);
  return result.recordset; // คืนค่า recordset เท่านั้นเพื่อให้ map ใน JS ได้
}

  // async getMyLists(userId) {
  //   return await super.getAll(userId, `
  //     SELECT ul.*, 
  //       (SELECT COUNT(*) FROM dbo.ListEntry le WHERE le.list_id = ul.list_id) AS total_words
  //     FROM dbo.UserList ul
  //     JOIN dbo.ListMember lm ON ul.list_id = lm.list_id
  //     WHERE lm.user_id = @user_id
  //     ORDER BY ul.created_at DESC
  //   `);
  // }

  async getListDetail(listId) {
    const pool = await connectDB();
    const result = await pool.request()
      .input("listId", sql.UniqueIdentifier, listId)
      .query(`
        SELECT li.learning_item_id, li.title, li.content, li.language
        FROM dbo.LearningItem li
        INNER JOIN dbo.ListEntry le ON li.learning_item_id = le.learning_item_id
        WHERE le.list_id = @listId
        ORDER BY li.created_at DESC
      `);
    return result.recordset;
  }

  async update(userId, listId, data) {
    return await this.updateBase(userId, listId, data, "list_id");
  }

  async deleteList(userId, listId) {
    return await this.delete(userId, listId, "dbo.ListMember", "list_id");
  }

  async delete(userId, listId) {
    const pool = await connectDB();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const request = new sql.Request(transaction);
        request.input("lId", sql.UniqueIdentifier, listId);
        request.input("uId", sql.UniqueIdentifier, userId);

        // 1. ลบความเชื่อมโยงคำกับกลุ่ม (ลบเฉพาะใน ListEntry)
        await request.query("DELETE FROM dbo.ListEntry WHERE list_id = @lId");

        // 2. ลบสิทธิ์การเข้าถึงกลุ่ม
        await request.query("DELETE FROM dbo.ListMember WHERE list_id = @lId AND user_id = @uId");

        // 3. ลบตัวกลุ่ม
        await request.query("DELETE FROM dbo.UserList WHERE list_id = @lId");

        await transaction.commit();
        return true;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
  }

  async addWordToList(userId, listId, word, meaning) {
    const pool = await connectDB();
    const itemId = uuidv4(); // สร้าง ID ใหม่ให้คำศัพท์
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    try {
        const request = new sql.Request(transaction);
        // 1. บันทึกลงตารางคำศัพท์หลัก
        await request
            .input("itemId", sql.UniqueIdentifier, itemId)
            .input("title", sql.NVarChar, word)
            .input("content", sql.NVarChar, meaning || null)
            .query(`INSERT INTO dbo.LearningItem (learning_item_id, item_type, title, content, created_at)
                    VALUES (@itemId, 'vocabulary', @title, @content, GETUTCDATE())`);

        // 2. บันทึกความสัมพันธ์ลงตาราง ListEntry (เพื่อให้คำนี้ไปอยู่ในลิสต์ที่ต้องการ)
        await request
            .input("lId", sql.UniqueIdentifier, listId)
            .input("liId", sql.UniqueIdentifier, itemId)
            .query(`INSERT INTO dbo.ListEntry (list_id, learning_item_id, added_at)
                    VALUES (@lId, @liId, GETUTCDATE())`);

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        console.error("❌ SQL ERROR in addWordToList:", err.message);
        throw err;
    }
  }

  async deleteMultipleItems(listId, itemIds) {
    const pool = await connectDB();
    const request = pool.request();
    request.input("listId", sql.UniqueIdentifier, listId);
    
    // ลบความสัมพันธ์ใน ListEntry (คำศัพท์จะยังอยู่ในคลังหลัก แต่หายจากลิสต์นี้)
    for (let i = 0; i < itemIds.length; i++) {
        await request
            .input(`id${i}`, sql.UniqueIdentifier, itemIds[i])
            .query(`DELETE FROM dbo.ListEntry WHERE list_id = @listId AND learning_item_id = @id${i}`);
    }
  }
}

export const listService = new ListService();