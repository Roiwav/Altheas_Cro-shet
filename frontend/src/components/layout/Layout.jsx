import React, { useState, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine if the current page is an authentication page
  const isAuthPage = ["/login", "/signup"].includes(location.pathname);

  // Refs for homepage sections (will only be used on the homepage)
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} scrollToSection={scrollToSection} aboutRef={aboutRef} contactRef={contactRef} />
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isAuthPage={isAuthPage} />
      <Outlet context={{ aboutRef, contactRef }} />
    </div>
  );
}