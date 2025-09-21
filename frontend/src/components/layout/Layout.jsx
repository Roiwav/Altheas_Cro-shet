import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState, useRef, useEffect } from "react";
import { useDarkMode } from "../../context/DarkModeContext.jsx";

function Layout() {
  const [isOpen, setIsOpen] = useState(true);
  const { darkMode } = useDarkMode();

  // Create dummy refs for scrollToSection (optional if not needed)
  const homeRef = useRef(null);
  const productsRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Adjust sidebar open state based on screen width (responsive behavior)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false); // Hide sidebar on smaller screens by default
      } else {
        setIsOpen(true); // Show sidebar on larger screens
      }
    };

    handleResize(); // Initialize on load
    window.addEventListener("resize", handleResize); // Listen for resize events

    return () => {
      window.removeEventListener("resize", handleResize); // Clean up event listener
    };
  }, []);

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        scrollToSection={scrollToSection}
        refs={{ homeRef, productsRef, aboutRef, contactRef }}
      />
      <main className={`flex-1 bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300 ${isOpen ? 'ml-72' : 'ml-20'}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
