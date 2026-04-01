import React, { useState } from 'react'; // 🚩 เพิ่ม React และ useState
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Library, PlusCircle, X, LucideIcon } from 'lucide-react'; // 🚩 เพิ่ม X และ LucideIcon type
import { Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 🚩 กำหนด Interface สำหรับ Navigation Item
interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}
const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🚩 State management
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [word, setWord] = useState<string>('');
  const [definition, setDefinition] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vocab', label: 'Vocab', icon: Library },
  ];

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/vocab/add', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          word, 
          definition
        }), 
      });

      if (response.ok) {
        setWord('');
        setDefinition('');
        setIsOpen(false);
        // Reload เพื่อให้ตัวเลขบน Dashboard อัปเดตทันที
        window.location.reload(); 
      } else {
        const errData = await response.json();
        alert(errData.error || "เกิดข้อผิดพลาดในการเพิ่มคำศัพท์");
      }
    } catch (err) {
      console.error("❌ Add vocab failed:", err);
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold bg-indigo-600 text-white px-3 py-1 rounded-lg">IR</h1>
          
          <div className="flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                  location.pathname === item.path 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ปุ่ม New Word สำหรับเปิด Modal */}
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all active:scale-95 shadow-sm"
        >
          <PlusCircle size={18} />
          New Word
        </button>
        <button onClick={() => navigate('/settings')} className="flex items-center gap-3 p-4 hover:bg-slate-100 rounded-2xl">
          <SettingsIcon size={20} />
          <span className="font-bold">Settings</span>
        </button>
      </div>

      {/* Quick Add Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Quick Add</h2>
                <p className="text-sm text-slate-500">Adding to your primary collection</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Word</label>
                <input 
                  autoFocus
                  placeholder="e.g. Ephemeral"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Definition</label>
                <textarea 
                  placeholder="Meaning or notes (Leave blank for AI assistance)..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-28 resize-none transition-all"
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                />
              </div>

              <button 
                disabled={loading}
                type="submit" 
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:bg-slate-300 active:scale-[0.98]"
              >
                {loading ? 'Adding...' : 'Save to List'}
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;