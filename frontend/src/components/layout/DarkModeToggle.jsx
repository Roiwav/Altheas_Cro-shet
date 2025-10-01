// src/components/layout/DarkModeToggle.jsx
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext.jsx';
import { useUser } from '../../context/useUser.js';

export default function DarkModeToggle({ sidebarOpen }) {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { isAuthenticated } = useUser();

  // Don't render the floating toggle if the user is logged in OR if the mobile sidebar is open
  if (isAuthenticated || sidebarOpen) {
    return null;
  }
  
  return (
    <button
      onClick={toggleDarkMode}
      className="fixed z-50 hidden p-3 transition-colors bg-white rounded-full shadow-lg bottom-4 left-4 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 lg:block"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <Sun className="w-6 h-6 text-yellow-400" />
      ) : (
        <Moon className="w-6 h-6 text-gray-700" />
      )}
    </button>
  );
}