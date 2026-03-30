import { Router } from 'express';
import { VocabController } from '../controllers/VocabController';
import { PracticeController } from '../controllers/PracticeController';
import { ListController } from '../controllers/ListController';
import { SqlVocabRepository } from '../repositories/SqlVocabRepository';
import { SqlListRepository } from '../repositories/SqlListRepository';
import { GeminiService } from '../services/GeminiService';
import { PracticeSession } from '../managers/PracticeSession';
import { SM2Algorithm } from '../algorithms/SM2Algorithm';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();

// สร้าง Instance ครั้งเดียว (Dependency Injection)
const vocabRepo = new SqlVocabRepository(); 
const listRepo = new SqlListRepository();
const aiService = new GeminiService();
const sm2 = new SM2Algorithm();
const practiceSession = new PracticeSession(vocabRepo, sm2);

const vocabCtrl = new VocabController(vocabRepo, aiService, sm2);
const listCtrl = new ListController(listRepo);
const practiceCtrl = new PracticeController(vocabRepo, practiceSession);
const notiCtrl = new NotificationController(vocabRepo);

// --- 3. Lists & Collections ---
router.get("/lists", (req, res) => listCtrl.getLists(req, res));   // ดึงรายการ Collection ทั้งหมด

// --- 4. Practice & Spaced Repetition (SM2) ---
router.get("/today", (req, res) => practiceCtrl.getTodayTasks(req, res)); // ดึงคำศัพท์ที่ต้องทบทวนวันนี้
router.get("/due", (req, res) => vocabCtrl.getDue(req, res));             // ดึงจำนวนคำที่ค้างทบทวน
router.post("/review", (req, res) => vocabCtrl.review(req, res));         // บันทึกผลการทบทวน (SM2 Algorithm)
router.get("/state/:id", (req, res) => vocabCtrl.getState(req, res));     // ดูสถานะการจำของคำนั้นๆ

// --- 5. Dashboard & Statistics ---
router.get("/dashboard", (req, res) => vocabCtrl.getDashboard(req, res)); // ข้อมูลสรุปภาพรวม
router.get("/summary", (req, res) => vocabCtrl.getSummary(req, res));     // สถิติการจำ (New/Learning/Mastered)

// --- 6. AI & Utilities ---
router.post("/generate-definition", (req, res) => vocabCtrl.generateOnly(req, res)); // เจนคำแปลอย่างเดียว
router.post("/notifications/subscribe", (req, res) => notiCtrl.subscribe(req, res)); // ลงทะเบียน Push Notification

router.get("/", (req, res) => vocabCtrl.getVocabs(req, res));      // ดึงคำศัพท์ทั้งหมด
router.post("/", (req, res) => vocabCtrl.create(req, res));        // เพิ่มคำศัพท์ใหม่ (Navbar ยิงมาที่นี่)
router.get("/search", (req, res) => vocabCtrl.search(req, res));   // ค้นหา AI
router.put("/:id", (req, res) => vocabCtrl.update(req, res));      // อัปเดต
router.delete("/:id", (req, res) => vocabCtrl.delete(req, res));   // ลบ

router.get("/items", (req, res) => vocabCtrl.getVocabs(req, res)); // เพิ่ม path /items
router.post("/add", (req, res) => vocabCtrl.create(req, res));     // เพิ่ม path /add ให้ตรงกับ frontend

export default router;