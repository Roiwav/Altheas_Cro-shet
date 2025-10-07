import React, { useState, useEffect } from 'react';
import { applyDarkMode, getInitialDarkMode } from './darkModeUtils';
import { DarkModeContext } from './darkModeContextCore';

// Dark Mode Provider Component (export only components from this file)
const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => getInitialDarkMode());

  // Apply dark mode class to the document and save preference to localStorage
  useEffect(() => {
    applyDarkMode(darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => { 
    setDarkMode(prev => !prev);
  };

  const value = {
    darkMode,
    setDarkMode,
    toggleDarkMode
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

export default DarkModeProvider;
