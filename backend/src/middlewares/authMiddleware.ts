import { Request, Response, NextFunction } from "express";
import { SqlUserRepository } from "../repositories/SqlUserRepository"; // ✅ เปลี่ยนเป็น UserRepository

const userRepo = new SqlUserRepository();

export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
    try {
        const principal = req.headers["x-ms-client-principal"];
        const isAzure = !!process.env.WEBSITE_HOSTNAME;

        let providerUserId: string | undefined;
        let email: string | undefined;
        let name: string | undefined;
        let provider: string;

        if (principal) {
            // --- AZURE MODE ---
            const decoded = JSON.parse(Buffer.from(principal as string, "base64").toString("ascii"));
            const claims = decoded.claims || [];

            // ฟังก์ชันช่วยดึงค่าจาก Claims หลายชื่อ (Fallback)
            const getClaim = (types: string[]) => claims.find((c: any) => types.includes(c.typ))?.val;

            // 🎯 ดึง ID จาก nameidentifier (จาก Payload จริงของคุณ Paweena)
            providerUserId = decoded.userId || getClaim([
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
                "sub"
            ]);

            // 📧 ดึง Email
            email = decoded.userDetails || getClaim([
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
                "email"
            ]);

            // 👤 ดึง Name
            name = getClaim(["name"]) || email || "Unknown User";

            // 🚨 Safety Guard: ถ้า ID หรือ Email ยังเป็น NULL ห้ามไปต่อ
            if (!providerUserId || !email) {
                console.error("❌ Auth Error: Missing Identity Data");
                console.log("🛠️ DEBUG PAYLOAD:", JSON.stringify(decoded, null, 2));
                return res.status(401).json({ 
                    message: "Identity missing", 
                    details: { hasId: !!providerUserId, hasEmail: !!email } 
                });
            }

            provider = "google";
        } else if (!isAzure) {
            // --- DEV MODE ---
            providerUserId = "local-dev-id-001";
            email = "dev@test.com";
            name = "Developer";
            provider = "local";
        } else {
            return res.status(401).json({ message: "Unauthorized: No principal header" });
        }

        // --- DATABASE LOGIC ---
        let user = await userRepo.getUserByAuthProviderID(providerUserId);

        if (!user) {
            console.log(`🔥 Registering new user: ${email} (ID: ${providerUserId})`);
            user = await userRepo.registerNewUser({
                email,
                name,
                provider,
                providerUserId
            });
        }

        req.userId = user.user_id;
        next();

    } catch (err: any) {
        console.error("❌ Auth Middleware Error:", err.message);
        return res.status(500).json({ message: "Authentication failed" });
    }
};