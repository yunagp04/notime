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
            providerUserId = decoded.userId || 
                    decoded.claims?.find((c: any) => c.typ === "http://schemas.microsoft.com/identity/claims/objectidentifier")?.val ||
                    decoded.claims?.find((c: any) => c.typ === "oid")?.val ||
                    decoded.claims?.find((c: any) => c.typ === "sub")?.val;
            email = decoded.userDetails || 
                    decoded.claims?.find((c: any) => c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.val ||
                    decoded.claims?.find((c: any) => c.typ === "email")?.val;
            name = decoded.claims?.find((c: any) => c.typ === "name")?.val || email || "Unknown User";
            if (!providerUserId || !email) {
                console.error("❌ Auth Error: Missing Identity Data");
        console.log("🛠️ DEBUG FULL DECODED PAYLOAD:", JSON.stringify(decoded, null, 2));
        return res.status(401).json({ 
            message: "Identity missing", 
            details: { hasId: !!providerUserId, hasEmail: !!email } 
        });
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