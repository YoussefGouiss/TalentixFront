import React, { useState } from 'react'; // Make sure React is imported for React.cloneElement
import { Home, Users, Clock, Calendar, FileText, BookOpen, FileCheck, Repeat, File } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  // Initialize activePage with the ID of the "Dashboard" item or the first item
  const [activePage, setActivePage] = useState('admin'); 
  
  const menuItems = [
    { id: 'admin', icon: <Home size={18} />, text: 'Dashboard' },
    { id: 'admin/employes', icon: <Users size={18} />, text: 'Les employés' },
    { id: 'admin/presences', icon: <Clock size={18} />, text: 'Présences' },
    { id: 'admin/conges', icon: <Calendar size={18} />, text: 'Congés' },
    { id: 'formation', icon: <BookOpen size={18} />, text: 'Formation' },
    { id: 'paie', icon: <FileText size={18} />, text: 'Fiches de paie' },
    { id: 'recrutement', icon: <FileCheck size={18} />, text: 'Recrutement' },
    { id: 'attestations', icon: <File size={18} />, text: 'Attestations' },
    { id: 'mutations', icon: <Repeat size={18} />, text: 'Les mutations internes' },
    { id: 'contrats', icon: <FileText size={18} />, text: 'Contrats' },
    { id: 'calendrier', icon: <Calendar size={18} />, text: 'Visualiser le calendrier' }
  ];
  
  return (
    <div className="w-64 bg-blue-600 text-white flex flex-col h-screen fixed inset-y-0 left-0 z-20">
      {/* Logo */}
      <div className="px-8 py-6 flex justify-center items-center">
        {/* Assuming logo1.png is in your public folder or accessible via this path */}
        <img src='/logo1.png' alt="Talentix Logo" className='h-12 w-auto'/> 
      </div>
      
      {/* Menu Items */}
      {/* The nav container itself has no horizontal padding; items manage their own margins/padding */}
      <nav className="flex-grow py-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => (
          <Link
            key={item.id}
            to={`/${item.id}`}
            onClick={() => setActivePage(item.id)}
            className={`
              group flex items-center text-sm font-medium transition-colors duration-150 w-full
              ${
                activePage === item.id
                  ? 'bg-white text-blue-600 rounded-l-full py-3 pl-8 pr-4 -mr-4 shadow-lg relative z-10' // Active item "pops out"
                  : 'text-white/80 hover:text-white hover:bg-blue-700/60 rounded-lg py-3 px-6 mx-2' // Inactive items slightly inset
              }
            `}
          >
            {/* Clone the icon element to add classes for color and margin */}
            {React.cloneElement(item.icon, {
              className: `mr-3 shrink-0 ${ // shrink-0 prevents icon from shrinking
                activePage === item.id
                  ? 'text-blue-600' // Icon color for active item
                  : 'text-white/80 group-hover:text-white' // Icon color for inactive item
              }`,
              // size is already defined in menuItems objects (size={18})
            })}
            <span>{item.text}</span>
          </Link>
        ))}
      </nav>
      
      {/* Footer */}
      <div className="px-8 py-4 mt-auto border-t border-blue-500/50 text-center text-sm text-white/70">
        Version 30 - Admin Dashboard
        <br />
        © 2025 Talentix
      </div>
    </div>
  );
}