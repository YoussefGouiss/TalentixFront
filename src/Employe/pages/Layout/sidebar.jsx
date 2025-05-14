
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, Clock, Calendar, BookOpen, FileText, FileCheck, File, Briefcase, Home } from "lucide-react";

export default function SidebarEmploye() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Routes for each menu item
  const menuItems = [
    {id: "Dashboard", icon: <Home size={20} />, text: "Dashboard", route: "/employe" },
    {id: "Congés", icon: <Calendar size={20} />, text: "Congés", route: "/employe/conges" },
    {id: "formation", icon: <BookOpen size={20} />, text: "formation", route: "/employe/formations" },
    {id: "absences", icon: <FileText size={20} />, text: "absences", route: "/employe/absences" },
    {id: "Attestations", icon: <FileCheck size={20} />, text: "Attestations", route: "/employe/attestations" },
    {id: "Calendrier", icon: <Calendar size={20} />, text: "Calendrier", route: "/employe/calendrier" },
    {id: "Materiel", icon: <BookOpen size={20} />, text: "Materiel", route: "/employe/material" },

  ];


  return (
    <div className={`bg-cyan-800 text-white ${collapsed ? 'w-16' : 'w-60'} transition-all duration-300 h-screen`}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <img src="logo1.png" alt="Logo" className="h-8" />
          </div>
        )}
      
      </div>
      <div className="mt-8">
        {menuItems.map((item) => {
          // Check if this menu item is active based on the current URL path
          const isActive = location.pathname === item.route;
          
          return (
            <Link
              key={item.id}
              to={item.route}
              className={`w-full flex items-center px-4 py-3 cursor-pointer hover:bg-cyan-700 transition-all ${
                isActive ? "bg-gray-100 text-cyan-600 rounded-l-full ml-5" : "text-white"
              }`}
            >
              <div className="flex items-center">
                {item.icon}
                {!collapsed && <span className="ml-4">{item.text}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}