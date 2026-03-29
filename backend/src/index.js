// backend/src/index.js

import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

import listRoutes from "./routes/list.routes.js";
import vocabRoutes from "./routes/vocab.routes.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // ปรับเป็น URL ของ frontend คุณ
  allowedHeaders: ['Content-Type', 'X-CSRF-Signature', 'x-ms-client-principal-id'], // เพิ่ม header สำคัญที่คุณใช้เช็ค User
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/lists", listRoutes);
app.use("/api/vocabs", vocabRoutes);
app.use("/api/auth", authRoutes);

// Error Handling
process.on('uncaughtException', (err) => {
  console.error('❌ พบข้อผิดพลาดร้ายแรง (Uncaught Exception):', err);
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`💡 Mode: ${process.env.NODE_ENV || 'development'}`);
});