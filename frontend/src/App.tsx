import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ChevronUp } from 'lucide-react';
import { supabase } from './lib/supabase';

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import VocabPage from "./pages/VocabPage";
import VocabList from "./pages/VocabList";
import ReviewPage from './pages/ReviewPage';
import Settings from './pages/Settings';

// Navigation button to return to the main dashboard
const GlobalBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the back button if the user is already on the home or dashboard page
  if (location.pathname === '/' || location.pathname === '/dashboard') {
    return null;
  }

  return (
    <div className="fixed bottom-10 left-10 z-50">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-2 p-4 bg-white text-slate-600 rounded-2xl shadow-2xl border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all duration-300 group"
      >
        <LayoutDashboard size={24} className="group-hover:scale-110 transition-transform" />
        <span className="font-bold pr-2">Back to Dashboard</span>
      </button>
    </div>
  );
};

// Scroll to top button with dynamic positioning based on current route
const GlobalScrollToTop = () => {
  const location = useLocation();
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Adjust positioning for specific detail pages to avoid UI overlap
  const uuidRegex = /^\/vocab\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isVocabDetailPage = uuidRegex.test(location.pathname);

  return (
    <div 
      className={`fixed right-10 z-[60] transition-all duration-500 ease-in-out
        ${isVocabDetailPage ? 'bottom-36' : 'bottom-10'}`} 
    >
      <button 
        onClick={scrollToTop}
        className="p-4 bg-white/90 backdrop-blur text-slate-400 rounded-full shadow-lg border border-slate-100 hover:text-indigo-600 transition-all hover:scale-110"
      >
        <ChevronUp size={24} />
      </button>
    </div>
  );
};

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // 1. เช็ค Session ปัจจุบันตอนเปิดแอป
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        localStorage.setItem('token', session.access_token); // 💳 เก็บแต้มบุญ (Token)
      }
    });

    // 2. คอยฟังการเปลี่ยนแปลง (เช่น Login สำเร็จ หรือ Log out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        localStorage.setItem('token', session.access_token);
      } else {
        localStorage.removeItem('token'); // ล้างบัตรทิ้งถ้าออกระบบ
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🎯 ถ้ายังไม่มี Session ให้โชว์หน้า Login แบบง่ายๆ ไปก่อน
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <h1 className="text-2xl font-bold mb-6 text-indigo-900">Intelligent Recall Platform</h1>
        <button 
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
          className="px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-3 font-semibold text-slate-700"
        >
          <img src="https://www.google.com/favicon.ico" alt="google" className="w-5 h-5" />
          Login with Google
        </button>
      </div>
    );
  }

  // 🎯 ถ้า Login แล้ว ให้โชว์หน้าแอปปกติของคุณ Paweena
  return (
    <BrowserRouter>
      <Navbar />
      <GlobalBackButton />
      <GlobalScrollToTop />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vocab" element={<VocabPage />} />
        <Route path="/vocab/:id" element={<VocabList />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;