// Utility functions for dark mode

// Get initial dark mode state from localStorage
export const getInitialDarkMode = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  }
  return false;
};

// Apply dark mode to the document and save to localStorage
export const applyDarkMode = (darkMode) => {
  if (typeof window !== 'undefined') {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }
};
