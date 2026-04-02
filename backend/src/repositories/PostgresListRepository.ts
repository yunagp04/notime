import { supabase } from "../config/supabaseClient";
import { IListRepository } from "../interfaces/IListRepository";

export class PostgresListRepository implements IListRepository {
    constructor(private supabase: any) {}
    
    async getLists(userId: string): Promise<{ list_id: string; name: string; vocab_count: number }[]> {
        // ใช้ชื่อตารางและคอลัมน์ตัวเล็กทั้งหมดตามหน้าจอ Supabase
        const { data, error } = await supabase
            .from('mylist_m')
            .select(`
                list_id,
                list_name,
                uservocab_m(count)
            `)
            .eq('owner_id', userId);

        if (error) throw error;

        return data.map(item => ({
            list_id: item.list_id,
            name: item.list_name,
            vocab_count: (item.uservocab_m as any)?.[0]?.count || 0
        }));
    }

    async createDefaultList(userId: string): Promise<void> {
        await this.createList(userId, "รายการใหม่ (Default)");
    }

    async getOrCreateDefaultList(userId: string): Promise<string> {
        const { data } = await supabase
            .from('mylist_m')
            .select('list_id')
            .eq('owner_id', userId)
            .order('created_at', { ascending: true })
            .limit(1);

        if (data && data.length > 0) return data[0].list_id;
        
        return await this.createList(userId, "Default List");
    }

    async createList(userId: string, name: string): Promise<string> {
        const { data, error } = await supabase
            .from('mylist_m')
            .insert({
                owner_id: userId,
                list_name: name
            })
            .select('list_id')
            .single();

        if (error) throw error;
        return data.list_id;
    }

    async updateList(userId: string, list_id: string, name: string): Promise<void> {
        const { error } = await supabase
            .from('mylist_m')
            .update({ list_name: name })
            .match({ list_id: list_id, owner_id: userId });
        if (error) throw error;
    }

    async deleteList(userId: string, list_id: string): Promise<void> {
        const { error } = await supabase
            .from('mylist_m')
            .delete()
            .match({ list_id: list_id, owner_id: userId });
        if (error) throw error;
    }

    async updateListCover(userId: string, listId: string, url: string): Promise<void> {
        const { error } = await supabase
            .from('mylist_m')
            .update({ cover_url: url, updated_at: new Date().toISOString() })
            .match({ user_id: userId, list_id: listId });

        if (error) throw error;
    }
}