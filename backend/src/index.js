// backend/src/index.js

import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

import listRoute from "./routes/list.js";
import saveVocabRoute from "./routes/saveVocab.js";
import getVocabsRoute from "./routes/getVocabs.js";
import deleteVocabRoute from "./routes/deleteVocab.js";
import updateVocabRoute from "./routes/updateVocab.js";
import generateBatchRoute from "./routes/generateBatch.js";
import logoutRoute from "./routes/logout.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'X-CSRF-Signature'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/lists", listRoute);
app.use("/api/vocabs", saveVocabRoute);
app.use("/api/vocabs", getVocabsRoute);
app.use("/api/vocabs", deleteVocabRoute);
app.use("/api/vocabs", updateVocabRoute);
app.use("/api/vocabs", generateBatchRoute);
app.use("/api/auth", logoutRoute);

process.on('uncaughtException', (err) => {
  console.error('❌ พบข้อผิดพลาดร้ายแรง (Uncaught Exception):', err);
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
