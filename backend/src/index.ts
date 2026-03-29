import express from 'express';
import cors from 'cors';
import vocabRoutes from './routes/vocabRoutes';

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

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});