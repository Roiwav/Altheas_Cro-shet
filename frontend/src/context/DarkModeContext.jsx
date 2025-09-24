import React, { createContext, useContext, useState, useEffect } from 'react';
import { applyDarkMode } from './darkModeUtils';

// Create the context
export const DarkModeContext = createContext(null);

// Custom hook to easily consume the dark mode context
export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};
 
// Dark Mode Provider Component
export const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const storedPreference = localStorage.getItem('darkMode');
    // If a preference is stored, use it.
    if (storedPreference !== null) {
      return JSON.parse(storedPreference);
    }
    // Otherwise, default to dark mode.
    return true;
  });

  // Apply dark mode class to the document and save preference to localStorage
  useEffect(() => {
    applyDarkMode(darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => { 
    setDarkMode(prev => !prev);
  };

  const value = {
    isDarkMode: darkMode,
    setDarkMode,
    toggleDarkMode
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};
