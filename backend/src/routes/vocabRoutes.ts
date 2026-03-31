import { Router } from 'express';
import { VocabController } from '../controllers/VocabController';
import { PracticeController } from '../controllers/PracticeController';
import { ListController } from '../controllers/ListController';
import { NotificationController } from '../controllers/NotificationController';

// Repositories
import { SqlVocabRepository } from '../repositories/SqlVocabRepository';
import { SqlListRepository } from '../repositories/SqlListRepository';
import { SqlUserRepository } from '../repositories/SqlUserRepository';
import { SqlNotificationRepository } from '../repositories/SqlNotificationRepository';

// Services & Managers
import { GeminiService } from '../services/GeminiService';
import { PracticeSession } from '../managers/PracticeSession';
import { SM2Algorithm } from '../algorithms/SM2Algorithm';

const router = Router();

// create Repositories instance
const vocabRepo = new SqlVocabRepository(); 
const listRepo = new SqlListRepository();
const userRepo = new SqlUserRepository();
const notiRepo = new SqlNotificationRepository();

// create  Services/Algorithms Repositories instance
const aiService = new GeminiService();
const sm2 = new SM2Algorithm();

// create session instance
const practiceSession = new PracticeSession(vocabRepo, sm2);

// (Dependency Injection)
const vocabCtrl = new VocabController(vocabRepo, listRepo, aiService, sm2);
const listCtrl = new ListController(listRepo);
const practiceCtrl = new PracticeController(vocabRepo, practiceSession);
const notiCtrl = new NotificationController(notiRepo); // ✅ ใช้ notiRepo ตามที่เราแก้ล่าสุด

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
router.delete("/items/:id", (req, res) => vocabCtrl.delete(req, res));
router.post("/generate-definition", (req, res) => vocabCtrl.generateOnly(req, res));
router.post("/synonyms", (req, res) => vocabCtrl.getSynonyms(req, res));

// Spaced Repetition (Practice)
router.get("/today", (req, res) => practiceCtrl.getTodayTasks(req, res));
router.post("/review", (req, res) => vocabCtrl.review(req, res));
router.get("/random-practice", (req, res) => vocabCtrl.getRandomPractice(req, res));
router.get("/practice/list/:listId", (req, res) => vocabCtrl.getPracticeByList(req, res));

// 📚 การฝึกฝน (Practice Modes)
router.get("/today", (req, res) => practiceCtrl.getTodayTasks(req, res)); // ทวนตาม SM-2
router.get("/random-practice", (req, res) => vocabCtrl.getRandomPractice(req, res)); // 🆕 โหมดสุ่ม
router.get("/practice/list/:listId", (req, res) => vocabCtrl.getPracticeByList(req, res)); // 🆕 ทวนรายลิสต์

// 🔔 การแจ้งเตือน (Notifications)
router.post("/subscribe", (req, res) => notiCtrl.subscribe(req, res));
router.post("/subscribe", (req, res) => notiCtrl.subscribe(req, res)); // ลงทะเบียน Browser
router.post("/settings/notifications", (req, res) => notiCtrl.updateSettings(req, res)); // 🆕 บันทึกโหมด (All/Random/List)

export { vocabRepo, notiRepo };
export default router;