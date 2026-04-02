import { createClient } from '@supabase/supabase-js';

// ใช้ REACT_APP_ นำหน้าสำหรับ Create React App นะครับ
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || '';

// 🚩 เติม export เพื่อให้ TypeScript รู้ว่าเป็น Module และไฟล์อื่นเรียกใช้ได้
export const supabase = createClient(supabaseUrl, supabaseKey);