// NotificationWorker.ts
import cron from 'node-cron';
import { notiRepo } from '../routes/vocabRoutes'; 
import { sendPush } from '../services/PushService';

// 🎯 1. ส่วนตรวจสอบคำศัพท์ (Check Due Items)
// หมายเหตุ: ปรับเป็น '*/1 * * * *' เพื่อให้รันทุกนาที (สำหรับทดสอบให้ข้อมูลเข้า Queue ทันที)
// หากใช้งานจริงและต้องการ 8 โมงเช้าไทยบน Azure ให้ใช้ '0 1 * * *' (UTC) หรือ '0 8 * * *' (ถ้าตั้ง WEBSITE_TIMEZONE แล้ว)
cron.schedule('*/1 * * * *', async () => {
    console.log('🔍 [Worker] กำลังตรวจสอบคำศัพท์ที่ถึงกำหนดทบทวน...');

    try {
        // ดึง Users ทั้งหมดที่กด Enable แจ้งเตือนไว้ (มีข้อมูลใน PushSubscription)
        const users = await notiRepo.getAllActiveSubscribers(); 

        for (const user of users) {
            // ดึงรายการคำศัพท์ที่ Overdue (next_review <= ปัจจุบัน)
            const itemsToNotify = await notiRepo.getWordsForNotification(
                user.user_id, 
                user.noti_mode, 
                user.noti_list_id, 
                10 // ลิมิตแสดงในข้อความเบื้องต้น 10 คำ
            );

            // ถ้าเจอคำศัพท์ที่ค้างทบทวน ให้เพิ่มลง NotificationQueue
            if (itemsToNotify.length > 0) {
                const message = `สวัสดี! มี ${itemsToNotify.length} คำศัพท์ที่ถึงกำหนดทบทวนแล้ว`;
                
                await notiRepo.addToQueue(user.user_id, null, new Date(), message);
                console.log(`✅ [Queue] เพิ่มรายการแจ้งเตือนสำหรับ User ID: ${user.user_id}`);
            }
        }
    } catch (err: any) {
        console.error("❌ [Worker Error]:", err.message);
    }
});

// 🎯 2. ส่วนส่งแจ้งเตือน (Process Queue)
// รันทุก 5 นาทีเพื่อกวาดงานจาก Queue ไปยิง Push Notification จริง
cron.schedule('*/5 * * * *', async () => {
    console.log('🚀 [Pusher] กำลังเริ่มส่งแจ้งเตือนจาก Queue...');
    
    try {
        const pending = await notiRepo.getPendingQueue(); 
        
        for (const task of pending) {
            const sub = {
                endpoint: task.endpoint,
                keys: { 
                    p256dh: task.p256dh_key, 
                    auth: task.auth_key 
                }
            };
            
            try {
                const currentDue = await notiRepo.getDueCountForUser(task.user_id);
                
                const payload = JSON.stringify({ 
                    title: 'ได้เวลาทบทวนแล้ว! 📚', 
                    body: `มีคำศัพท์ทั้งหมด ${currentDue} คำ รอให้คุณมาทบทวนอยู่ในตอนนี้`,
                    url: '/practice' // เมื่อกดแจ้งเตือนจะเปิดไปหน้านี้
                });

                await sendPush(sub, payload);
                
                await notiRepo.updateQueueStatus(task.queue_id, 'sent');
                console.log(`🚀 [Success] ส่งแจ้งเตือนให้ User ${task.user_id} เรียบร้อย`);
                
            } catch (err: any) {
                console.error(`❌ [Push Failed] สำหรับ Queue ID ${task.queue_id}:`, err.message);
                await notiRepo.updateQueueStatus(task.queue_id, 'failed');
            }
        }
    } catch (err: any) {
        console.error("❌ [Pusher Error]:", err.message);
    }
});