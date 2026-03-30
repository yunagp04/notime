import express from 'express';
import cors from 'cors';
import vocabRoutes from './routes/vocabRoutes';
import path from 'path';
import fs from 'fs';
import { SqlVocabRepository } from './repositories/SqlVocabRepository';

const app = express();

const vocabRepo = new SqlVocabRepository();

const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

app.use(async (req: any, res: any, next) => {
    let userEmail = req.headers['x-ms-client-principal-name']; 
    let providerId = req.headers['x-ms-client-principal-id'];

    const isAzure = process.env.WEBSITE_HOSTNAME ? true : false;

    // ถ้า Dev อยู่บนเครื่องตัวเอง ให้ใช้ User สมมติ
    if (!userEmail && !isAzure) {
        userEmail = 'yunagp04@gmail.com';
        providerId = 'local-dev-id-001'; 
        console.log("🛠️ [Dev Mode] Using Mock User");
    }

    if (userEmail && providerId) {
        try {
            let user = await vocabRepo.getUserByAuthProviderID(providerId); 
            
            if (!user) {
                user = await vocabRepo.registerNewUser({
                    email: userEmail,
                    name: userEmail.split('@')[0],
                    provider: 'google',
                    providerUserId: providerId
                });
                console.log(`✨ Auto-registered: ${userEmail}`);
            }
            // ✅ ฝาก userId ไว้ใน request object เพื่อให้ Controller อื่นๆ เรียกใช้ได้
            req.userId = user.user_id; 
        } catch (err) {
            console.error("❌ Auth Middleware Error:", err);
        }
    }
    next();
});

// --- API Routing ---
// ใช้ Middleware ตรวจสอบ userId ก่อนเข้า vocabRoutes แค่ที่เดียวพอ
app.use('/api/vocab', (req: any, res, next) => {
    if (!req.userId) {
        console.log("⚠️ [Unauthorized] No userId found in request");
        return res.status(401).json({ error: "Unauthorized: ไม่พบข้อมูลผู้ใช้" });
    }
    next();
}, vocabRoutes);

// app.use('/api/vocab', vocabRoutes);

let frontendPath = path.join(process.cwd(), 'frontend/build');

if (!fs.existsSync(path.join(frontendPath, 'index.html'))) {
    frontendPath = path.join(__dirname, '../../frontend/build');
}

console.log('📍 Current Working Directory (cwd):', process.cwd());
console.log('📂 Serving Frontend from:', frontendPath);

app.use(express.static(frontendPath));
app.get(/^(?!\/api).+/, (req, res) => {
    // res.sendFile(path.join(frontendPath, 'index.html'));
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`Error: หาไฟล์ index.html ไม่เจอที่ ${indexPath}`);
    }
});

app.listen(port, () => {
    console.log(`🚀 Server is flying on port ${port}!`);
});

// app.listen(port, () => {
//     // 🌐 เช็คว่าเป็น Azure หรือ Local
//     const isAzure = process.env.WEBSITE_HOSTNAME ? true : false;
//     const displayUrl = isAzure 
//         ? `https://${process.env.WEBSITE_HOSTNAME}` 
//         : `http://localhost:${port}`;

//     console.log(`🚀 Server is flying!`);
//     console.log(`📍 Environment: ${isAzure ? 'Azure Cloud' : 'Local Machine'}`);
//     console.log(`🔗 URL: ${displayUrl}`);
// });

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});