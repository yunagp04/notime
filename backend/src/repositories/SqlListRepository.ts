import { IListRepository } from "../interfaces/IListRepository";
import sql from 'mssql'; // อย่าลืม import mssql นะครับโบร
import { poolPromise } from '../../config/db';

export class SqlListRepository implements IListRepository {
    
    constructor() {}
  async getLists(userId: string) {
    try {
      const pool = await poolPromise;
      const request = pool.request().input('userId', sql.UniqueIdentifier, userId);

      // 🔍 Query นี้จะดึงชื่อ List และนับจำนวนคำศัพท์ (Count) ใน List นั้นๆ มาด้วยครับ
    //   const query = `
    //     SELECT 
    //             ul.list_id, 
    //             ul.list_name as name, -- 🚩 เปลี่ยนจาก name เป็น list_name ตามรูป
    //             COUNT(uli.learning_item_id) as vocab_count
    //         FROM UserList ul
    //         LEFT JOIN UserLearningItem uli ON ul.list_id = uli.list_id
    //         WHERE uli.user_id = @userId -- 🚩 ใช้ user_id จากตาราง UserLearningItem แทน
    //         GROUP BY ul.list_id, ul.list_name
    //   `;

        const query = `
                SELECT 
                    ul.list_id, 
                    ul.list_name as name,
                    COUNT(uli.learning_item_id) as vocab_count
                FROM UserList ul
                -- 🚩 ย้ายเงื่อนไข userId มาไว้ใน ON ตรงนี้ครับ
                LEFT JOIN UserLearningItem uli ON ul.list_id = uli.list_id 
                                            AND uli.user_id = @userId
                -- 🚩 ลบ WHERE ข้างล่างออก เพื่อให้ลิสต์ที่ไม่มีคำศัพท์โผล่มาด้วย
                GROUP BY ul.list_id, ul.list_name
            `;

      const result = await request.query(query);
      return result.recordset; // จะได้ Array ของ { list_id, name, count }
    } catch (error) {
      console.error("SQL GetLists Error:", error);
      throw error;
    }
  }
}