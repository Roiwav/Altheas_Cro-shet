import React from "react";
import { ToastContainer } from "react-toastify";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { TestimonialsProvider } from "./context/TestimonialsContext.jsx"; 
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import DarkModeProvider from "./context/DarkModeContext.jsx";
import { useDarkMode } from "./context/useDarkMode.js";
import { WishlistCountProvider } from "./context/WishlistCountContext.jsx";

// ✅ Get initial user from sessionStorage to support multi-tab sessions
const initialUser = JSON.parse(sessionStorage.getItem("user")) || null;

// Toast Container with dynamic theme
function DynamicToastContainer() {
  const { darkMode } = useDarkMode();

  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={darkMode ? "dark" : "light"}
    />
  );
}

export default function Root() {
  return (
    <DarkModeProvider>
      <UserProvider initialUser={initialUser}>
        <WishlistCountProvider>
          <SettingsProvider>
            <TestimonialsProvider>
              <CartProvider>
                <App />
                <DynamicToastContainer />
              </CartProvider>
            </TestimonialsProvider>
          </SettingsProvider>
        </WishlistCountProvider>
      </UserProvider>
    </DarkModeProvider>
  );
}