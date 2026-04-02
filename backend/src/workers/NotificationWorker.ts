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
    const frontendUrl = process.env.FRONTEND_URL || 'https://vocab-frontend.onrender.com'; // Fallback ไว้กันเหนียว

    for (const task of pending) {
        const sub = { 
            endpoint: task.pushsubscription_s?.endpoint, // เช็คโครงสร้าง Object ให้ตรงกับที่ Repo คืนค่ามา
            keys: { 
                p256dh: task.pushsubscription_s?.p256dh_key, 
                auth: task.pushsubscription_s?.auth_key 
            } 
        };
        
        try {
            // 🚩 1. ลบบรรทัดที่เรียก getTemplate ออก แล้วใช้ตัวแปร String ธรรมดาแทนครับ
            const titlePrefix = "ได้เวลาทบทวนแล้ว!"; 
            
            // 🎯 2. ดึงคำศัพท์มาโชว์ 5 คำ
            const items = await notiRepo.getWordsForNotification(task.user_id, task.noti_mode, task.noti_list_id, 5);

            for (const item of items) {
                const payload = JSON.stringify({
                    // 🚩 เปลี่ยนจาก temp.title_template มาใช้ titlePrefix ที่เราตั้งไว้ข้างบน
                    title: `${titlePrefix}: ${item.globalvocab_m?.title || item.title || 'คำศัพท์ใหม่'}`, 
                    body: `ความหมาย: ${item.globalvocab_m?.content || item.definition || 'กดเพื่อดูรายละเอียด'}`,
                    tag: 'srs-review-group', 
                    url: `${frontendUrl}/practice`
                });
                await sendPush(sub, payload);
            }
            await notiRepo.updateQueueStatus(task.queue_id, 'sent');
        } catch (err: any) {
             console.error("❌ Send Push Error:", err.message);
             await notiRepo.updateQueueStatus(task.queue_id, 'failed');
        }
    }
});