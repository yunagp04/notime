import { PostgresUserRepository } from "../repositories/PostgresUserRepository"; // เปลี่ยนที่นี่
import { PostgresListRepository } from "../repositories/PostgresListRepository"; // เปลี่ยนที่นี่
import { supabase } from "../config/supabaseClient"; // Import supabase มาด้วย

const userRepo = new PostgresUserRepository(supabase); // เปลี่ยนเป็น Postgres
const listRepo = new PostgresListRepository(supabase); // เปลี่ยนเป็น Postgres

// import { Request, Response } from "express";
// import { SqlUserRepository } from "../repositories/SqlUserRepository";
// import { SqlListRepository } from "../repositories/SqlListRepository";

// const userRepo = new SqlUserRepository();
// const listRepo = new SqlListRepository();

export class AuthController {

//     /**
//      * 🛡️ ฟังก์ชันเช็คสถานะการ Login และ Sync ข้อมูล User (Azure Easy Auth)
//      */
    async me(req: any, res: any) {

        try {
            let providerUserId: string;
            let email: string;
            let name: string;

            // 🚩 ตัด logic เช็ค Azure ออกไปเลยครับถ้าไม่ใช้แล้ว
            // สมมติใน Render เราจะใช้ระบบ Login แบบปกติ หรือ Dev mode ไปก่อน
            providerUserId = req.body.userId || "local-dev-id-001"; 
            email = req.body.email || "dev@test.com";
            name = req.body.name || "Developer";
                // --- 2. ค้นหาหรือลงทะเบียน User ---
            let user = await userRepo.getUserByAuthProviderID(providerUserId);

            if (!user) {
                console.log("🔥 New user detected -> Registering...");
                user = await userRepo.registerNewUser({
                    email,
                    name,
                    provider: "google",
                    // provider: isAzure ? "google" : "local",
                    providerUserId
                });
            }

            // --- 3. 🛡️ เช็คและสร้างลิสต์ (เกราะป้องกัน User ไม่มีลิสต์) ---
            const defaultListId = await listRepo.getOrCreateDefaultList(user.user_id);
            
            console.log(`✅ User ${user.user_id} is ready with List: ${defaultListId}`);

            // --- 4. ส่งข้อมูลกลับ ---
            return res.json({ 
                userId: user.user_id,
                defaultListId: defaultListId
            });

        } catch (err: any) {
            console.error("❌ AuthController Error:", err.message);
            return res.status(500).json({ error: "Authentication failed" });
        }
    }
}