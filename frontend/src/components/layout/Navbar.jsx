// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/useUser";
import { useCart } from "../../hooks/useCart";
import useNotifications from "../../hooks/useNotifications";
import { ShoppingCart, User, Menu, LayoutDashboard, LogOut, Bell } from "lucide-react";

export default function Navbar({
  sidebarOpen,
  setSidebarOpen = () => {},
  isAuthPage = false,
}) {
  const { user, isAuthenticated, logout, isAuthenticating } = useUser();
  
  // Get cart items for the cart icon counter
  const { cartItems } = useCart();
  // Notifications
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Calculate total quantity in cart
  const totalQuantity = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    // The cart persists on the backend, so we just need to log out
    // and clear the local state.
    logout();    // from useUser: clears auth session
    setIsOpen(false);
    navigate("/");
  };

  const navLinks = !isAuthenticated ? [
    { name: "Home", path: "/home" },
    { name: "About Us", path: "/about" },
    { name: "Contact Us", path: "/contact" },
  ] : [];

  return (
    <header
      className={`fixed top-0 right-0 z-40 transition-all duration-300 left-0 ${
        isAuthenticated ? 'lg:left-[var(--sidebar-width,5rem)]' : ''
      } ${
        scrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left & Center Group */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div
              className="mr-4 lg:hidden"
            >
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-700 rounded-md dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 focus:outline-none"
              >
                <Menu size={24} />
              </button>
            </div>
            {/* Logo - Adjust padding to account for sidebar */}
            <div
              className={`flex-shrink-0 ${sidebarOpen ? "hidden lg:block" : "block"}`}
            >
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-pink-600 sm:text-2xl dark:text-pink-400">
                  Althea's Cro-shet
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation - Show only when not authenticated */}
          {!isAuthenticated && (
            <nav className="items-center hidden space-x-8 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 text-sm font-medium ${
                    location.pathname === link.path
                      ? "text-pink-600 dark:text-pink-400"
                      : "text-gray-700 hover:text-pink-600 dark:text-gray-300 dark:hover:text-pink-400"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          )}
          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {isAuthenticated && !isAuthPage && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen((v) => !v)}
                  className="relative inline-flex p-2 text-gray-700 rounded-full hover:text-pink-600 dark:text-gray-300 dark:hover:text-pink-400"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] bg-white rounded-md shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-pink-600 hover:underline">Mark all as read</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {(notifications || []).slice(0, 10).map((n) => (
                        <div key={n._id} className="px-3 py-2 flex items-start gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <div className={`mt-1 w-2 h-2 rounded-full ${n.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-pink-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{n.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{n.message}</p>
                            <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                          {!n.read && (
                            <button onClick={() => markAsRead(n._id)} className="text-xs text-pink-600 hover:underline">Read</button>
                          )}
                        </div>
                      ))}
                      {(!notifications || notifications.length === 0) && (
                        <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Cart */}
            {!isAuthPage && (
              <Link
                to="/cart"
                className="relative inline-flex p-2 text-gray-700 rounded-full hover:text-pink-600 dark:text-gray-300 dark:hover:text-pink-400"
                aria-label="Shopping Cart"
              >
                <ShoppingCart size={20} />
                {totalQuantity > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                    {totalQuantity}
                  </span>
                )}
              </Link>
            )}
            {/* User Menu */}
            {isAuthenticating ? null : isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center p-2 space-x-1 text-gray-700 rounded-full hover:text-pink-600 dark:text-gray-300 dark:hover:text-pink-400 focus:outline-none"
                  aria-label="User menu"
                >
                  <User size={20} />
                  <span className="hidden md:inline">
                    {user?.name || "Account"}
                  </span>
                </button>

                {isOpen && (
                  <div className="absolute right-0 z-50 w-48 py-1 mt-2 bg-white rounded-md shadow-lg dark:bg-gray-800">
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => setIsOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : !isAuthPage && (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors shadow-md hover:shadow-lg"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
