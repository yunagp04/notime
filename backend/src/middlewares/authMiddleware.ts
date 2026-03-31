import { Request, Response, NextFunction } from "express";
import { SqlUserRepository } from "../repositories/SqlUserRepository";

const userRepo = new SqlUserRepository();

export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
    try {
        const principal = req.headers["x-ms-client-principal"];
        const isAzure = process.env.WEBSITE_HOSTNAME ? true : false;

        // 🛠️ DEV MODE: ถ้าไม่ได้รันบน Azure และไม่มี Header ให้ใช้ User จำลอง
        if (!principal && !isAzure) {
            console.log("🛠️ [Dev Mode] Using Mock User");
            const mockProviderId = "local-dev-id-001";
            
            let user = await userRepo.getUserByAuthProviderID(mockProviderId);
            
            if (!user) {
                user = await userRepo.registerNewUser({
                    email: "dev@test.com",
                    name: "Developer",
                    provider: "local",
                    providerUserId: mockProviderId
                });
            }
            
            req.userId = user.user_id;
            return next();
        }

        // 🛡️ AZURE MODE: ถอดรหัสจาก Header จริง
        if (!principal) {
            return res.status(401).json({ message: "Unauthorized: No principal header" });
        }

        const decoded = JSON.parse(
            Buffer.from(principal as string, "base64").toString("ascii")
        );

        const user = await userRepo.getUserByAuthProviderID(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: "User not found in system" });
        }

        // แปะ userId ลงใน Request เพื่อให้ Controller อื่นๆ ใช้งาน
        req.userId = user.user_id;
        next();

    } catch (err) {
        console.error("❌ Auth Middleware Error:", err);
        return res.status(500).json({ message: "Internal Auth Error" });
    }
};