// Login.tsx หรือ App.tsx
import { supabase } from '../lib/supabase'; // 🚩 Path ที่เราแก้กันไปเมื่อกี้

const handleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // 🚩 สำคัญ: หลัง Login เสร็จให้เด้งกลับมาที่หน้าแรกของแอปเราบน Render
      redirectTo: window.location.origin 
    }
  });

  if (error) console.error("Login Error:", error.message);
};