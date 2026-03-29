import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Library, PlusCircle } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  
  // Navigation items configuration
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vocab', label: 'Vocab', icon: Library },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Brand Logo */}
          <h1 className="text-xl font-bold bg-indigo-600 text-white px-3 py-1 rounded-lg">IR</h1>
          
          {/* Main Navigation Links */}
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

        {/* Action Button */}
        <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all">
          <PlusCircle size={18} />
          New Word
        </button>
      </div>
    </nav>
  );
};

export default Navbar;