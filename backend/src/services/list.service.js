// backend/src/services/list.service.js
import sql from "mssql";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "../db.Config.js";

export async function getMyLists(userId) {
  const pool = await connectDB();
  const result = await pool.request()
    .input("userId", sql.UniqueIdentifier, userId)
    .query(`
      SELECT ul.*, 
        (SELECT COUNT(*) FROM dbo.ListEntry le WHERE le.list_id = ul.list_id) AS total_words
      FROM dbo.UserList ul
      JOIN dbo.ListMember lm ON ul.list_id = lm.list_id
      WHERE lm.user_id = @userId
      ORDER BY ul.created_at DESC
    `);
  return result.recordset;
}

export async function getListDetail(listId) {
  const pool = await connectDB();
  const result = await pool.request()
    .input("listId", sql.UniqueIdentifier, listId)
    .query(`
      SELECT li.* FROM dbo.ListEntry le
      JOIN dbo.LearningItem li ON le.learning_item_id = li.learning_item_id
      WHERE le.list_id = @listId
      ORDER BY le.added_at DESC
    `);
  return result.recordset;
}

// แก้ไขฟังก์ชันเพิ่มคำศัพท์ให้ครบ 3 ตาราง
export async function addWordToList(userId, listId, word, meaning) {
    const pool = await connectDB();
    const itemId = uuidv4();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
        const request = new sql.Request(transaction);
        
        // 1. บันทึกคำศัพท์หลัก
        await request
            .input("itemId", sql.UniqueIdentifier, itemId)
            .input("title", sql.NVarChar, word)
            .input("content", sql.NVarChar, meaning || null)
            .query(`INSERT INTO dbo.LearningItem (learning_item_id, item_type, title, content, created_at, updated_at, language) 
                    VALUES (@itemId, 'vocabulary', @title, @content, GETUTCDATE(), GETUTCDATE(), 'en')`);
        
        // 2. บันทึกสิทธิ์เจ้าของ (UserLearningItem) - จำเป็นสำหรับการ Update/Generate
        await request
            .input("uId", sql.UniqueIdentifier, userId)
            .input("liId", sql.UniqueIdentifier, itemId)
            .query(`INSERT INTO dbo.UserLearningItem (user_id, learning_item_id, role, added_at) 
                    VALUES (@uId, @liId, 'owner', GETUTCDATE())`);

        // 3. เชื่อมเข้า List (ListEntry)
        await request
            .input("listId", sql.UniqueIdentifier, listId)
            .input("idItem", sql.UniqueIdentifier, itemId)
            .query(`INSERT INTO dbo.ListEntry (list_id, learning_item_id, added_at) 
                    VALUES (@listId, @idItem, GETUTCDATE())`);
        
        await transaction.commit();
        return itemId;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

export async function getOrCreateDefaultList(userId) {
  const pool = await connectDB();
  const result = await pool.request()
    .input("userId", sql.UniqueIdentifier, userId)
    .query(`SELECT ul.list_id FROM dbo.UserList ul 
            JOIN dbo.ListMember lm ON ul.list_id = lm.list_id 
            WHERE lm.user_id = @userId AND ul.list_name = 'New Items'`);

  if (result.recordset.length > 0) return result.recordset[0].list_id;
  const { listId } = await createList(userId, "New Items", "Default list for quick add");
  return listId;
}

export async function createList(userId, listName, description) {
  const pool = await connectDB();
  const listId = uuidv4();
  const inviteCode = uuidv4().slice(0, 8);
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const request = new sql.Request(transaction);
    await request
      .input("listId", sql.UniqueIdentifier, listId)
      .input("listName", sql.NVarChar, listName)
      .input("description", sql.NVarChar, description || null)
      .input("inviteCode", sql.NVarChar, inviteCode)
      .query(`INSERT INTO dbo.UserList (list_id, list_name, created_at, description, is_public, invite_code)
              VALUES (@listId, @listName, SYSDATETIME(), @description, 0, @inviteCode)`);

    await request
      .input("mlId", sql.UniqueIdentifier, listId)
      .input("muId", sql.UniqueIdentifier, userId)
      .query(`INSERT INTO dbo.ListMember (list_id, user_id, user_role, joined_at)
              VALUES (@mlId, @muId, 'owner', SYSDATETIME())`);

    await transaction.commit();
    return { listId };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function deleteMultipleItems(listId, itemIds) {
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    for (const itemId of itemIds) {
      await pool.request()
        .input("listId", sql.UniqueIdentifier, listId)
        .input("itemId", sql.UniqueIdentifier, itemId)
        .query(`DELETE FROM dbo.ListEntry WHERE list_id = @listId AND learning_item_id = @itemId`);
    }
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function cloneList(userId, sourceListId) {
  const pool = await connectDB();
  const listData = await pool.request()
    .input("id", sql.UniqueIdentifier, sourceListId)
    .query("SELECT list_name, description FROM dbo.UserList WHERE list_id = @id");
  if (listData.recordset.length === 0) throw new Error("Source list not found");
  const { list_name, description } = listData.recordset[0];
  return await createList(userId, `${list_name} (Copy)`, description);
}

export async function getListByInviteCode(code) {
  const pool = await connectDB();
  const result = await pool.request()
    .input("code", sql.NVarChar, code)
    .query("SELECT * FROM dbo.UserList WHERE invite_code = @code");
  return result.recordset[0];
}