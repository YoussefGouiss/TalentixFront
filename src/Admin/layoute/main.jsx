import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import TestSidebar from '../../test';

export default function MainLayoute() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
    }
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5EFEB]">
      <TestSidebar />

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
