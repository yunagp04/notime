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
    const userEmail = req.headers['x-ms-client-principal-name']; 
    const providerId = req.headers['x-ms-client-principal-id'];

    if (userEmail && providerId) {
        try {
            // เช็คว่ามีใน DB หรือยัง
            let user = await vocabRepo.getUserByAuthProviderID(providerId); 
            
            if (!user) {
                // ถ้าไม่เจอ ให้ลงทะเบียนใหม่
                user = await vocabRepo.registerNewUser({
                    email: userEmail,
                    name: userEmail.split('@')[0],
                    provider: 'google',
                    providerUserId: providerId
                });
                console.log(`✨ [Auth] Auto-registered: ${userEmail}`);
            }
            // ฝาก ID ไว้ใน request
            req.currentUserId = user.user_id; 
        } catch (err) {
            console.error("❌ [Auth] Database Error:", err);
        }
    }
    next();
});

app.use('/api/vocab', (req: any, res, next) => {
    // ถ้าไม่มี ID (ไม่ได้ล็อกอิน) ให้หยุดตรงนี้เลย
    if (!req.currentUserId) {
        return res.status(401).json({ error: "Unauthorized: ไม่พบข้อมูลผู้ใช้" });
    }

    // ส่ง ID ให้ Repository ใช้งาน
    req.userId = req.currentUserId; 

    // 🚩 พ่น Log เพื่อดูความเคลื่อนไหวบน Azure
    console.log(`📡 [API Call] ${req.method} ${req.path} | By User: ${req.userId}`);
    
    next();
}, vocabRoutes);

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