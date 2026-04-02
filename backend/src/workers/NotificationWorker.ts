import cron from 'node-cron';
import { notiRepo } from '../routes/vocabRoutes'; 
import { sendPush } from '../services/PushService';

// 🎯 กำหนดโครงสร้างข้อมูล User ให้ TypeScript รู้จัก (แก้บั๊ก image_35501f.png)
interface UserNotiSettings {
    user_id: string;
    noti_mode?: string;
    noti_list_id?: string;
    max_items_per_notif?: number;
    endpoint?: string; // สำหรับดึงจาก Queue
    p256dh_key?: string;
    auth_key?: string;
}

// 🎯 1. ส่วนตรวจสอบและสร้างคิว (Check & Queue)
// ทำงานทุก 30 นาที
cron.schedule('*/30 * * * *', async () => {
    console.log('🔍 [Worker] กำลังตรวจสอบคำศัพท์ที่ถึงกำหนดทบทวน...');

    try {
        const users = await notiRepo.getAllActiveSubscribers() as UserNotiSettings[]; 

        for (const user of users) {
            const count = await notiRepo.getDueCountForUser(user.user_id);

            if (count > 0) {
                // ดึงค่าการตั้งค่าจาก User (แก้บั๊ก image_35501f.png)
                const maxItems = user.max_items_per_notif || 5; 
                const message = `อรุณสวัสดิ์! คุณมี ${count} คำศัพท์ที่รอการทบทวน (แสดงสูงสุด ${maxItems} คำ)`;
                
                // ระบบ addToQueue มี Logic เช็คสถานะ pending เพื่อกันส่งซ้ำแล้ว
                await notiRepo.addToQueue(user.user_id, null, new Date(), message);
                console.log(`✅ [Queue] บันทึกคิวสำเร็จสำหรับ User: ${user.user_id}`);
            }
        }
    } catch (err: any) {
        console.error("❌ [Worker Error]:", err.message);
    }
});

// 🎯 2. ส่วนส่งแจ้งเตือนจริง (Pusher - แบบ Grouping เหมือนอีเมล)
cron.schedule('* */1 * * *', async () => {
    const pending = await notiRepo.getPendingQueue();
    const frontendUrl = process.env.FRONTEND_URL;

    for (const task of pending) {
        const sub = { endpoint: task.endpoint, keys: { p256dh: task.p256dh_key, auth: task.auth_key } };
        
        try {
            // 🎯 1. ดึง Template ตามภาษา User มาทำ "หัวข้อ" (Title)
            const temp = await notiRepo.getTemplate('due_reminder', task.pref_lang || 'th');
            
            // 🎯 2. ดึงคำศัพท์มาโชว์ 5 คำ (เพื่อส่งแยกบรรทัด/Grouping)
            const items = await notiRepo.getWordsForNotification(task.user_id, task.noti_mode, task.noti_list_id, 5);

            for (const item of items) {
                const payload = JSON.stringify({
                    title: `${temp.title_template}: ${item.title || item.word}`, // "ได้เวลาทบทวนแล้ว!: Abandon"
                    body: `ความหมาย: ${item.content || item.definition || 'กดเพื่อดูรายละเอียด'}`,
                    tag: 'srs-review-group', // 🎯 ตัวรวมกลุ่มให้เป็น Stack หลายบรรทัด
                    url: `${frontendUrl}/practice`
                });
                await sendPush(sub, payload);
            }
            await notiRepo.updateQueueStatus(task.queue_id, 'sent');
        } catch (err: any) { /* cleanup logic ... */ }
    }
});