// Utility functions for dark mode

// Get initial dark mode state from localStorage
export const getInitialDarkMode = () => {
  if (typeof window !== 'undefined') {
    try {
      // Prefer account preference if a user is stored
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (typeof parsed?.preferences?.darkMode === 'boolean') {
          return parsed.preferences.darkMode;
        }
        // Fallback to per-user key if preference isn't present in stored user
        const uid = parsed?.id || parsed?._id;
        if (uid) {
          const userKey = localStorage.getItem(`darkMode_user_${uid}`);
          if (userKey !== null) return JSON.parse(userKey);
        }
      }
    } catch {
      // If user JSON is corrupted, ignore and fallback
      console.warn('Failed to parse stored user for dark mode');
    }

    // Guest fallback
    const savedGuest = localStorage.getItem('darkMode_guest');
    if (savedGuest !== null) return JSON.parse(savedGuest);
    // Default to dark mode if nothing is set
    return true;
  }
  return true;
};

// Apply dark mode to the document and save to localStorage
export const applyDarkMode = (darkMode) => {
  if (typeof window !== 'undefined') {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const uid = parsed?.id || parsed?._id;
        if (uid) {
          localStorage.setItem(`darkMode_user_${uid}`, JSON.stringify(darkMode));
          return;
        }
      }
    } catch {
      // ignore parsing errors and fallback to guest key
    }
    // Guest fallback
    localStorage.setItem('darkMode_guest', JSON.stringify(darkMode));
  }
};
