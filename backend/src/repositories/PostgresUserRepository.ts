// backend/src/repositories/PostgresUserRepository.ts
import { IUserRepository } from "../interfaces/IUserRepository";

export class PostgresUserRepository implements IUserRepository {

    constructor(private supabaseClient: any) {}
    
    async getUserByAuthProviderID(userId: string) {
        const { data, error } = await this.supabaseClient 
            .from('appuser_m')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async registerNewUser(userData: { 
        email: string; 
        name: string; 
        provider: string; 
        providerUserId: string 
    }) {
        const { data, error } = await this.supabaseClient
            .from('appuser_m')
            .insert({
                user_id: userData.providerUserId,
                email: userData.email,
                display_name: userData.name,
                provider: userData.provider,
                provider_user_id: userData.providerUserId,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async saveSubscription(userId: string, sub: any): Promise<void> {
        const { error } = await this.supabaseClient
            .from('pushsubscription_s')
            .upsert({
                user_id: userId,
                endpoint: sub.endpoint,
                p256dh_key: sub.keys.p256dh,
                auth_key: sub.keys.auth,
                created_at: new Date().toISOString()
            }, { onConflict: 'endpoint' });

        if (error) throw error;
    }
}