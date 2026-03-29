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

console.log('📍 Current Working Directory (cwd):', process.cwd());
console.log('📍 __dirname:', __dirname);

// Routes
app.use('/api/vocab', vocabRoutes);

let frontendPath = path.join(process.cwd(), 'public');
if (!fs.existsSync(path.join(frontendPath, 'index.html'))) {
    frontendPath = path.join(__dirname, '../../frontend/build');
}

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
    console.log(`Server is running at http://localhost:${port}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});