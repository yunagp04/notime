import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabaseClient";
import { PostgresUserRepository } from "../repositories/PostgresUserRepository";

const userRepo = new PostgresUserRepository();

export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
    try {
        // 1. ดึง Token จาก Header "Authorization: Bearer <token>"
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const token = authHeader.split(' ')[1];

        // 2. ตรวจสอบ Token กับ Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error("❌ Supabase Auth Error:", error?.message);
            return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
        }

        // 3. ตรวจสอบว่ามีข้อมูลในตาราง AppUser_M ของเราหรือยัง
        let dbUser = await userRepo.getUserByUserId(user.id);

        if (!dbUser) {
            // ถ้ายังไม่มี (เช่น ล็อคอินครั้งแรกหลังย้ายบ้าน) ให้สร้างลง AppUser_M ทันที
            console.log(`🆕 Registering user to AppUser_M: ${user.email}`);
            dbUser = await userRepo.registerNewUser({
                user_id: user.id,
                email: user.email || '',
                name: user.user_metadata.display_name || 'New User'
            });
        }

        // 4. ส่ง user_id ต่อไปให้ Controller อื่นๆ ใช้งาน
        req.userId = dbUser.user_id;
        next();

    } catch (err: any) {
        console.error("❌ Auth Middleware Fatal Error:", err.message);
        return res.status(500).json({ message: "Internal server error during authentication" });
    }
};

// import { Request, Response, NextFunction } from "express";
// import { SqlUserRepository } from "../repositories/SqlUserRepository"; // ✅ เปลี่ยนเป็น UserRepository

// const userRepo = new SqlUserRepository();

// export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
//     try {
//         const principal = req.headers["x-ms-client-principal"];
//         const isAzure = !!process.env.WEBSITE_HOSTNAME;

//         let providerUserId: string | undefined;
//         let email: string | undefined;
//         let name: string | undefined;
//         let provider: string;

//         if (principal) {
//             // --- AZURE MODE ---
//             const decoded = JSON.parse(Buffer.from(principal as string, "base64").toString("ascii"));
//             const claims = decoded.claims || [];

//             // ฟังก์ชันช่วยดึงค่าจาก Claims หลายชื่อ (Fallback)
//             const getClaim = (types: string[]) => claims.find((c: any) => types.includes(c.typ))?.val;

//             // 🎯 ดึง ID จาก nameidentifier (จาก Payload จริงของคุณ Paweena)
//             providerUserId = decoded.userId || getClaim([
//                 "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
//                 "sub"
//             ]);

//             // 📧 ดึง Email
//             email = decoded.userDetails || getClaim([
//                 "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
//                 "email"
//             ]);

//             // 👤 ดึง Name
//             name = getClaim(["name"]) || email || "Unknown User";

//             // 🚨 Safety Guard: ถ้า ID หรือ Email ยังเป็น NULL ห้ามไปต่อ
//             if (!providerUserId || !email) {
//                 console.error("❌ Auth Error: Missing Identity Data");
//                 console.log("🛠️ DEBUG PAYLOAD:", JSON.stringify(decoded, null, 2));
//                 return res.status(401).json({ 
//                     message: "Identity missing", 
//                     details: { hasId: !!providerUserId, hasEmail: !!email } 
//                 });
//             }

//             provider = "google";
//         } else if (!isAzure) {
//             // --- DEV MODE ---
//             providerUserId = "local-dev-id-001";
//             email = "dev@test.com";
//             name = "Developer";
//             provider = "local";
//         } else {
//             return res.status(401).json({ message: "Unauthorized: No principal header" });
//         }

//         // --- DATABASE LOGIC ---
//         let user = await userRepo.getUserByAuthProviderID(providerUserId);

//         if (!user) {
         
//             console.log(`🔍 Checking fallback email: ${email}`);
//             user = await userRepo.getUserByEmail(email); 
//         }

//         if (!user) {
     
//             console.log(`🔥 Registering new user: ${email}`);
//             user = await userRepo.registerNewUser({
//                 email,
//                 name,
//                 provider,
//                 providerUserId
//             });
//         }

//         req.userId = user.user_id;
//         next();

//     } catch (err: any) {
//         console.error("❌ Auth Middleware Error:", err.message);
//         return res.status(500).json({ message: "Authentication failed" });
//     }
// };