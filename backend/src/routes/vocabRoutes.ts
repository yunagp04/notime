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

router.get("/lists", (req, res) => listCtrl.getLists(req, res));
router.post('/add', (req, res) => vocabCtrl.create(req, res));
router.get('/today', (req, res) => practiceCtrl.getTodayTasks(req, res));
// router.post('/review', (req, res) => practiceCtrl.submitReview(req, res));
router.get('/due', (req, res) => vocabCtrl.getDue(req, res));
router.get('/state/:id', (req, res) => vocabCtrl.getState(req, res));
router.post('/review', (req, res) => vocabCtrl.review(req, res));
router.get('/dashboard', (req, res) => vocabCtrl.getDashboard(req, res));
router.get('/summary', (req, res) => vocabCtrl.getSummary(req, res));
router.get('/items', (req, res) => vocabCtrl.getVocabs(req, res));
router.put('/:id', (req, res) => vocabCtrl.update(req, res));
router.delete('/:id', (req, res) => vocabCtrl.delete(req, res));
router.get('/search', (req, res) => vocabCtrl.search(req, res));
router.post('/notifications/subscribe', (req, res) => notiCtrl.subscribe(req, res));
router.post('/generate-definition', (req, res) => vocabCtrl.generateOnly(req, res));

export default router;