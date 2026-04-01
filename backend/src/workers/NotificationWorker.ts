// NotificationWorker.ts
import cron from 'node-cron';
import { notiRepo } from '../routes/vocabRoutes'; // ✅ ชื่อที่ import มาคือ notiRepo
import { sendPush } from '../services/PushService';

const MAX_WORDS_PER_NOTIF = 10;

// 1. ตรวจสอบคำศัพท์ที่ต้องทบทวนทุกชั่วโมง
cron.schedule('0 1 * * *', async () => {
    console.log('☀️ รันระบบแจ้งเตือนสรุปประจำวันตอน 08:00 น.');

    const users = await notiRepo.getAllActiveSubscribers(); 

    for (const user of users) {
        // ระบบจะไปดึงคำศัพท์ที่ "Due" หรือ "Overdue" (เลยกำหนด) มาทั้งหมด
        // ดังนั้น คำที่ครบกำหนดตอน 5 โมงเย็นเมื่อวาน จะถูกดึงมาเตือนตอน 8 โมงเช้าวันนี้แทน
        const itemsToNotify = await notiRepo.getWordsForNotification(
            user.user_id, 
            user.noti_mode, 
            user.noti_list_id, 
            10 
        );

        if (itemsToNotify.length > 0) {
            const message = `อรุณสวัสดิ์! มี ${itemsToNotify.length} คำศัพท์ที่ถึงกำหนดทบทวนแล้ว`;
            await notiRepo.addToQueue(user.user_id, null, new Date(), message);
        }
    }
});

cron.schedule('*/5 * * * *', async () => {
    const pending = await notiRepo.getPendingQueue(); 
    for (const task of pending) {
        const sub = {
            endpoint: task.endpoint,
            keys: { p256dh: task.p256dh_key, auth: task.auth_key }
        };
        
        try {
            // ดึงจำนวนคำศัพท์ล่าสุดอีกครั้งเพื่อความแม่นยำ
            const currentDue = await notiRepo.getDueCountForUser(task.user_id);
            
            const payload = JSON.stringify({ 
                title: 'ได้เวลาทบทวนแล้ว! 📚', 
                body: `มีคำศัพท์ทั้งหมด ${currentDue} คำ รอให้คุณมาทบทวนอยู่ในตอนนี้`,
                url: '/practice' 
            });

            await sendPush(sub, payload);
            await notiRepo.updateQueueStatus(task.queue_id, 'sent');
        } catch (err: any) {
            console.error("❌ Send Push Error:", err.message);
            // หาก Error เป็น 410 (Gone) หรือ 404 ให้ลบ Subscription นั้นทิ้งด้วยจะดีมากครับ
            await notiRepo.updateQueueStatus(task.queue_id, 'failed');
        }
    }
});