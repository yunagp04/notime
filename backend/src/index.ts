import express from 'express';
import cors from 'cors';
import vocabRoutes from './routes/vocabRoutes';
import path from 'path';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
        console.error("❌ Bad JSON Format:", err.message);
        return res.status(400).json({ error: "JSON ส่งมาผิดรูปแบบจ้า" });
    }
    next();
});

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