import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext.jsx'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'

// Get initial user from localStorage
const initialUser = JSON.parse(localStorage.getItem('user')) || null

// Toast Container with dynamic theme
// eslint-disable-next-line react-refresh/only-export-components
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DarkModeProvider>
        <UserProvider initialUser={initialUser}>
          <CartProvider>
            <App />
            <DynamicToastContainer />
          </CartProvider>
        </UserProvider>
      </DarkModeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
