import React, { createContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_SETTINGS } from '../constants/settings';
import { loadSettingsFromLocalStorage, saveSettingsToLocalStorage } from '../utils/settingsUtils';

// eslint-disable-next-line react-refresh/only-export-components
export const SettingsContext = createContext();

const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load settings from localStorage on initial load
  useEffect(() => {
    const savedSettings = loadSettingsFromLocalStorage();
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, []);

  // Save settings to localStorage whenever they change
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

export default SettingsProvider;
