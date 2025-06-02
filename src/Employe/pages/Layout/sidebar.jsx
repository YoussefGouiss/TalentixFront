import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Calendar,
  BookOpen,
  FileText,
  FileCheck,
  Briefcase,
  Banknote,
  Wallet

  // LogOut as LucideLogOut, // No longer needed if we use FaSignOutAlt
} from "lucide-react";
import { FaAngleUp, FaAngleDown, FaSignOutAlt, FaUserCircle } from 'react-icons/fa'; // Added FaUserCircle, FaSignOutAlt

// Configuration
const SCROLL_AMOUNT = 70;

export default function SidebarEmploye() {
  const navRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Employee-specific menu items - THIS CONTENT REMAINS UNCHANGED
  const menuItems = [
    { id: "Dashboard", icon: <Home size={22} />, text: "Dashboard", route: "/employe" },
    { id: "Congés", icon: <Calendar size={22} />, text: "Congés", route: "/employe/conges" },
    { id: "Formation", icon: <BookOpen size={22} />, text: "Formation", route: "/employe/formations" },
    { id: "Absences", icon: <FileText size={22} />, text: "Absences", route: "/employe/absences" },
    { id: "Attestations", icon: <FileCheck size={22} />, text: "Attestations", route: "/employe/attestations" },
    { id: "Materiel", icon: <Briefcase size={22} />, text: "Matériel", route: "/employe/material" },
    { id: "primes", icon: <Banknote size={22} />, text: "primes", route: "/employe/primes" },
    { id: "remboursements", icon: <Wallet size={22} />, text: "remboursements", route: "/employe/remboursements" },

  ];

  const getActiveItem = () => {
    const currentPath = location.pathname;
    const matchedItem = menuItems.find(item => currentPath === item.route);
    if (matchedItem) return matchedItem.id;
    if (currentPath === "/employe" && menuItems.some(item => item.id === "Dashboard" && item.route === "/employe")) return "Dashboard";

    let bestMatch = null;
    let longestMatchLength = 0;
    for (const item of menuItems) {
      if (currentPath.startsWith(item.route) && item.route.length > longestMatchLength) {
        longestMatchLength = item.route.length;
        bestMatch = item.id;
      }
    }
    return bestMatch;
  };
  const activeItem = getActiveItem();

  // Employee-specific logout logic - THIS REMAINS UNCHANGED
  const handleLogout = () => {
    console.log("Employee logging out...");
    localStorage.removeItem('employe_token');
    navigate('/employe/login'); // Adjust if your employee login route is different
  };

  const updateScrollButtonStates = useCallback(() => {
    if (navRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = navRef.current;
      setCanScrollUp(scrollTop > 5);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 5);
    }
  }, []);

  useEffect(() => {
    const currentNavRef = navRef.current;
    const checkAndUpdate = () => setTimeout(updateScrollButtonStates, 50);
    checkAndUpdate();
    if (currentNavRef) {
      currentNavRef.addEventListener('scroll', checkAndUpdate);
      const resizeObserver = new ResizeObserver(checkAndUpdate);
      resizeObserver.observe(currentNavRef);
      return () => {
        if (currentNavRef) currentNavRef.removeEventListener('scroll', checkAndUpdate);
        if (resizeObserver && currentNavRef) resizeObserver.unobserve(currentNavRef);
        if (resizeObserver) resizeObserver.disconnect();
      };
    }
  }, [menuItems.length, updateScrollButtonStates]);

  const scrollUp = () => navRef.current?.scrollBy({ top: -SCROLL_AMOUNT, behavior: 'smooth' });
  const scrollDown = () => navRef.current?.scrollBy({ top: SCROLL_AMOUNT, behavior: 'smooth' });

  // Subtle Scroll Button (Copied from TestSidebar theme)
  const SubtleScrollButton = ({ onClick, disabled, icon, ariaLabel, isUpButton }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        w-8 h-8 flex items-center justify-center rounded-full text-md
        transition-all duration-200 ease-in-out transform
        focus:outline-none focus:ring-1 focus:ring-[#C8D9E6]/50
        ${isUpButton ? 'mb-1' : 'mt-1'}
        group
        ${disabled
          ? 'bg-transparent text-transparent cursor-not-allowed opacity-0 scale-90'
          : 'bg-[#567C8D]/10 text-[#C8D9E6]/70 hover:text-white hover:bg-[#567C8D]/40 hover:scale-110 active:scale-100 active:bg-[#567C8D]/60'
        }
      `}
    >
      {icon}
    </button>
  );

  return (
    <>
      {/* Sidebar structure and base style from TestSidebar */}
      <div className="bg-cyan-800 w-28 flex flex-col items-center p-3 fixed left-0 top-0 h-full z-50">
        
        {/* User Profile Section - EXACTLY like TestSidebar */}
        <div className="flex flex-col items-center mt-3 mb-2 flex-shrink-0">
          {/* Avatar circle with Teal background, White icon */}
          <div className="w-12 h-12 bg-[#567C8D] rounded-full flex items-center justify-center text-white text-2xl mb-2">
            <FaUserCircle /> {/* Using FaUserCircle from TestSidebar */}
          </div>
          {/* Name text White, Role text Sky Blue - Placeholder, adjust as needed for actual employee data */}
          <h2 className="text-white font-semibold text-sm">Employé</h2> {/* Placeholder name */}
          <p className="text-xs text-[#C8D9E6]/80">Utilisateur</p> {/* Placeholder role */}
        </div>

        {/* Quick Logout Button - Styled EXACTLY like TestSidebar, using FaSignOutAlt */}
        <button
                 onClick={handleLogout}
                 aria-label="Quick Logout"
                 className="
                   flex items-center justify-center w-[calc(100%-1rem)] max-w-[90px] h-9 px-2.5 py-1.5 mb-3
                   bg-[#567C8D]/20 hover:bg-[#567C8D]/40  /* Base: translucent Teal, Hover: more opaque Teal */
                   text-[#C8D9E6] hover:text-white /* Sky Blue text, White on hover */
                   rounded-lg shadow-md hover:shadow-lg
                   transition-all duration-250 ease-out
                   transform hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 active:shadow-inner
                   focus:outline-none focus:ring-2 focus:ring-[#C8D9E6]/70 focus:ring-offset-1 focus:ring-offset-[#2F4156] /* Offset from Navy */
                   flex-shrink-0 group
                 "
               >
                 <FaSignOutAlt className="mr-1.5 text-sm transition-transform duration-200 group-hover:rotate-[10deg]" />
                 <span className="text-xs font-medium">Logout</span>
               </button>

        <SubtleScrollButton onClick={scrollUp} disabled={!canScrollUp} icon={<FaAngleUp />} ariaLabel="Scroll Up" isUpButton={true} />

        <nav ref={navRef} className="flex-grow w-full overflow-y-auto hide-scrollbar py-0.5">
          <ul className="space-y-3">
            {menuItems.map((item) => (
              <li key={item.id} className="w-full">
                <Link
                  to={item.route}
                  className="flex flex-col items-center justify-center py-1.5 w-full group rounded-lg"
                >
                  <div
                    className={`
                      w-10 h-10 flex items-center justify-center rounded-lg mb-1
                      transition-all duration-200
                      ${activeItem === item.id
                        ? 'bg-[#567C8D] text-white'
                        : 'bg-transparent text-[#C8D9E6] group-hover:bg-[#567C8D]/30 group-hover:text-white'
                      }
                    `}
                  >
                    {React.cloneElement(item.icon, { 
                        className: `transition-transform duration-150 ${activeItem === item.id ? 'scale-110' : 'group-hover:scale-105'}` 
                    })}
                  </div>
                  <span
                    className={`
                      text-xs font-medium text-center px-1
                      transition-colors duration-200
                      ${activeItem === item.id
                        ? 'text-white'
                        : 'text-[#C8D9E6]/90 group-hover:text-white'
                      }
                    `}
                  >
                    {item.text}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <SubtleScrollButton onClick={scrollDown} disabled={!canScrollDown} icon={<FaAngleDown />} ariaLabel="Scroll Down" isUpButton={false} />
      </div>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}