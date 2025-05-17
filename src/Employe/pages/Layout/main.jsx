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
    <div className="flex h-screen overflow-hidden bg-[#F5EFEB]">
      <SidebarEmploye />

      <main
        className="flex-1 flex flex-col overflow-y-auto border-[10px] border-cyan-800"
        style={{ marginLeft: "112px" }} // match sidebar width
      >
        <img src='\public\logo2.png' className='w-48 mt-4 ml-7' />
        <div className="flex-grow p-6 md:p-8 mt-10">
            
          <Outlet />
        </div>
      </main>
    </div>
  );
}
