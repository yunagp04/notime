import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ChevronUp } from 'lucide-react';

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import VocabPage from "./pages/VocabPage";
import VocabList from "./pages/VocabList";
import ReviewPage from './pages/ReviewPage';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;