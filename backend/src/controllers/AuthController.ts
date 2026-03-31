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
                console.log("🛠️ DEBUG AZURE USER:", JSON.stringify(decoded, null, 2));
                
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