import React, { useState, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

/**
 * The main layout component for the application.
 * It orchestrates the display of the Sidebar, Navbar, and Footer around the main content (`Outlet`).
 * It also manages the state for the mobile sidebar and smooth scrolling to homepage sections.
 * @param {object} props - The component props.
 * @param {boolean} props.sidebarOpen - State for mobile sidebar visibility.
 * @param {function} props.setSidebarOpen - Function to update the mobile sidebar state.
 */
export default function Layout({ sidebarOpen, setSidebarOpen }) {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const location = useLocation();

  // Determine if the current page is an authentication page
  const isAuthPage = ["/login", "/signup"].includes(location.pathname);

  // Refs for homepage sections (will only be used on the homepage)
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  /**
   * Scrolls smoothly to a given ref, used for homepage section navigation.
   * @param {React.RefObject} ref - The ref of the section to scroll to.
   */
  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isHovered={isSidebarHovered}
        setIsHovered={setIsSidebarHovered}
        scrollToSection={scrollToSection}
        aboutRef={aboutRef}
        contactRef={contactRef}
      />
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isAuthPage={isAuthPage} />
      <main className="flex-grow">
        <Outlet context={{ aboutRef, contactRef, isSidebarHovered }} />
      </main>
      <Footer />
    </div>
  );
}