// backend/src/index.js

import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'X-CSRF-Signature'],
  // credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import saveVocabRoute from "./routes/saveVocab.js";
import getVocabsRoute from "./routes/getVocabs.js";
import deleteVocabRoute from "./routes/deleteVocab.js";
import updateVocabRoute from "./routes/updateVocab.js";

app.use("/api/vocabs", saveVocabRoute);
app.use("/api/vocabs", getVocabsRoute);
app.use("/api/vocabs", deleteVocabRoute);
app.use("/api/vocabs", updateVocabRoute);


app.use(express.static(path.join(__dirname, "../public")));

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
