// src/TestSidebar.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FaUserCircle, FaHome, FaUsers, FaClock, FaCalendarAlt, FaBookOpen,
  FaFileInvoiceDollar, FaBriefcase, FaFileContract, FaExchangeAlt, FaFileAlt,
  FaAngleUp, FaAngleDown, FaSignOutAlt, FaUserEdit // Make sure FaUserEdit is imported if used
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom'; // Using Link and useLocation

const SCROLL_AMOUNT = 70;

const TestSidebar = () => {
  // No local activeItem state, derived from route
  const navRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const location = useLocation();

  const navItems = [
    { id: "Dashboard", icon: <FaHome />, text: "Dashboard", route: "/admin" },
    { id: "Employés", icon: <FaUsers />, text: "Employés", route: "/admin/employes" },
    { id: "Absences", icon: <FaClock />, text: "Absences", route: "/admin/absences" },
    { id: "Congés", icon: <FaCalendarAlt />, text: "Congés", route: "/admin/conges" },
    { id: "Material", icon: <FaBriefcase />, text: "Matériel", route: "/admin/material" },
    { id: "Formation", icon: <FaBookOpen />, text: "Formation", route: "/admin/formation" },
    { id: "paie", icon: <FaFileInvoiceDollar />, text: "Fiches de paie", route: "/admin/FichePaie" },
    { id: "Recrutements", icon: <FaBriefcase />, text: "Recrutements", route: "/admin/recrutements" },
    { id: "Attestations", icon: <FaFileContract />, text: "Attestations", route: "/admin/attestations" },
    { id: "Calendrier", icon: <FaCalendarAlt />, text: "Calendrier", route: "/admin/calendrier" },
    // Ensure all routes defined in App.js have a corresponding navItem if they should highlight in sidebar
    // { id: "Profile", icon: <FaUserEdit />, text: "My Profile", route: "/admin/profile"},
  ];

  const getActiveItem = () => {
    const currentPath = location.pathname;
    // Find the best match. For exact match or index route for /admin
    const matchedItem = navItems.find(item => currentPath === item.route);
    if (matchedItem) return matchedItem.id;
    if (currentPath === "/admin" && navItems.some(item => item.id === "Dashboard" && item.route === "/admin")) return "Dashboard";

    // More robust: find longest matching route prefix
    let bestMatch = null;
    let longestMatchLength = 0;
    for (const item of navItems) {
        if (currentPath.startsWith(item.route) && item.route.length > longestMatchLength) {
            longestMatchLength = item.route.length;
            bestMatch = item.id;
        }
    }
    return bestMatch;
  };
  const activeItem = getActiveItem();

  const handleLogout = () => {
    console.log("User logged out");
    alert("Logout action triggered!");
    // navigate('/login'); // Example navigation after logout
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
    if (currentNavRef) currentNavRef.addEventListener('scroll', checkAndUpdate);
    const resizeObserver = new ResizeObserver(checkAndUpdate);
    if (currentNavRef) {
      resizeObserver.observe(currentNavRef);
      if (currentNavRef.firstChild && currentNavRef.firstChild instanceof Element) {
        resizeObserver.observe(currentNavRef.firstChild);
      }
    }
    return () => {
      if (currentNavRef) currentNavRef.removeEventListener('scroll', checkAndUpdate);
      if (resizeObserver && currentNavRef) {
        resizeObserver.unobserve(currentNavRef);
        if (currentNavRef.firstChild && currentNavRef.firstChild instanceof Element) {
          resizeObserver.unobserve(currentNavRef.firstChild);
        }
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [navItems.length, updateScrollButtonStates]);

  const scrollUp = () => navRef.current?.scrollBy({ top: -SCROLL_AMOUNT, behavior: 'smooth' });
  const scrollDown = () => navRef.current?.scrollBy({ top: SCROLL_AMOUNT, behavior: 'smooth' });

  // Subtle Scroll Button (using dark theme colors)
  const SubtleScrollButton = ({ onClick, disabled, icon, ariaLabel, isUpButton }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        w-8 h-8 flex items-center justify-center rounded-full text-md
        transition-all duration-200 ease-in-out transform
        focus:outline-none focus:ring-1 focus:ring-[#C8D9E6]/50 /* Sky Blue focus for dark theme */
        ${isUpButton ? 'mb-1' : 'mt-1'}
        group
        ${disabled
          ? 'bg-transparent text-transparent cursor-not-allowed opacity-0 scale-90'
          // For dark theme, text is Sky Blue, hover background is Teal (accent)
          : 'bg-[#567C8D]/10 text-[#C8D9E6]/70 hover:text-white hover:bg-[#567C8D]/40 hover:scale-110 active:scale-100 active:bg-[#567C8D]/60'
        }
      `}
    >
      {icon}
    </button>
  );

  return (
    // Sidebar with Navy background (original dark theme)
    <div className="bg-cyan-800 w-28 flex flex-col items-center p-3 fixed left-0 top-0 h-full">
        {/* User Profile Section */}
        <div className="flex flex-col items-center mt-3 mb-2 flex-shrink-0">
          {/* Avatar circle with Teal background, White icon */}
          <div className="w-12 h-12 bg-[#567C8D] rounded-full flex items-center justify-center text-white text-2xl mb-2">
            <FaUserCircle />
          </div>
          {/* Name text White, Admin text Sky Blue */}
          <h2 className="text-white font-semibold text-sm">Youssef</h2>
          <p className="text-xs text-[#C8D9E6]/80">Admin</p>
        </div>

        {/* Quick Logout Button - Styled for dark theme */}
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

        <nav ref={navRef} className="flex-grow w-full overflow-y-auto hide-scrollbar">
          <ul className="space-y-3 py-0.5">
            {navItems.map((item) => (
              <li key={item.id} className="w-full">
                <Link
                  to={item.route}
                  className="flex flex-col items-center justify-center py-1.5 w-full group rounded-lg"
                >
                  {/* Icon Box */}
                  <div
                    className={`
                      w-10 h-10 flex items-center justify-center rounded-lg mb-1
                      transition-all duration-200
                      ${activeItem === item.id
                        ? 'bg-[#567C8D] text-white' // Active: Teal box, White icon
                        : 'bg-transparent text-[#C8D9E6] group-hover:bg-[#567C8D]/30 group-hover:text-white' // Inactive: Sky Blue icon; Hover: Translucent Teal box, White icon
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  {/* Text Label */}
                  <span
                    className={`
                      text-xs font-medium text-center px-1
                      transition-colors duration-200
                      ${activeItem === item.id
                        ? 'text-white' // Active text: White (since icon box is Teal)
                        : 'text-[#C8D9E6]/90 group-hover:text-white' // Inactive text: Sky Blue; Hover: White
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