import { useEffect, useState } from 'react';
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';

export default function Navbar({ currentPage, toggleSidebar }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState({}); 
  const handleLogout = () => {
    localStorage.removeItem('admin_token'); // ⬅️ مسح التوكن
    window.location.href = "/admin/login"; // ⬅️ رجّع لصفحة الدخول
  };
  useEffect(()=>{
   const response = fetch('http://localhost:8000/api/admin/profile',{
    method : 'GET',
    headers : {
      'Authorization' : `Bearer ${localStorage.getItem('admin_token')}`,
      'Content-Type' : 'application/json',
   }
   })
   .then(res => res.json())
   .then(data => {
    setUser(data);
   })
  })
  return (
    <div className="h-16 bg-gradient-to-r from-cyan-800 to-blue-900 flex items-center justify-between px-6 w-full text-white shadow-md">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          className="text-white/80 hover:text-white p-1"
          onClick={toggleSidebar}
        >
          <Menu size={20} />
        </button>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-5">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 bg-blue-700/30 border border-blue-700 rounded-md text-sm w-48 focus:outline-none focus:ring-1 focus:ring-blue-400 text-white placeholder-blue-300"
          />
        </div>
        
        {/* Notifications */}
        <button className="text-white/80 hover:text-white relative">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            2
          </span>
        </button>
        
        {/* User Profile */}
        <div className="relative">
          <button
            className="flex items-center gap-2"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white/30">
              JD
            </div>
            <span className="text-sm text-white/90 hidden md:inline-block">{user.name}</span>
            <ChevronDown size={14} className="text-white/70" />
          </button>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-blue-900 rounded-md shadow-lg border border-blue-700">
              <div className="py-2">
                <button className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-blue-800 flex items-center gap-2">
                  <User size={14} className="text-blue-300" />
                  <span>Mon profil</span>
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-blue-800 flex items-center gap-2">
                  <Settings size={14} className="text-blue-300" />
                  <span>Paramètres</span>
                </button>
                <div className="border-t border-blue-700 my-1"></div>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-blue-800 flex items-center gap-2">
                  <LogOut size={14} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}