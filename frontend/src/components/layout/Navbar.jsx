// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/useUser";
import { useCart } from "../../context/CartContext.jsx";
import { ShoppingCart, User, Menu, LayoutDashboard, LogOut } from "lucide-react";

export default function Navbar({
  sidebarOpen,
  setSidebarOpen = () => {},
  isAuthPage = false,
}) {
  const { user, isAuthenticated, logout, isAuthenticating } = useUser();
  
  // Get cart items for the cart icon counter
  const { cartItems } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
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
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
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
                  Althea Cro-shet
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
            {/* Cart */}
            {!isAuthPage && (
              <Link
                to="/checkout"
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
                  className="hidden sm:inline-block px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors shadow-md hover:shadow-lg"                >
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
