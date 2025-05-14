
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, Clock, Calendar, BookOpen, FileText, FileCheck, File, Briefcase, Home } from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Routes for each menu item
  const menuItems = [
    {id: "Dashboard", icon: <Home size={20} />, text: "Dashboard", route: "/admin" },
    {id: "Employés", icon: <Users size={20} />, text: "Employés", route: "/admin/employes" },
    {id: "Absences", icon: <Clock size={20} />, text: "Absences", route: "/admin/absences" },
    {id: "Congés", icon: <Calendar size={20} />, text: "Congés", route: "/admin/conges" },
    {id: "Material", icon: <Calendar size={20} />, text: "Material", route: "/admin/material" },
    {id: "Formation", icon: <BookOpen size={20} />, text: "Formation", route: "/admin/formation" },
    {id: "paie", icon: <FileText size={20} />, text: "Fiches de paie", route: "/admin/FichePaie" },
    {id: "Recrutement", icon: <Briefcase size={20} />, text: "Recrutement", route: "/admin/recrutement" },
    {id: "Attestations", icon: <FileCheck size={20} />, text: "Attestations", route: "/admin/attestations" },
    {id: "Mutations", icon: <File size={20} />, text: "Mutations", route: "/admin/mutations" },
    {id: "Contrats", icon: <Briefcase size={20} />, text: "Contrats", route: "/admin/contrats" },
    {id: "Calendrier", icon: <Calendar size={20} />, text: "Calendrier", route: "/admin/calendrier" },
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