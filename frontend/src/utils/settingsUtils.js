// Save settings to localStorage
export const saveSettingsToLocalStorage = (settings) => {
  localStorage.setItem('adminSettings', JSON.stringify(settings));
};

// Load settings from localStorage
export const loadSettingsFromLocalStorage = () => {
  const savedSettings = localStorage.getItem('adminSettings');
  return savedSettings ? JSON.parse(savedSettings) : null;
};
