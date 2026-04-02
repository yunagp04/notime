import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import vocabRoutes from './routes/vocabRoutes';
import { AuthController } from './controllers/AuthController'; 
import { authMiddleware } from "./middlewares/authMiddleware";

import './workers/NotificationWorker';

const app = express();
const port = Number(process.env.PORT) || 3001;

// 1. สร้าง Instance ของ Controller ก่อนเรียกใช้งาน
const authCtrl = new AuthController(); 

// 2. Standard Middleware
app.use(cors());
app.use(express.json());

// 3. 🛡️ [Fix CORS] ให้บริการไฟล์ Static พื้นฐานโดยไม่ติด Auth
// วางไว้ก่อน API Routes เพื่อไม่ให้โดน Redirect ไปหน้า Login
app.get(['/manifest.json', '/favicon.ico', '/robots.txt'], (req, res) => {
    const filePath = path.join(process.cwd(), 'frontend/build', req.path);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).end();
    }
});

// 4. API Routes (ใช้ authMiddleware คุม)
app.get("/api/auth/me", authMiddleware, (req, res) => authCtrl.me(req, res)); 
app.use('/api/vocab', authMiddleware, vocabRoutes); 

// 5. Static Files & SPA Fallback (Frontend)
const frontendPath = path.join(process.cwd(), 'frontend/build');
app.use(express.static(frontendPath));

// ถ้า Request ไม่ใช่ /api ให้ส่ง index.html กลับไป (สำหรับ React Router)
app.get(/^(?!\/api).+/, (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Error: Frontend build not found. Make sure you have built the frontend.");
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server is flying on port ${port}!`);
});