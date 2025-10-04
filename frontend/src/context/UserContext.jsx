// src/context/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext();

/**
 * Provider responsibility:
 * - restore from localStorage (or sessionStorage) and sync with database
 * - login(userObj, token, remember = true)
 * - logout()
 * - updateUser()
 * - fetchUserData() - NEW: fetch fresh data from database
 */
export const UserProvider = ({ children }) => {
  const navigate = useNavigate();

  // Try to initialize from localStorage or sessionStorage synchronously
  const initialLocalUser = localStorage.getItem("user");
  const initialLocalToken = localStorage.getItem("token");
  const initialSessionUser = sessionStorage.getItem("user");
  const initialSessionToken = sessionStorage.getItem("token");

  const [user, setUser] = useState(() => {
    if (initialLocalUser) return JSON.parse(initialLocalUser);
    if (initialSessionUser) return JSON.parse(initialSessionUser);
    return null;
  });

  const [token, setToken] = useState(() => {
    if (initialLocalToken) return initialLocalToken;
    if (initialSessionToken) return initialSessionToken;
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // NEW: Function to fetch fresh user data from database
  const fetchUserData = useCallback(async (userToken = token) => {
    if (!userToken) return null;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/v1/auth/me', {
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
  }, [token]);

  // NEW: Auto-fetch user data from database when app starts with existing token
  useEffect(() => {
    const hasToken = token && (localStorage.getItem("token") || sessionStorage.getItem("token"));
    
    if (hasToken && user) {
      // We have both token and user from storage, but let's verify with database
      // This ensures we have the latest user data including addresses
      fetchUserData(token);
    }
  }, []); // Only run once on mount

  // Enhanced login function
  const login = (userObj, authToken, remember = true) => {
    // Ensure addresses have proper IDs
    if (userObj.addresses) {
      userObj.addresses = userObj.addresses.map(addr => ({
        ...addr,
        id: addr._id || addr.id || crypto.randomUUID()
      }));
    }

    setUser(userObj);
    setToken(authToken);

    // Clear any conflicting address data from old localStorage
    localStorage.removeItem("userAddresses");

    // store in localStorage (persistent) if remember === true
    if (remember) {
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("token", authToken);
      // remove any sessionStorage copy
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    } else {
      // store in sessionStorage only (cleared when tab closes)
      sessionStorage.setItem("user", JSON.stringify(userObj));
      sessionStorage.setItem("token", authToken);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  const logout = async (persistCartFn) => {
    // If a function to persist the cart is provided, call it and wait for it to complete.
    if (typeof persistCartFn === 'function') {
      console.log("UserContext: Calling function to persist cart before logging out.");
      await persistCartFn();
    }

    setUser(null);
    setToken(null);
    
    // Clear ALL user-related data from storage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userAddresses"); // Clear any old address data
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");

    toast.success("Logged out");
    navigate("/login", { replace: true });
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
        isAuthenticated: !!user,
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