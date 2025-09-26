import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
  ShoppingCart,
} from "lucide-react";
import { useDarkMode } from "../../context/DarkModeContext.jsx";
import { UserContext } from "../../context/UserContext.jsx";
import { useCart } from "../../context/CartContext.jsx";

export default function Sidebar({ isOpen, setIsOpen, isHovered, setIsHovered, scrollToSection, aboutRef, contactRef }) {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useContext(UserContext);
  const { cartItems } = useCart();

  const totalQuantity = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + item.qty, 0)
    : 0;

  // Prevent browser's back/forward swipe gesture on mobile
  useEffect(() => {
    document.body.style.overscrollBehaviorX = 'contain';
    // Cleanup function to restore default behavior if the component unmounts
    return () => {
      document.body.style.overscrollBehaviorX = 'auto';
    };
  }, []);

  useEffect(() => {
    // This effect is for desktop view to communicate hover state to Navbar.
    // It sets a CSS variable that the Navbar can use for its positioning.
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) { // lg breakpoint
      document.documentElement.style.setProperty(
        '--sidebar-width',
        isHovered ? '18rem' : '5rem' // Corresponds to w-72 and w-20
      );
    }
  }, [isHovered]);

  const [avatar, setAvatar] = useState(user?.avatar || null);

  useEffect(() => {
    setAvatar(user?.avatar || null);
  }, [user]);

  const handleAvatarClick = () => {
    if (!user) {
      toast.info("Please sign in to manage your profile");
      navigate("/login");
      return;
    }
    navigate("/settings");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      updateUser({ avatar: reader.result });
    };
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
    { title: "Home", icon: Home, path: "/home", action: () => isHomePage && smoothScrollToTop() },
    { title: "Shop Now", icon: ShoppingBag, path: "/shop" },
    { title: "About Us", icon: Info, path: "/about", action: () => isHomePage && scrollToSection?.(aboutRef) },
    { title: "Contact Us", icon: Phone, path: "/contact", action: () => isHomePage && scrollToSection?.(contactRef) },
    { title: "FAQ", icon: Info, path: "/faq", gap: true },
    { title: "Orders", icon: ShoppingBag, path: "/orders" },
    { title: "Blog", icon: BookOpen, path: "/blog", gap: true },
    { title: "Feedback", icon: MessageSquare, path: "/feedback" },
    { title: "Settings", icon: Settings, path: "/settings" },
  ];

  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          ${isHovered || sidebarOpen ? 'w-72' : 'w-20'}
          bg-white dark:bg-gray-900 shadow-lg`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          {/* Avatar + Fullname */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <img
                src={avatar || defaultAvatar}
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover cursor-pointer"
                onClick={handleAvatarClick}
              />
              <span
                className={`text-lg font-semibold text-gray-800 dark:text-gray-200 ${(isHovered || sidebarOpen) ? "block" : "hidden"}`}
              >
                {user?.username || user?.fullName || user?.email || "Guest User"}
              </span>
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                to="/checkout"
                onClick={() => setSidebarOpen(false)}
                className="relative p-2 rounded-full text-gray-700 hover:text-pink-600 dark:text-gray-300 dark:hover:text-pink-400"
                aria-label="Shopping Cart"
              >
                <ShoppingCart size={24} />
                {totalQuantity > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                    {totalQuantity}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className={`p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
            <ul className="space-y-1">
              {Menus.map((menu, idx) => {
                const IconComponent = menu.icon;
                const handleClick = () => {
                  menu.action?.();
                  setSidebarOpen(false);
                };

                return isHomePage && menu.action ? (
                  <li key={idx} className={menu.mobileOnly ? 'lg:hidden' : ''}>
                    <button
                      onClick={handleClick}
                      className={`flex items-center w-full text-left px-4 py-3 text-sm font-medium rounded-md transition-colors ${menu.gap ? "mt-4" : ""} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 ${sidebarOpen || isHovered ? "px-4" : "px-2 justify-center"}`}
                    >
                      <div className="relative">
                        <IconComponent className="w-6 h-6" />
                        {menu.badge > 0 && (
                          <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                            {menu.badge}
                          </span>
                        )}
                      </div>
                      <span className={`ml-3 ${!sidebarOpen && !isHovered ? "hidden" : "block"}`}>
                        {menu.title}
                      </span>
                    </button>
                  </li>
                ) : (
                  <li key={idx} className={menu.mobileOnly ? 'lg:hidden' : ''}>
                    <Link
                      to={menu.path}
                      onClick={handleClick}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${location.pathname === menu.path ? "bg-pink-50 text-pink-600 dark:bg-gray-800 dark:text-pink-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"} ${menu.gap ? "mt-4" : ""} ${sidebarOpen || isHovered ? "px-4" : "px-2 justify-center"}`}
                    >
                      <div className="relative">
                        <IconComponent className="w-6 h-6" />
                        {menu.badge > 0 && (
                          <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                            {menu.badge}
                          </span>
                        )}
                      </div>
                      <span className={`ml-3 ${!sidebarOpen && !isHovered ? "hidden" : "block"}`}>
                        {menu.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Dark Mode */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleDarkMode}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {darkMode ? (
                <>
                  <Sun className="w-5 h-5" />
                  <span className={`ml-3 ${!sidebarOpen && !isHovered ? "hidden" : "block"}`}>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  <span className={`ml-3 ${!sidebarOpen && !isHovered ? "hidden" : "block"}`}>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Spacer for desktop view to push content */}
      <div
        className={`hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out ${
          isHovered ? 'w-72' : 'w-20'
        }`}
      ></div>
    </>
  );
}
