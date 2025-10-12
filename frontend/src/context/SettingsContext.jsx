import { createContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_SETTINGS } from '../constants/settings';
import { loadSettingsFromLocalStorage, saveSettingsToLocalStorage } from '../utils/settingsUtils';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
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
