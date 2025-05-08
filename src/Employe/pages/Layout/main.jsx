import React from 'react'
import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarEmploye from './sidebar';
import NavbarEmploye from './navbar';

export default function MainLayouteEmploye() {
  const navigate = useNavigate();
    
  useEffect(() => {
      // Vérifier si le token est présent dans le localStorage
      const token = localStorage.getItem("employe_token");
      
      // Si aucun token n'est trouvé, rediriger vers la page de login
      if (!token) {
          navigate("/employe/login");  // Rediriger vers la page de login
      }
  }, [navigate]);
  return (
    <div className="flex flex-col ">
      <NavbarEmploye/>
    <div className="flex flex-1">
        <SidebarEmploye/>
        <main className="flex-1 p-4 bg-gray-100">
      <Outlet/>
        </main>
      </div>
    </div>
  );
}
