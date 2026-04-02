import { supabase } from "../config/supabaseClient";
import { INotificationRepository } from "../interfaces/INotificationRepository";

export class PostgresNotificationRepository implements INotificationRepository {

    constructor(private supabase: any) {}
    
    /**
     * 🔔 บันทึกข้อมูลการรับแจ้งเตือน (Push Subscription)
     */
    async saveSubscription(userId: string, subscription: any): Promise<void> {
        const { error } = await supabase
            .from('pushsubscription_s')
            .upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                p256dh_key: subscription.keys.p256dh,
                auth_key: subscription.keys.auth
            }, { onConflict: 'endpoint' });

        if (error) throw error;
    }

    async getSubscriptions(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('pushsubscription_s')
            .select('*')
            .eq('user_id', userId);
        
        if (error) throw error;
        return data;
    }

    /**
     * 📥 เพิ่มรายการเข้าคิวรอส่งแจ้งเตือน (Notification Queue)
     */
    async addToQueue(userId: string, itemId: string | null, scheduledAt: Date, message?: string): Promise<void> {
        // เช็คก่อนว่ามีคิวที่ค้างอยู่ (pending) ไหม เพื่อไม่ให้ส่งซ้ำซ้อน
        const { data: existing } = await supabase
            .from('notificationqueue_t')
            .select('queue_id')
            .match({ user_id: userId, status: 'pending' })
            .limit(1);

        if (existing && existing.length > 0) return;

        const { error } = await supabase
            .from('notificationqueue_t')
            .insert({
                user_id: userId,
                item_id: itemId,
                scheduled_at: scheduledAt.toISOString(),
                status: 'pending',
                custom_message: message
            });

        if (error) throw error;
    }

    async getPendingQueue(): Promise<any[]> {
        const { data, error } = await supabase
            .from('notificationqueue_t')
            .select(`
                *,
                pushsubscription_s (endpoint, p256dh_key, auth_key)
            `)
            .eq('status', 'pending')
            .lte('scheduled_at', new Date().toISOString());

        if (error) throw error;
        return data;
    }

    async updateQueueStatus(queueId: string, status: string): Promise<void> {
        const { error } = await supabase
            .from('notificationqueue_t')
            .update({ 
                status: status,
                sent_at: new Date().toISOString()
            })
            .eq('queue_id', queueId);

        if (error) throw error;
    }

    /**
     * 🕵️ หาผู้ใช้ที่มีคำศัพท์ถึงกำหนดทบทวน
     */
    async getUsersWithDueItems(): Promise<any[]> {
        const { data, error } = await supabase
            .from('appuser_m')
            .select(`
                user_id,
                reviewstatus_s!inner (item_id)
            `)
            .lte('reviewstatus_s.next_review_at', new Date().toISOString());

        if (error) throw error;
        return data;
    }

    async getDueCountForUser(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('reviewstatus_s')
            .select('*', { count: 'exact', head: true })
            .match({ user_id: userId })
            .lte('next_review_at', new Date().toISOString());

        if (error) throw error;
        return count || 0;
    }

    /**
     * 👥 ดึงรายชื่อผู้ใช้ที่ลงทะเบียนแจ้งเตือนไว้
     */
    async getAllActiveSubscribers(): Promise<any[]> {
        const { data, error } = await supabase
            .from('appuser_m')
            .select(`
                user_id,
                pushsubscription_s!inner (subscription_id)
            `);

        if (error) throw error;
        return data;
    }

    /**
     * 📖 ดึงคำศัพท์ที่จะนำไปแจ้งเตือนตามโหมดที่ตั้งไว้ [cite: 114, 117]
     */
    async getWordsForNotification(userId: string, mode: string, listId?: string, limit: number = 10): Promise<any[]> {
        if (mode === 'random') {
            // เรียกใช้ RPC function ที่เราสร้างไว้ใน Supabase
            const { data, error } = await supabase.rpc('get_random_vocabs', { 
                p_user_id: userId, 
                p_limit: limit 
            });
            if (error) throw error;
            return data;
        }

        // โหมดปกติ (SRS/Newest) [cite: 120]
        let query = supabase
            .from('reviewstatus_s')
            .select('item_id, globalvocab_m(title, content)')
            .eq('user_id', userId)
            .lte('next_review_at', new Date().toISOString())
            .order('next_review_at', { ascending: true })
            .limit(limit);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * ⚙️ อัปเดตการตั้งค่าแจ้งเตือน (Multi-Schedule) [cite: 142, 152]
     */
    async updateNotificationSettings(userId: string, settings: any): Promise<void> {
        const { error } = await supabase
            .from('usersetting_s')
            .upsert({
                user_id: userId,
                notif_time: settings.time,
                review_mode: settings.mode,
                item_limit: settings.maxItems || 10
            }, { onConflict: 'user_id' }); // ปรับตาม Logic ของคุณ [cite: 151]

        if (error) throw error;
    }
}