import React from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';
import { Outlet } from 'react-router-dom';

export default function MainLayoute() {
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
