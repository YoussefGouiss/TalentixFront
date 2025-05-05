import { useState } from 'react';
import { Home, Users, Clock, Calendar, FileText, BookOpen, FileCheck, Repeat, File } from 'lucide-react';

export default function Sidebar() {
const [activePage, setActivePage] = useState('dashboard');
  
const menuItems = [
    { id: 'dashboard', icon: <Home size={18} />, text: 'Dashboard' },
    { id: 'employes', icon: <Users size={18} />, text: 'Les employés' },
    { id: 'presences', icon: <Clock size={18} />, text: 'Présences' },
    { id: 'conges', icon: <Calendar size={18} />, text: 'Congés' },
    { id: 'formation', icon: <BookOpen size={18} />, text: 'Formation' },
    { id: 'paie', icon: <FileText size={18} />, text: 'Fiches de paie' },
    { id: 'recrutement', icon: <FileCheck size={18} />, text: 'Recrutement' },
    { id: 'attestations', icon: <File size={18} />, text: 'Attestations' },
    { id: 'mutations', icon: <Repeat size={18} />, text: 'Les mutations internes' },
    { id: 'contrats', icon: <FileText size={18} />, text: 'Contrats' },
    { id: 'calendrier', icon: <Calendar size={18} />, text: 'Visualiser le calendrier' }
  ];
  
  return (
    <div className="w-64 bg-gradient-to-b from-cyan-900 to-blue-800 text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-blue-700/30 flex justify-center">
        <div className="flex items-center gap-2">
        <img src='logo1.png' className='w-full h-50'/>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="flex-grow overflow-y-auto">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-white/10 transition-colors ${
              activePage === item.id ? 'bg-white/20 border-l-4 border-white pl-3' : 'text-white/80'
            }`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="text-white/80">{item.icon}</span>
            <span>{item.text}</span>
          </button>
        ))}
      </div>
      
      {/* Footer */}
      <div className="p-3 text-center text-xs text-white/50">
        Version 30 - Admin Dashboard
        <br />
        © 2025 Talentix
      </div>
    </div>
  );
}