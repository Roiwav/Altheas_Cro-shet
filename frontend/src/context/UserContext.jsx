// src/context/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";
axios.defaults.baseURL = API_URL;

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext();

/**
 * Provider responsibility:
 * - restore from localStorage (or sessionStorage) and sync with database
 * - login(userObj, token, remember = true)
 */
export const UserProvider = ({ children }) => {
  const navigate = useNavigate();

  // Try to initialize from localStorage or sessionStorage synchronously
  const initialLocalUser = localStorage.getItem("user");
  const initialLocalToken = localStorage.getItem("token");
  const initialSessionUser = sessionStorage.getItem("user");
  const initialSessionToken = sessionStorage.getItem("token");

  const [user, setUser] = useState(() => {
    try {
      if (initialLocalUser) return JSON.parse(initialLocalUser);
      if (initialSessionUser) return JSON.parse(initialSessionUser);
    } catch (error) {
      console.error('Error parsing user data from storage:', error);
      // Clear invalid user data
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    // If we have a token in localStorage or sessionStorage, use it
    if (initialLocalToken) {
      // Set auth header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${initialLocalToken}`;
      return initialLocalToken;
    }
    if (initialSessionToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${initialSessionToken}`;
      return initialSessionToken;
    }
    return null;
  });

  // Track authentication state
  const [, setIsAuthenticated] = useState(!!(token && user));

  // Update isAuthenticated when token or user changes
  useEffect(() => {
    setIsAuthenticated(!!(token && user));
  }, [token, user]);

  const [isLoading, setIsLoading] = useState(false);

  // First, define the logout function since it's used by fetchUserData
  const logout = useCallback(async (persistCartFn) => {
    // If a function to persist the cart is provided, call it and wait for it to complete.
    if (typeof persistCartFn === 'function') {
      console.log("UserContext: Calling function to persist cart before logging out.");
      await persistCartFn();
    }

    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear ALL user-related data from storage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userAddresses");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");

    toast.success("Logged out");
    navigate("/login", { replace: true });
  }, [navigate]);

  // Then define fetchUserData which uses logout
  const fetchUserData = useCallback(async (userToken = token) => {
    if (!userToken) return null;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Ensure addresses have proper IDs for frontend
        if (userData.addresses) {
          userData.addresses = userData.addresses.map(addr => ({
            ...addr,
            id: addr._id || addr.id || crypto.randomUUID()
          }));
        }

        // Update state
        setUser(userData);
        
        // Update storage with fresh data
        if (localStorage.getItem("token")) {
          localStorage.setItem("user", JSON.stringify(userData));
        } else if (sessionStorage.getItem("token")) {
          sessionStorage.setItem("user", JSON.stringify(userData));
        }
        
        return userData;
      } else if (response.status === 401) {
        // Token is invalid, clear everything
        console.log("Token expired, clearing user data");
        await logout();
        return null;
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Don't clear token on network errors, just on auth errors
      if (error.message.includes('401')) {
        await logout();
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]); // Add token and logout to dependencies

  // Auto-fetch user data once per token to avoid loops
  const fetchedTokenRef = useRef(null);
  useEffect(() => {
    if (!token) return;
    if (fetchedTokenRef.current === token) return;
    fetchedTokenRef.current = token;
    fetchUserData(token);
  }, [token, fetchUserData]);

  /**
   * Login function that handles both regular and OAuth logins
   * @param {Object} userObj - User object from the server
   * @param {string} authToken - JWT token from the server
   * @param {Object} options - Additional options
   * @param {boolean} [options.remember=true] - Whether to remember the user
   * @param {boolean} [options.isOAuth=false] - Whether this is an OAuth login
   */
  const login = (userObj, authToken, options = { remember: true, isOAuth: false }) => {
    const { remember = true, isOAuth = false } = options;
    
    try {
      let processedUser = userObj;
      
      // For OAuth logins, ensure we have all required fields
      if (isOAuth) {
        processedUser = {
          ...userObj,
          role: userObj.role || 'user',
          isOAuth: true // Mark as OAuth user
        };
      } else if (userObj.addresses) {
        // Process addresses for regular login
        processedUser = {
          ...userObj,
          addresses: userObj.addresses.map(addr => ({
            ...addr,
            id: addr._id || addr.id || crypto.randomUUID()
          }))
        };
      }
      
      // Set auth header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      // Update state
      setUser(processedUser);
      setToken(authToken);
      setIsAuthenticated(true);
      
      // Clear any conflicting address data from old localStorage
      localStorage.removeItem("userAddresses");
      
      // Store in localStorage (persistent) if remember is true
      if (remember) {
        localStorage.setItem("user", JSON.stringify(processedUser));
        localStorage.setItem("token", authToken);
        // Clear session storage to avoid conflicts
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      } else {
        // store in sessionStorage only (cleared when tab closes)
        sessionStorage.setItem("user", JSON.stringify(processedUser));
        sessionStorage.setItem("token", authToken);
        // Clear local storage to avoid conflicts
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
      
      return processedUser;
    } catch (error) {
      console.error('Error during login:', error);
      // Clear any potentially corrupted auth state
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      throw error; // Re-throw to allow error handling in the component
    }
  };

  // Enhanced updateUser function
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...updatedFields };
      
      // Ensure addresses have proper IDs when updating
      if (updated.addresses) {
        updated.addresses = updated.addresses.map(addr => ({
          ...addr,
          id: addr._id || addr.id || crypto.randomUUID()
        }));
      }
      
      // Persist updated user wherever it was stored
      if (localStorage.getItem("token")) {
        localStorage.setItem("user", JSON.stringify(updated));
      } else if (sessionStorage.getItem("token")) {
        sessionStorage.setItem("user", JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!(user && token),
        isLoading,
        login,
        logout,
        updateUser,
        fetchUserData, // NEW: Expose fetchUserData function
      }}
    >
      {children}
    </UserContext.Provider>
  );
};