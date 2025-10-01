import React from 'react';
import { useUser } from '../../context/useUser';
import { useDarkMode } from '../../context/DarkModeContext.jsx';
import { LogOut, Menu, Sun, Moon } from 'lucide-react';

const AdminNavbar = ({ setSidebarOpen }) => {
  const { logout } = useUser();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  return (
    <header className={`relative z-10 flex-shrink-0 flex h-16 shadow-md border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <button
        type="button"
        className={`px-4 border-r text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500 md:hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 px-4 flex justify-end">
        <div className="ml-4 flex items-center md:ml-6">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4 ml-3">
            <button
              onClick={logout}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isDarkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-500 hover:bg-red-100'}`}
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;