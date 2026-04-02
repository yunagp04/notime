import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// ดึงค่า Config จาก .env (ต้องไปก๊อปมาจากหน้า Settings > API ใน Supabase)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_KEY || '';

// สร้าง Client สำหรับเรียกใช้ Database และ Auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey);