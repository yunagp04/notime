import { Router } from 'express';
import { VocabController } from '../controllers/VocabController';
import { PracticeController } from '../controllers/PracticeController';
import { ListController } from '../controllers/ListController';
import { NotificationController } from '../controllers/NotificationController';

// Repositories
import { SqlVocabRepository } from '../repositories/SqlVocabRepository';
import { SqlListRepository } from '../repositories/SqlListRepository';
import { SqlUserRepository } from '../repositories/SqlUserRepository';

// Services & Managers
import { GeminiService } from '../services/GeminiService';
import { PracticeSession } from '../managers/PracticeSession';
import { SM2Algorithm } from '../algorithms/SM2Algorithm';

const router = Router();

// create Repositories instance
const vocabRepo = new SqlVocabRepository(); 
const listRepo = new SqlListRepository();
const userRepo = new SqlUserRepository();

// create  Services/Algorithms Repositories instance
const aiService = new GeminiService();
const sm2 = new SM2Algorithm();

// create session instance
const practiceSession = new PracticeSession(vocabRepo, sm2);

// (Dependency Injection)
const vocabCtrl = new VocabController(vocabRepo, aiService, sm2);
const listCtrl = new ListController(listRepo);
const practiceCtrl = new PracticeController(vocabRepo, practiceSession);
const notiCtrl = new NotificationController(userRepo); // ✅ ใช้ userRepo ตามที่เราแก้ล่าสุด

// --- (Routes) ---

// Dashboard & Stats
router.get("/dashboard", (req, res) => vocabCtrl.getDashboard(req, res));

// Collection (Lists)
router.get("/lists", (req, res) => listCtrl.getLists(req, res));
router.post("/lists", (req, res) => listCtrl.create(req, res));
router.put("/lists/:id", (req, res) => listCtrl.update(req, res));
router.delete("/lists/:id", (req, res) => listCtrl.delete(req, res));

// Vocabulary Core
router.get("/items", (req, res) => vocabCtrl.getVocabs(req, res));
router.post("/add", (req, res) => vocabCtrl.create(req, res));      
router.get("/search", (req, res) => vocabCtrl.search(req, res));
router.get("/state/:id", (req, res) => vocabCtrl.getState(req, res));
router.put("/items/:id", (req, res) => vocabCtrl.update(req, res));
router.delete("/:id", (req, res) => vocabCtrl.delete(req, res));

// Spaced Repetition (Practice)
router.get("/today", (req, res) => practiceCtrl.getTodayTasks(req, res));
router.post("/review", (req, res) => vocabCtrl.review(req, res)); // ✅ ใช้จาก vocabCtrl หรือ practiceCtrl ก็ได้แต่ต้องตรงกัน

// Notifications
router.post("/subscribe", (req, res) => notiCtrl.subscribe(req, res)); // ✅ เพิ่มเส้นทางแจ้งเตือน


export default router;