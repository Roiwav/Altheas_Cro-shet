// Hook for consuming the DarkModeContext. Kept separate to satisfy Fast Refresh rules.
import { useContext } from 'react';
import { DarkModeContext } from './darkModeContextCore';

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};
