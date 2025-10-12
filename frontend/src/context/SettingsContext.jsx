import { createContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_SETTINGS } from '../constants/settings';
import { loadSettingsFromLocalStorage, saveSettingsToLocalStorage } from '../utils/settingsUtils';

// Create the context with a default value.
export const SettingsContext = createContext();

/**
 * Provides application-wide settings to its children components.
 * It handles loading settings from and saving settings to localStorage.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render.
 */
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  /**
   * Effect to load settings from localStorage on initial component mount.
   */
  useEffect(() => {
    const savedSettings = loadSettingsFromLocalStorage();
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, []);

  /**
   * A memoized function to update the settings state and persist it to localStorage.
   */
  const updateSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    saveSettingsToLocalStorage(newSettings);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
