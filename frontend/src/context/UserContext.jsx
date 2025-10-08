// src/context/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { applyDarkMode } from "./darkModeUtils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";
axios.defaults.baseURL = API_URL;

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInitializedRef = useRef(false);
  const idleTimerRef = useRef(null);

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Manual JWT decode function
  const decodeJWT = useCallback((token) => {
    try {
      if (!token || typeof token !== 'string') return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      if (!payload) return null;
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      return JSON.parse(atob(paddedPayload));
    } catch (error) {
      console.error('JWT decode error:', error, { token });
      return null;
    }
  }, []);

  // JWT expiration check
  const isTokenExpired = useCallback((token, skipBuffer = false) => {
    if (!token) return true;
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    const currentTime = Date.now() / 1000;
    const buffer = skipBuffer ? 0 : 30;
    return decoded.exp < (currentTime + buffer);
  }, [decodeJWT]);

  const clearAuthData = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userAddresses");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
  }, []);

  const logout = useCallback(async (persistCartFn) => {
    setIsLoading(true);
    try {
      if (typeof persistCartFn === 'function') await persistCartFn();
      clearAuthData();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      clearAuthData();
      navigate("/login", { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, clearAuthData]);

  // ===== AUTO-LOGOUT ONLY IN ADMIN PAGE =====
  useEffect(() => {
    const IDLE_TIMEOUT = 60 * 60 * 1000;

    // Only enable auto-logout for `/admin` route
    if (!user || !token || location.pathname !== "/admin") return;

    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        toast.info("You’ve been logged out due to inactivity on the admin page.");
        logout();
      }, IDLE_TIMEOUT);
    };

    resetIdleTimer();

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    for (const event of events) {
      window.addEventListener(event, resetIdleTimer);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      for (const event of events) {
        window.removeEventListener(event, resetIdleTimer);
      }
    };
  }, [user, token, logout, location.pathname]);

  // fetchUserData
  const fetchUserData = useCallback(async (userToken = token) => {
    if (!userToken) {
      clearAuthData();
      setIsLoading(false);
      return null;
    }
    if (isTokenExpired(userToken, false)) {
      clearAuthData();
      setIsLoading(false);
      return null;
    }
    setIsLoading(true);
    try {
      const response = await axios.get('/auth/me', {
        headers: { 'Authorization': `Bearer ${userToken}` },
        timeout: 10000,
      });
      if (response.data) {
        const userData = response.data;
        if (userData.addresses) {
          userData.addresses = userData.addresses.map(addr => ({
            ...addr,
            id: addr._id || addr.id || crypto.randomUUID()
          }));
        }
        if (typeof userData?.preferences?.darkMode === 'boolean') {
          applyDarkMode(userData.preferences.darkMode);
        }
        setUser(userData);
        setIsAuthenticated(true);
        const userDataString = JSON.stringify(userData);
        if (localStorage.getItem("token")) {
          localStorage.setItem("user", userDataString);
        } else if (sessionStorage.getItem("token")) {
          sessionStorage.setItem("user", userDataString);
        }
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        await logout();
      } else if (error.code === 'ECONNABORTED') {
        toast.error("Request timed out. Please try again.");
      } else if (error.code === 'ECONNREFUSED') {
        toast.error("Cannot connect to server. Please check if the backend is running.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token, logout, clearAuthData, isTokenExpired]);

  // Auth state from storage on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (!storedToken) {
          setIsLoading(false);
          return;
        }
        if (isTokenExpired(storedToken, false)) {
          clearAuthData();
          setIsLoading(false);
          return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setToken(storedToken);
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            if (typeof userData?.preferences?.darkMode === 'boolean') {
              applyDarkMode(userData.preferences.darkMode);
            }
          } catch (parseError) {
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");
          }
        }
        await fetchUserData(storedToken);
      } catch (error) {
        clearAuthData();
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, [fetchUserData, clearAuthData, isTokenExpired]);

  // Axios interceptor for 401 errors
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && token && !originalRequest._retry) {
          originalRequest._retry = true;
          await logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token, logout]);

  // login function (supports JWT and dummy tokens)
  const login = useCallback((userObj, authToken, options = { remember: true, isOAuth: false }) => {
    const { remember = true, isOAuth = false } = options;
    try {
      if (!authToken) throw new Error('No authentication token provided');
      if (!userObj) throw new Error('No user data provided');

      let tokenValidationPassed = false;
      if (authToken === 'dummy-admin-token' || authToken.startsWith('dummy-')) {
        tokenValidationPassed = true;
      } else if (typeof authToken === 'string' && authToken.includes('.')) {
        const isExpired = isTokenExpired(authToken, true);
        tokenValidationPassed = true; // Allow expired tokens for debugging
      } else {
        tokenValidationPassed = true;
      }

      let processedUser = userObj;

      if (isOAuth) {
        processedUser = {
          ...userObj,
          role: userObj.role || 'user',
          isOAuth: true
        };
      } else if (userObj.addresses) {
        processedUser = {
          ...userObj,
          addresses: userObj.addresses.map(addr => ({
            ...addr,
            id: addr._id || addr.id || crypto.randomUUID()
          }))
        };
      }
      if (typeof processedUser?.preferences?.darkMode === 'boolean') {
        applyDarkMode(processedUser.preferences.darkMode);
      }
      if (authToken !== 'dummy-admin-token' && !authToken.startsWith('dummy-')) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      }
      setUser(processedUser);
      setToken(authToken);
      setIsAuthenticated(true);

      const userDataString = JSON.stringify(processedUser);
      if (remember) {
        localStorage.setItem("user", userDataString);
        localStorage.setItem("token", authToken);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      } else {
        sessionStorage.setItem("user", userDataString);
        sessionStorage.setItem("token", authToken);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
      localStorage.removeItem("userAddresses");

      // Only show toast for admin or OAuth login
      if (
        authToken === 'dummy-admin-token' ||
        (options && options.isOAuth)
      ) {
        toast.success("Login successful!");
      }
      return processedUser;
    } catch (error) {
      clearAuthData();
      let errorMessage = "Login failed. Please try again.";
      if (error.message.includes('No authentication token')) {
        errorMessage = "Authentication failed - no token received from server.";
      } else if (error.message.includes('No user data')) {
        errorMessage = "Authentication failed - no user data received from server.";
      } else if (error.message.includes('expired')) {
        errorMessage = "Authentication token has expired. Please try logging in again.";
      }
      toast.error(errorMessage);
      throw error;
    }
  }, [isTokenExpired, clearAuthData]);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      if (updated.addresses) {
        updated.addresses = updated.addresses.map(addr => ({
          ...addr,
          id: addr._id || addr.id || crypto.randomUUID()
        }));
      }
      if (typeof updated?.preferences?.darkMode === 'boolean') {
        applyDarkMode(updated.preferences.darkMode);
      }
      const updatedUserString = JSON.stringify(updated);
      if (localStorage.getItem("token")) {
        localStorage.setItem("user", updatedUserString);
      } else if (sessionStorage.getItem("token")) {
        sessionStorage.setItem("user", updatedUserString);
      }
      return updated;
    });
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
        fetchUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
