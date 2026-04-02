import { IAuthStrategy, AuthUserData } from "../interfaces/IAuthStrategy";
import { supabase } from "../config/supabaseClient";

export class SupabaseAuthStrategy implements IAuthStrategy {
    async getUserInfo(headers: any): Promise<AuthUserData | null> {
        // ใช้ SDK ของ Supabase ตรวจสอบว่า Token ถูกต้องไหม
        const token = headers.authorization?.split(' ')[1]; // ดึง token จาก header
        if (!token) return null;
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) return null;

        return {
            providerId: user.id, // UUID จาก Supabase Auth
            displayName: user.user_metadata.display_name || 'User',
            email: user.email || ''
        };
    }
}