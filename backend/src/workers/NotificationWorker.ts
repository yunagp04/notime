// NotificationWorker.ts
import cron from 'node-cron';
import { notiRepo } from '../routes/vocabRoutes'; // ✅ ชื่อที่ import มาคือ notiRepo
import { sendPush } from '../services/PushService';

const MAX_WORDS_PER_NOTIF = 10;

// 1. ตรวจสอบคำศัพท์ที่ต้องทบทวนทุกชั่วโมง
cron.schedule('0 * * * *', async () => {
    // 1. ดึง Users ทั้งหมดที่เปิดแจ้งเตือนไว้
    const users = await notiRepo.getAllActiveSubscribers(); 

    for (const user of users) {
        // 2. ดึงคำศัพท์ตามเงื่อนไข (สุ่ม/ลิสต์/ทั้งหมด)
        const itemsToNotify = await notiRepo.getWordsForNotification(
            user.user_id, 
            user.noti_mode, 
            user.noti_list_id, 
            10 // 🎯 ลิมิตสูงสุด 10 คำต่อรอบ
        );

        if (itemsToNotify.length > 0) {
            // 3. สร้างข้อความตามความจริง (เช่น "วันนี้มี 7 คำที่คุณควรทบทวน")
            const message = `มี ${itemsToNotify.length} คำศัพท์ ${user.noti_mode === 'random' ? 'สุ่ม' : ''} รอให้คุณมาทบทวนอยู่ในตอนนี้`;
            
            await notiRepo.addToQueue(user.user_id, null, new Date(), message);
        }
    }
});
// cron.schedule('0 * * * *', async () => {
//     // ส่งค่า MAX ไปให้ Repo ช่วยกรอง
//     const usersWithDue = await notiRepo.getUsersWithDueItems(MAX_WORDS_PER_NOTIF); 

//     for (const user of usersWithDue) {
//         if (user.due_count > 0) {
//             // ส่งแค่ตามจำนวนที่เราจำกัดไว้ (เช่น "มี 10 คำรออยู่" แม้ความจริงจะมี 50)
//             await notiRepo.addToQueue(user.user_id, null, new Date());
//         }
//     }
// });

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