import express from "express";
import { vocabController } from "../controllers/vocab.controller.js";
import { aiController } from "../controllers/ai.controller.js";

const router = express.Router();

router.get("/", vocabController.getVocabs);
router.post("/", vocabController.saveVocab);
router.put("/:id", vocabController.updateVocab);
router.delete("/:id", vocabController.deleteVocab);

router.post("/generate-batch", aiController.generateBatch);
router.post("/:id/generate", vocabController.generateSingle);

export default router;