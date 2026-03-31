// NotificationWorker.ts
import cron from 'node-cron';
import { notiRepo } from '../routes/vocabRoutes'; // ✅ ชื่อที่ import มาคือ notiRepo
import { sendPush } from '../services/PushService';

// 1. ตรวจสอบคำศัพท์ที่ต้องทบทวนทุกชั่วโมง
cron.schedule('0 * * * *', async () => {
    // Logic: ค้นหา User ที่ daily_notif_time ตรงกับชั่วโมงนี้
    // และมีศัพท์ที่ next_review_at <= NOW
    // แล้วสั่ง notiRepo.addToQueue(...) ลงตาราง NotificationQueue
});

cron.schedule('*/5 * * * *', async () => {
    // ✅ เปลี่ยนจาก notificationRepo เป็น notiRepo ให้ตรงกับที่ import มาด้านบนครับ
    const pending = await notiRepo.getPendingQueue(); 
    for (const task of pending) {
        const sub = {
            endpoint: task.endpoint,
            keys: { p256dh: task.p256dh_key, auth: task.auth_key }
        };
        try {
            await sendPush(sub, JSON.stringify({ title: 'ถึงเวลาทบทวนแล้ว!', body: 'มีคำศัพท์รอคุณอยู่' }));
            await notiRepo.updateQueueStatus(task.queue_id, 'sent');
        } catch (err: any) {
            console.error("❌ Send Push Error:", err.message);
            await notiRepo.updateQueueStatus(task.queue_id, 'failed');
        }
    }
});