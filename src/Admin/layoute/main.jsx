import React from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';
import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MainLayoute() {
  const navigate = useNavigate();
    
  useEffect(() => {
      // Vérifier si le token est présent dans le localStorage
      const token = localStorage.getItem("admin_token");
      
      // Si aucun token n'est trouvé, rediriger vers la page de login
      if (!token) {
          navigate("/admin/login");  // Rediriger vers la page de login
      }
  }, [navigate]);
  return (
    <div className="flex flex-col ">
      <Navbar/>
    <div className="flex flex-1">
        <Sidebar/>
        <main className="flex-1 p-4 bg-gray-100">
      <Outlet/>
        </main>
      </div>
    </div>
  );
}
