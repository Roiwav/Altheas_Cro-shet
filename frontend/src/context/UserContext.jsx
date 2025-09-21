// src/context/UserContext.jsx
import React, { useState, useEffect, createContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5001/api/auth";

// ✅ Create the context here
// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext();

// ✅ Provider component that wraps your app
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/user`, {
        headers: {
          "x-auth-token": token,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const storedUser = JSON.parse(savedUser);
        setUser({
          ...storedUser,
          ...userData,
          token,
        });
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    const { token, ...userInfo } = userData;
    setUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userInfo));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
    toast.success("Successfully logged out");
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({
      ...prev,
      ...updatedData,
    }));
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: loading,
        login,
        logout,
        updateUser,
      }}
    >
      {!loading && children}
    </UserContext.Provider>
  );
};
