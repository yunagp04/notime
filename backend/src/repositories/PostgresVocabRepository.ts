import { supabase } from "../config/supabaseClient";
import { IVocabRepository } from "../interfaces/IVocabRepository";

export class PostgresVocabRepository implements IVocabRepository {

    constructor(private supabase: any) {}
    // === Global & User Vocab Section ===

    async findGlobalItem(word: string): Promise<any | null> {
        const { data } = await supabase
            .from('globalvocab_m')
            .select('*')
            .eq('title', word.trim())
            .maybeSingle();
        return data;
    }

    async saveGlobalItem(word: string, definition: string): Promise<string> {
        const { data, error } = await supabase
            .from('globalvocab_m')
            .insert({ title: word.trim(), content: definition, item_type: 'vocabulary' })
            .select('item_id')
            .single();
        if (error) throw error;
        return data.item_id;
    }

    async linkUserItem(userId: string, itemId: string, listId: string): Promise<void> {
        const { error } = await supabase
            .from('uservocab_m')
            .upsert({ user_id: userId, item_id: itemId, list_id: listId });
        if (error) throw error;
    }

    async getAllVocabs(userId: string, listId?: string): Promise<any[]> {
        let query = supabase
            .from('uservocab_m')
            .select(`
                item_id, custom_definition,
                globalvocab_m(title, content),
                reviewstatus_s(difficulty, next_review_at)
            `)
            .eq('user_id', userId);

        if (listId) query = query.eq('list_id', listId);

        const { data, error } = await query;
        if (error) throw error;

        return data.map((row: any) => ({
            id: row.item_id,
            word: row.globalvocab_m?.title,
            // Logic COALESCE: ดึงส่วนตัวก่อน ถ้าไม่มีให้ใช้ค่ากลาง [cite: 163]
            definition: row.custom_definition || row.globalvocab_m?.content,
            difficulty: row.reviewstatus_s?.[0]?.difficulty || 0,
            nextReview: row.reviewstatus_s?.[0]?.next_review_at
        }));
    }

    // === SRS & Review Section ===

    async initReviewState(userId: string, itemId: string): Promise<void> {
        await supabase.from('reviewstatus_s').upsert({
            user_id: userId, item_id: itemId,
            next_review_at: new Date().toISOString(),
            difficulty: 2.5, interval_days: 0, review_count: 0
        });
    }

    async getReviewState(userId: string, itemId: string): Promise<any | null> {
        const { data } = await supabase
            .from('reviewstatus_s')
            .select('*')
            .match({ user_id: userId, item_id: itemId })
            .maybeSingle();
        return data;
    }

    async updateReviewState(itemId: string, userId: string, nextReview: Date, difficulty: number, interval: number): Promise<void> {
        await supabase.from('reviewstatus_s').update({
            next_review_at: nextReview.toISOString(),
            difficulty, interval_days: interval
        }).match({ user_id: userId, item_id: itemId });
    }

    // === Analytics Section ===

    async saveReviewHistory(history: any): Promise<void> {
        await supabase.from('reviewhistory_t').insert({
            user_id: history.userId, item_id: history.itemId,
            rating: history.rating, reviewed_at: new Date().toISOString()
        });
    }

    async getReviewSummary(userId: string): Promise<any> {
        const { data } = await supabase.from('reviewstatus_s').select('*').eq('user_id', userId);
        const stats = { New: 0, Learning: 0, Mastered: 0, Total: data?.length || 0 };
        data?.forEach(r => {
            if (r.review_count === 0) stats.New++;
            else if (r.interval_days > 30) stats.Mastered++;
            else stats.Learning++;
        });
        return stats;
    }

    async getReviewHistory(userId: string): Promise<any[]> {
        // ต้องรัน SQL สร้าง RPC Function ก่อนเรียกใช้นะครับ
        const { data } = await supabase.rpc('get_review_history_stats', { p_user_id: userId });
        return data || [];
    }

    // === AI & Search Section ===

    async saveEmbedding(itemId: string, vector: number[]): Promise<void> {
        await supabase.from('wordembedding_s').upsert({
            item_id: itemId, vector_data: vector, model_version: 'text-embedding-004'
        });
    }

    async searchByVector(userId: string, searchVector: number[]): Promise<any[]> {
        const { data } = await supabase.rpc('match_vocab_embeddings', {
            query_embedding: searchVector, match_threshold: 0.5, match_count: 10, p_user_id: userId
        });
        return data || [];
    }

    // === Missing Methods Implementation ===

    async getVocabs(userId: string, listId?: string) { return this.getAllVocabs(userId, listId); }

    async updateVocab(userId: string, itemId: string, data: { definition?: string; listId?: string }): Promise<void> {
        await supabase.from('uservocab_m').update({
            custom_definition: data.definition, list_id: data.listId
        }).match({ user_id: userId, item_id: itemId });
    }

    async deleteVocab(userId: string, itemId: string): Promise<void> {
        await supabase.from('uservocab_m').delete().match({ user_id: userId, item_id: itemId });
    }

    async getDueVocabs(userId: string): Promise<any[]> {
        const { data } = await supabase
            .from('reviewstatus_s')
            .select('item_id, globalvocab_m(title, content)')
            .eq('user_id', userId)
            .lte('next_review_at', new Date().toISOString());
        
        return data?.map(r => ({ 
            id: r.item_id, 
            title: (r.globalvocab_m as any).title, 
            content: (r.globalvocab_m as any).content 
        })) || [];
    }

    async getRandomVocabs(userId: string, limit: number): Promise<any[]> {
        const { data } = await supabase.rpc('get_random_vocabs', { p_user_id: userId, p_limit: limit });
        return data || [];
    }

    async getVocabsByList(userId: string, listId: string): Promise<any[]> {
        return this.getAllVocabs(userId, listId);
    }
}