// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/useUser";
import { useDarkMode } from "../../context/DarkModeContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { ShoppingCart, User, Menu, X, Moon, Sun } from "lucide-react";

export default function Navbar({
  sidebarOpen,
  setSidebarOpen = () => {},
  isAuthPage = false,
}) {
  const { user, isAuthenticated, logout, isAuthenticating } = useUser();
  const { darkMode, toggleDarkMode } = useDarkMode();

  // ✅ Only call useCart once
  const { cartItems, clearCart, saveCartForUser } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Calculate total quantity in cart
  const totalQuantity = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + item.qty, 0)
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
    try {
      // save current cart to server for this user before logging out
      const uid = user?._id || user?.id;
      if (uid) {
        await saveCartForUser(uid);
      }
    } catch (err) {
      console.error("Failed saving cart on logout:", err);
    }

    logout();    // clear auth session
    clearCart(); // clear local cart (localStorage)
    setIsOpen(false);
    navigate("/");
  };

  const navLinks = [
    { name: "Home", path: "/home" },
    { name: "Shop", path: "/shop" },
    { name: "Gallery", path: "/gallery" },
    { name: "FAQ", path: "/faq" },
  ];

  return (
    <header
      className={`fixed top-0 right-0 z-40 transition-all duration-300 left-0 lg:left-[var(--sidebar-width,5rem)] ${
        scrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left & Center Group */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div
              className="lg:hidden mr-4"
            >
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 focus:outline-none"
              >
                <Menu size={24} />
              </button>
            </div>
            {/* Logo - Adjust padding to account for sidebar */}
            <div
              className={`flex-shrink-0 ${sidebarOpen ? "hidden lg:block" : "block"}`}
            >
              <Link to="/" className="flex items-center">
                <span className="text-xl sm:text-2xl font-bold text-pink-600 dark:text-pink-400">
                  Althea Cro-shet
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
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

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            {!isAuthPage && (
              <Link
                to="/checkout"
                className="relative p-2 rounded-full text-gray-700 hover:text-pink-600 dark:text-gray-300 dark:hover:text-pink-400 hidden lg:inline-flex"
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
                  className="flex items-center space-x-1 p-2 rounded-full text-gray-700 hover:text-pink-600 dark:text-gray-300 dark:hover:text-pink-400 focus:outline-none"
                  aria-label="User menu"
                >
                  <User size={20} />
                  <span className="hidden md:inline">
                    {user?.name || "Account"}
                  </span>
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/dashboard"
                      className="block text-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : !isAuthPage && (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-pink-600 hover:text-white hover:bg-pink-600 dark:text-pink-400 dark:hover:bg-pink-700 rounded-md transition-colors border border-pink-600 dark:border-pink-400"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="hidden sm:inline-block px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
