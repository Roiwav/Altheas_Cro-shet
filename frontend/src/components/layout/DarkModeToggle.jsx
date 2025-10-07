// src/components/layout/DarkModeToggle.jsx
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext.jsx';
import { useUser } from '../../context/useUser.js';

export default function DarkModeToggle({ sidebarOpen }) {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { isAuthenticated } = useUser();

  // This component is no longer needed as the toggle is now integrated into the sidebar.
  return null;
}