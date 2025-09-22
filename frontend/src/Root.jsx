import React from "react";
import { ToastContainer } from "react-toastify";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { TestimonialsProvider } from "./context/TestimonialsContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { DarkModeProvider, useDarkMode } from "./context/DarkModeContext.jsx";

// Get initial user from localStorage
const initialUser = JSON.parse(localStorage.getItem("user")) || null;

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
        <TestimonialsProvider>
          <CartProvider>
            <App />
            <DynamicToastContainer />
          </CartProvider>
        </TestimonialsProvider>
      </UserProvider>
    </DarkModeProvider>
  );
}