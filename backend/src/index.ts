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

app.use(async (req: any, res: any, next: any) => {
    // 1. ดึงค่าจาก Azure Header
    const userEmail = req.headers['x-ms-client-principal-name']; 
    const providerId = req.headers['x-ms-client-principal-id']; // Unique ID จาก Google

    if (userEmail && providerId) {
        try {
            // 2. ใช้ฟังก์ชันที่มีอยู่แล้วใน Repository ค้นหา User
            let user = await vocabRepo.getUserByAuthProviderID(providerId);

            if (!user) {
                console.log(`🆕 พบผู้ใช้ใหม่จากเมลมหาลัย: ${userEmail}`);
                // 3. ถ้าไม่เจอ ให้สั่ง Register ใหม่ทันที
                user = await vocabRepo.registerNewUser({
                    email: userEmail,
                    name: userEmail.split('@')[0],
                    provider: 'google',
                    providerUserId: providerId
                });
            }

            // 4. ฝาก user_id ไว้ใน request เพื่อใช้งานต่อ
            req.currentUserId = user.user_id;
            console.log(`👤 Current User ID: ${req.currentUserId}`);

        } catch (err) {
            console.error("❌ Auto Register Error:", err);
        }
    }
    next();
});

// app.use((err: any, req: any, res: any, next: any) => {
//     if (err instanceof SyntaxError && 'body' in err) {
//         console.error("❌ Bad JSON Format:", err.message);
//         return res.status(400).json({ error: "JSON ส่งมาผิดรูปแบบจ้า" });
//     }
//     next();
// });

// Routes
app.use('/api/vocab', vocabRoutes);

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
    // 🌐 เช็คว่าเป็น Azure หรือ Local
    const isAzure = process.env.WEBSITE_HOSTNAME ? true : false;
    const displayUrl = isAzure 
        ? `https://${process.env.WEBSITE_HOSTNAME}` 
        : `http://localhost:${port}`;

    console.log(`🚀 Server is flying!`);
    console.log(`📍 Environment: ${isAzure ? 'Azure Cloud' : 'Local Machine'}`);
    console.log(`🔗 URL: ${displayUrl}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});