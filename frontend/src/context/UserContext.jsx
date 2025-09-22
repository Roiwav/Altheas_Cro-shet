// src/context/UserContext.jsx
import React, { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext();

/**
 * Provider responsibility:
 * - restore from localStorage (or sessionStorage)
 * - login(userObj, token, remember = true)
 * - logout()
 * - updateUser()
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

  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(false); // set to false because we restore synchronously

  // login(userObject, token, remember = true)
  const login = (userObj, authToken, remember = true) => {
    setUser(userObj);
    setToken(authToken);

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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    toast.success("Logged out");
    navigate("/login");
    // Force a full page reload to clearly show the reload and fully reset state
    setTimeout(() => {
      window.location.reload();
    }, 0);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...updatedFields };
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
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
