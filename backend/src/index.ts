import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import vocabRoutes from './routes/vocabRoutes';
import { AuthController } from './controllers/AuthController'; // ✅ Import ให้ถูกตัว
import { authMiddleware } from "./middlewares/authMiddleware";

import './workers/NotificationWorker';

const app = express();
const port = process.env.PORT || 5000;
const authCtrl = new AuthController(); // ✅ สร้าง Instance

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/api/auth/me", authMiddleware, (req, res) => authCtrl.me(req, res)); // ✅ ต่อสายตรงไปที่ AuthController
app.use('/api/vocab', authMiddleware, vocabRoutes); // ✅ ป้องกันด้วย Middleware

// Static Files (Frontend)
const frontendPath = path.join(process.cwd(), 'frontend/build');
app.use(express.static(frontendPath));

app.get(/^(?!\/api).+/, (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Error: Frontend build not found");
    }
});

app.listen(port, () => {
    console.log(`🚀 Server is flying on port ${port}!`);
});