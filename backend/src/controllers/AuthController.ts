import { Request, Response } from "express";
import { SqlUserRepository } from "../repositories/SqlUserRepository";
import { SqlListRepository } from "../repositories/SqlListRepository";

const userRepo = new SqlUserRepository();
const listRepo = new SqlListRepository();

export class AuthController {

//     /**
//      * 🛡️ ฟังก์ชันเช็คสถานะการ Login และ Sync ข้อมูล User (Azure Easy Auth)
//      */
    async me(req: any, res: Response) {
        try {
            const principal = req.headers["x-ms-client-principal"];
            const isAzure = process.env.WEBSITE_HOSTNAME ? true : false;
            let providerUserId: string;
            let email: string;
            let name: string;

            // --- 1. จัดการเรื่องตัวตน (Identity) ---
            if (!principal && !isAzure) {
                // DEV MODE
                providerUserId = "local-dev-id-001";
                email = "dev@test.com";
                name = "Developer";
            } else if (principal) {
                // AZURE MODE
                const decoded = JSON.parse(Buffer.from(principal as string, "base64").toString("ascii"));
                providerUserId = decoded.userId;
                email = decoded.userDetails;
                name = decoded.userDetails;
            } else {
                return res.status(401).json({ message: "Not logged in" });
            }

            // --- 2. ค้นหาหรือลงทะเบียน User ---
            let user = await userRepo.getUserByAuthProviderID(providerUserId);

            if (!user) {
                console.log("🔥 New user detected -> Registering...");
                user = await userRepo.registerNewUser({
                    email,
                    name,
                    provider: isAzure ? "google" : "local",
                    providerUserId
                });
                // หมายเหตุ: ตรงนี้ไม่ต้องเรียก createDefaultList แล้ว 
                // เพราะเราจะไปใช้ getOrCreate ด้านล่างแทนเพื่อความชัวร์
            }

            // --- 3. 🛡️ จุดสำคัญ: เช็คและสร้างลิสต์ (เกราะป้องกัน User ไม่มีลิสต์) ---
            // ฟังก์ชันนี้จะเช็คใน DB ว่า user_id นี้มีลิสต์หรือยัง 
            // ถ้าไม่มีจะสร้างให้ ถ้ามีแล้วจะแค่ส่ง ID กลับมา
            const defaultListId = await listRepo.getOrCreateDefaultList(user.user_id);
            
            console.log(`✅ User ${user.user_id} is ready with List: ${defaultListId}`);

            // --- 4. ส่งข้อมูลกลับ ---
            return res.json({ 
                userId: user.user_id,
                defaultListId: defaultListId // ส่งกลับไปให้หน้าบ้านเก็บไว้ใช้ Add คำศัพท์ได้เลย
            });

        } catch (err: any) {
            console.error("❌ AuthController Error:", err.message);
            return res.status(500).json({ error: "Authentication failed" });
        }
    }
//     async me(req: any, res: Response) {
//         try {
// const principal = req.headers["x-ms-client-principal"];
//         const isAzure = process.env.WEBSITE_HOSTNAME ? true : false;

//         // 🛠️ DEV MODE MOCK
//         if (!principal && !isAzure) {
//             const mockId = "local-dev-id-001";
//             let user = await userRepo.getUserByAuthProviderID(mockId);
//             if (!user) {
//                 user = await userRepo.registerNewUser({
//                     email: "dev@test.com", name: "Developer",
//                     provider: "local", providerUserId: mockId
//                 });
//                 await listRepo.createDefaultList(user.user_id);
//             }
//             return res.json({ userId: user.user_id });
//         }

//         if (!principal) {
//             return res.status(401).json({ message: "Not logged in" });
//         }

//         // 1. ถอดรหัสข้อมูลจาก Azure Header
//         const decoded = JSON.parse(
//             Buffer.from(principal as string, "base64").toString("ascii")
//         );

//         const providerUserId = decoded.userId; // Google ID หรือ Provider ID
//         const email = decoded.userDetails;
//         const name = decoded.userDetails; // หรือ field อื่นที่เก็บชื่อ

//         // 2. ค้นหา User ในตาราง User/UserAuthProvider
//         let user = await userRepo.getUserByAuthProviderID(providerUserId);

//         if (!user) {
//             console.log("🔥 New user → Auto register");

//             // 3. ถ้ายังไม่มี ให้ Register ใหม่
//             const newUser = await userRepo.registerNewUser({
//                 email,
//                 name,
//                 provider: "google",
//                 providerUserId
//             });

//             // 4. สร้าง Default List ให้ User ใหม่ทันที
//             await listRepo.createDefaultList(newUser.user_id);

//                 user = { user_id: newUser.user_id };
//         }

//         // 5. ส่ง userId กลับไปให้หน้าบ้านเอาไปใช้ต่อ
//         return res.json({
//             userId: user.user_id
//         });

//         } catch (err) {
//             console.error("Auth error:", err);
//             return res.status(500).json({ message: "ระบบยืนยันตัวตนขัดข้อง" });
//         }
//     }
}