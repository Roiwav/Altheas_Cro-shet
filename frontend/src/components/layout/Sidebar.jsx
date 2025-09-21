import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ShoppingBag,
  Info,
  MessageSquare,
  Phone,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { useDarkMode } from "../../context/DarkModeContext.jsx";

export default function Sidebar({
  isOpen,
  setIsOpen,
  scrollToSection,
  aboutRef,
  contactRef,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();

  // Avatar state
  const [avatar, setAvatar] = useState(null);
  const [userName, setUserName] = useState("Guest User");

  useEffect(() => {
    const savedAvatar = localStorage.getItem("userAvatar");
    const savedName = localStorage.getItem("userName");
    if (savedAvatar) setAvatar(savedAvatar);
    if (savedName) setUserName(savedName);
  }, []);

  useEffect(() => {
    if (avatar) localStorage.setItem("userAvatar", avatar);
  }, [avatar]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const sidebarOpen = isOpen || false;

  const setSidebarOpen = setIsOpen || (() => {});

  const smoothScrollToTop = (duration = 1200) => {
    const start = window.scrollY;
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, start * (1 - easeOut));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const isHomePage = location.pathname === "/" || location.pathname === "/home";

  const Menus = [
    {
      title: "Home",
      icon: Home,
      path: "/home",
      action: () => {
        if (isHomePage) smoothScrollToTop();
      },
    },
    { title: "Shop Now", icon: ShoppingBag, path: "/shop" },
    {
      title: "About Us",
      icon: Info,
      path: "/about",
      action: () => {
        if (isHomePage && scrollToSection && aboutRef) scrollToSection(aboutRef);
      },
    },
    {
      title: "Contact Us",
      icon: Phone,
      path: "/contact",
      action: () => {
        if (isHomePage && scrollToSection && contactRef) scrollToSection(contactRef);
      },
    },
    { title: "FAQ", icon: Info, path: "/faq", gap: true },
    { title: "Orders", icon: ShoppingBag, path: "/orders" },
    { title: "Blog", icon: BookOpen, path: "/blog", gap: true },
    { title: "Feedback", icon: MessageSquare, path: "/feedback" },
    { title: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div className="relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 ease-in-out
        ${sidebarOpen || isHovered ? "w-72" : "w-20"}
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        bg-white dark:bg-gray-900 shadow-lg`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Avatar + Username */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <img
                src={
                  avatar ||
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"
                }
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover cursor-pointer"
                onClick={() => document.getElementById("avatarUpload").click()}
              />
              <span
                className={`text-lg font-semibold text-gray-800 dark:text-gray-200 ${
                  !sidebarOpen && !isHovered ? "hidden" : "block"
                }`}
              >
                {userName}
              </span>
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
            <ul className="space-y-1">
              {Menus.map((menu, idx) => {
                const handleClick = (e) => {
                  if (menu.action) menu.action(e);
                  setSidebarOpen(false);
                };

                if (isHomePage && menu.action) {
                  // Use button for smooth scroll on landing page
                  return (
                    <li key={idx}>
                      <button
                        className={`flex items-center w-full text-left px-4 py-3 text-sm font-medium rounded-md transition-colors
                          ${menu.gap ? "mt-4" : ""} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800
                          ${sidebarOpen || isHovered ? "px-4" : "px-2 justify-center"}`}
                        onClick={handleClick}
                      >
                        <menu.icon className="w-6 h-6" />
                        <span
                          className={`ml-3 ${!sidebarOpen && !isHovered ? "hidden" : "block"}`}
                        >
                          {menu.title}
                        </span>
                      </button>
                    </li>
                  );
                }

                // Normal Link navigation
                return (
                  <li key={idx}>
                    <Link
                      to={menu.path}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                        ${
                          location.pathname === menu.path
                            ? "bg-pink-50 text-pink-600 dark:bg-gray-800 dark:text-pink-400"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        }
                        ${menu.gap ? "mt-4" : ""} ${sidebarOpen || isHovered ? "px-4" : "px-2 justify-center"}`}
                      onClick={handleClick}
                    >
                      <menu.icon className="w-6 h-6" />
                      <span
                        className={`ml-3 ${!sidebarOpen && !isHovered ? "hidden" : "block"}`}
                      >
                        {menu.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom section: Dark Mode */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleDarkMode}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {darkMode ? (
                <>
                  <Sun className="w-5 h-5" />
                  <span className={`ml-3 ${!sidebarOpen && !isHovered ? "hidden" : "block"}`}>
                    Light Mode
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  <span className={`ml-3 ${!sidebarOpen && !isHovered ? "hidden" : "block"}`}>
                    Dark Mode
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform duration-200"
      >
        <Menu size={20} className="text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
}
