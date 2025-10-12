import React from 'react';
import logoSrc from '../../assets/images/icons/logo althea.jpg';
import { useUser } from '../../context/useUser';
import { useDarkMode } from '../../context/useDarkMode.js';
import { LogOut, Sun, Moon } from 'lucide-react';

/**
 * Renders the sidebar navigation for the admin dashboard.
 * It can be collapsed or expanded and supports dark mode.
 * @param {object} props - The component props.
 * @param {boolean} props.isDarkMode - Flag to indicate if dark mode is enabled.
 * @param {Array<object>} props.tabs - An array of tab objects to be rendered as navigation items. Each object should have an `id`, `label`, and `icon`.
 * @param {string} props.activeTab - The ID of the currently active tab.
 * @param {function} props.setActiveTab - Function to set the active tab.
 * @param {boolean} props.isSidebarCollapsed - Flag indicating if the sidebar is in its collapsed state (icon-only view).
 * @param {boolean} props.sidebarOpen - Flag indicating if the sidebar is open (used for mobile view).
 */
const AdminSidebar = ({
  isDarkMode,
  tabs,
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  sidebarOpen,
}) => {
  const { logout } = useUser();
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Sidebar Header */}
      <div className="flex items-center flex-shrink-0 h-16 px-4 space-x-2">
        <img
          className="w-auto h-8"
          src={logoSrc}
          alt="Althea's Cro-shet Logo"
        />
        {(!isSidebarCollapsed || sidebarOpen) && (
          <span className={`text-lg font-bold whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Althea's Cro-shet
          </span>
        )}
      </div>
      {/* Main Navigation */}
      <div className={`flex-1 flex flex-col overflow-y-auto border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            // Determine text color classes for icon and label
            const textColorClasses = activeTab === tab.id
                ? isDarkMode ? 'text-pink-400' : 'text-pink-700'
                : isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900';

            return (
              <div key={tab.id} className="relative group">
                <button
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isSidebarCollapsed && !sidebarOpen ? 'justify-center' : ''
                  } ${
                    activeTab === tab.id
                      ? isDarkMode ? 'bg-gray-900' : 'bg-pink-100' // Background color only
                      : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50' // Background color only
                  }`}
                  title={isSidebarCollapsed ? tab.label : ''}
                >
                  <Icon className={`h-5 w-5 ${textColorClasses} ${isSidebarCollapsed && !sidebarOpen ? '' : 'mr-3'}`} aria-hidden="true" />
                  {(!isSidebarCollapsed || sidebarOpen) && <span className={textColorClasses}>{tab.label}</span>}
                </button>
              </div>
            );
          })}
        </nav>
      </div>
      {/* Sidebar footer with controls */}
      <div className={`p-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`flex items-center space-x-2 ${isSidebarCollapsed && !sidebarOpen ? 'flex-col space-y-2' : 'flex-row'}`}>
          <button
            onClick={toggleDarkMode}
            className={`flex-1 flex items-center justify-center p-2.5 rounded-lg transition-colors text-sm font-medium ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`}
            aria-label="Toggle dark mode"
            title={isSidebarCollapsed ? 'Toggle dark mode' : ''}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {(!isSidebarCollapsed || sidebarOpen) && <span className="ml-3">Theme</span>}
          </button>
          <button
            onClick={logout}
            className={`flex-1 flex items-center justify-center p-2.5 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-500 hover:bg-red-100'}`}
            aria-label="Sign out"
            title={isSidebarCollapsed ? 'Sign out' : ''}
          >
            <LogOut className="w-5 h-5" />
            {(!isSidebarCollapsed || sidebarOpen) && <span className="ml-3">Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;