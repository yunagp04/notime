import { Request, Response, NextFunction } from "express";
import { SqlUserRepository } from "../repositories/SqlUserRepository";

const userRepo = new SqlUserRepository();

export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
    try {
        const principal = req.headers["x-ms-client-principal"];
        const isAzure = !!process.env.WEBSITE_HOSTNAME;
        
        let providerUserId: string;
        let email: string;
        let name: string;
        let provider: string;

        if (principal) {
            // --- 1. AZURE MODE (Production) ---
            const decoded = JSON.parse(Buffer.from(principal as string, "base64").toString("ascii"));
            
            // 🎯 ดึง ID จาก nameidentifier (ID จริงที่ Google ส่งให้ Azure)
            providerUserId = decoded.claims?.find((c: any) => c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.val;

            // 📧 ดึง Email จาก emailaddress
            email = decoded.claims?.find((c: any) => c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.val;

            // 👤 ดึง Name (แสดงชื่อ Paweena Sirito)
            name = decoded.claims?.find((c: any) => c.typ === "name")?.val || email || "Unknown User";

            // 🚨 Check ป้องกัน Error 515 (ห้ามเป็น NULL)
            if (!providerUserId || !email) {
                console.error("❌ Auth Error: Identity data incomplete from Azure");
                console.log("🛠️ DEBUG DECODED PAYLOAD:", JSON.stringify(decoded, null, 2));
                return res.status(401).json({ message: "Identity missing: ID or Email not found" });
            }
            
            provider = "google";
        } else if (!isAzure) {
            // --- 2. DEV MODE (Local) ---
            console.log("🛠️ [Dev Mode] Using Mock User");
            providerUserId = "local-dev-id-001";
            email = "dev@test.com";
            name = "Developer";
            provider = "local";
        } else {
            // กรณีรันบน Azure แต่ไม่มี Header (ยังไม่ได้ Login)
            return res.status(401).json({ message: "Unauthorized: No principal header" });
        }

        // --- 3. จัดการข้อมูลใน Database ---
        let user = await userRepo.getUserByAuthProviderID(providerUserId);

        if (!user) {
            console.log(`🚀 Registering new user: ${email} (${providerUserId})`);
            user = await userRepo.registerNewUser({
                email,
                name,
                provider,
                providerUserId
            });
        }

        // --- 4. ส่งต่อข้อมูลให้ Controller อื่นๆ ---
        req.userId = user.user_id;
        next();

    } catch (err) {
        console.error("❌ Auth Middleware Error:", err);
        return res.status(500).json({ message: "Internal Auth Error" });
    }
};