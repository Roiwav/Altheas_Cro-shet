import React from 'react';
import { useUser } from '../../context/useUser';
import { LogOut, Search, Menu, Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext.jsx';

const AdminNavbar = ({ showSearch, searchQuery, setSearchQuery, setSidebarOpen }) => {
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
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">

          {/* Search Bar */}
          {showSearch && (
            <div className="w-full flex md:ml-0">
              <label htmlFor="search-field" className="sr-only">Search</label>
              <div className={`relative w-full ${isDarkMode ? 'text-gray-400 focus-within:text-gray-300' : 'text-gray-400 focus-within:text-gray-600'}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5" />
              </div>
              <input
                id="search-field"
                type="text"
                placeholder="Search by Order ID, Customer, or Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`block w-full h-full pl-10 pr-3 py-2 border-transparent placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'text-gray-900'}`}
              />
              </div>
            </div>
          )}
        </div>
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