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
            // AZURE MODE
            const decoded = JSON.parse(Buffer.from(principal as string, "base64").toString("ascii"));
            providerUserId = decoded.userId;
            email = decoded.userDetails || 
                    decoded.claims?.find((c: any) => c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.val ||
                    decoded.claims?.find((c: any) => c.typ === "email")?.val;
            name = decoded.claims?.find((c: any) => c.typ === "name")?.val || email || "Unknown User";
            if (!email) {
                console.error("❌ Auth Error: Could not find email in Azure Principal Headers");
                console.log("🛠️ DEBUG DECODED PAYLOAD:", JSON.stringify(decoded, null, 2)); // พ่นออกมาดูว่าหน้าตาจริงๆ เป็นยังไง
                return res.status(401).json({ message: "Identity missing: Email required" });
            }
            provider = "google";
        } else if (!isAzure) {
            // DEV MODE
            console.log("🛠️ [Dev Mode] Using Mock User");
            providerUserId = "local-dev-id-001";
            email = "dev@test.com";
            name = "Developer";
            provider = "local";
        } else {
            return res.status(401).json({ message: "Unauthorized: No principal header" });
        }

        let user = await userRepo.getUserByAuthProviderID(providerUserId);

        if (!user) {
            console.log(`🚀 Registering new user: ${email} (${provider})`);
            user = await userRepo.registerNewUser({
                email,
                name,
                provider,
                providerUserId
            });
        }

        req.userId = user.user_id;
        next();

    } catch (err) {
        console.error("❌ Auth Middleware Error:", err);
        return res.status(500).json({ message: "Internal Auth Error" });
    }
};