import { useContext, useState, useEffect } from 'react';
import { DarkModeContext } from './DarkModeContext';
import { getInitialDarkMode, applyDarkMode } from './darkModeUtils';

// Custom hook to use dark mode
// eslint-disable-next-line react-refresh/only-export-components
export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

// Dark Mode Provider Component
export const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  // Apply dark mode to document and save to localStorage
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

