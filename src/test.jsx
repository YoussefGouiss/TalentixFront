// src/TestSidebar.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FaUserCircle, FaHome, FaUsers, FaClock, FaCalendarAlt, FaBookOpen,
  FaFileInvoiceDollar, FaBriefcase, FaFileContract, FaExchangeAlt, FaFileAlt,
  FaAngleUp, FaAngleDown, FaSignOutAlt, FaUserEdit
} from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate

const SCROLL_AMOUNT = 70;
const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Define if not already global

const TestSidebar = () => {
  const navRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate

  const navItems = [
    { id: "Dashboard", icon: <FaHome />, text: "Dashboard", route: "/admin" },
    { id: "Employés", icon: <FaUsers />, text: "Employés", route: "/admin/employes" },
    { id: "Absences", icon: <FaClock />, text: "Absences", route: "/admin/absences" },
    { id: "Congés", icon: <FaCalendarAlt />, text: "Congés", route: "/admin/conges" },
    { id: "Material", icon: <FaBriefcase />, text: "Matériel", route: "/admin/material" },
    { id: "Formation", icon: <FaBookOpen />, text: "Formation", route: "/admin/formation" },
    { id: "paie", icon: <FaFileInvoiceDollar />, text: "Fiches de paie", route: "/admin/FichePaie" },
    { id: "Recrutements", icon: <FaBriefcase />, text: "Recrutements", route: "/admin/recrutements" },
    { id: "Attestations", icon: <FaFileContract />, text: "Attestations", route: "/admin/attestations-demandes" }, // Matched to previous component's link
    { id: "AttestationTypes", icon: <FaFileAlt />, text: "Types Attest.", route: "/admin/attestations" }, // For managing types
  ];

  const getActiveItem = () => {
    const currentPath = location.pathname;
    const matchedItem = navItems.find(item => currentPath === item.route);
    if (matchedItem) return matchedItem.id;
    if (currentPath === "/admin" && navItems.some(item => item.id === "Dashboard" && item.route === "/admin")) return "Dashboard";

    let bestMatch = null;
    let longestMatchLength = 0;
    for (const item of navItems) {
        if (item.route && currentPath.startsWith(item.route) && item.route.length > longestMatchLength) {
            longestMatchLength = item.route.length;
            bestMatch = item.id;
        }
    }
    return bestMatch;
  };
  const activeItem = getActiveItem();

  const handleLogout = async () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        // Adjust the URL if your logout route is different
        // (e.g., /api/admin/auth/logout or just /api/admin/logout)
        const response = await fetch(`${API_BASE_URL}/admin/logout`, {
          method: 'POST', // Ensure this matches your route definition (POST is common for logout)
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          console.log("Successfully logged out from server.");
        } else {
          // Even if server logout fails, proceed with client-side cleanup
          const errorData = await response.json().catch(() => ({}));
          console.error("Server logout failed:", errorData.message || response.statusText);
        }
      } catch (error) {
        console.error("Error during server logout:", error);
      }
    }

    // Always perform client-side cleanup
    console.log("Clearing local token and navigating to login.");
    localStorage.removeItem('admin_token');
    navigate("/admin/login")
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
    let resizeObserver;

    if (currentNavRef) {
      currentNavRef.addEventListener('scroll', checkAndUpdate);
      resizeObserver = new ResizeObserver(checkAndUpdate);
      resizeObserver.observe(currentNavRef);
      if (currentNavRef.firstChild && currentNavRef.firstChild instanceof Element) {
        resizeObserver.observe(currentNavRef.firstChild);
      }
    }
    return () => {
      if (currentNavRef) {
        currentNavRef.removeEventListener('scroll', checkAndUpdate);
      }
      if (resizeObserver && currentNavRef) {
        resizeObserver.unobserve(currentNavRef);
        if (currentNavRef.firstChild && currentNavRef.firstChild instanceof Element) {
          resizeObserver.unobserve(currentNavRef.firstChild);
        }
        resizeObserver.disconnect();
      }
    };
  }, [navItems.length, updateScrollButtonStates]);

  const scrollUp = () => navRef.current?.scrollBy({ top: -SCROLL_AMOUNT, behavior: 'smooth' });
  const scrollDown = () => navRef.current?.scrollBy({ top: SCROLL_AMOUNT, behavior: 'smooth' });

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
    <div className="bg-cyan-800 w-28 flex flex-col items-center p-3 fixed left-0 top-0 h-full z-50"> {/* Added z-index */}
        <div className="flex flex-col items-center mt-3 mb-2 flex-shrink-0">
          <div className="w-12 h-12 bg-[#567C8D] rounded-full flex items-center justify-center text-white text-2xl mb-2">
            <FaUserCircle />
          </div>
          <h2 className="text-white font-semibold text-sm">Admin</h2>
          <p className="text-xs text-[#C8D9E6]/80">Admin</p>
        </div>

        <button
        
          onClick={handleLogout}
          aria-label="Quick Logout"
          className="
            flex items-center justify-center w-[calc(100%-1rem)] max-w-[90px] h-9 px-2.5 py-1.5 mb-3
            bg-[#567C8D]/20 hover:bg-[#567C8D]/40
            text-[#C8D9E6] hover:text-white
            rounded-lg shadow-md hover:shadow-lg
            transition-all duration-250 ease-out
            transform hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 active:shadow-inner
            focus:outline-none focus:ring-2 focus:ring-[#C8D9E6]/70 focus:ring-offset-1 focus:ring-offset-[#2F4156]
            flex-shrink-0 group
          "
        >
          <FaSignOutAlt className="mr-1.5 text-sm transition-transform duration-200 group-hover:rotate-[10deg]" />
          <span className="text-xs font-medium">Logout</span>
        </button>

        <SubtleScrollButton onClick={scrollUp} disabled={!canScrollUp} icon={<FaAngleUp />} ariaLabel="Scroll Up" isUpButton={true} />

        <nav ref={navRef} className="flex-grow w-full overflow-y-auto hide-scrollbar">
          <ul className="space-y-3 py-0.5">
            {navItems.map((item) => (
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
                    <span className="text-xl">{item.icon}</span>
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
  );
};

export default TestSidebar;