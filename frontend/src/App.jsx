// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Loader from './components/layout/Loader';
import AdminRoute from './components/auth/AdminRoute';
import AdminPage from './pages/admin/AdminPage';
import HomePage from './pages/main/HomePage';
import { useEffect, useState } from 'react';
import ARPage from './pages/ar/ARPage';
import ARViewerPage from './pages/ar/ARViewerPage';
import AboutUs from './pages/main/AboutUs';
import Contact from './pages/main/Contact';
import ShopPage from './pages/main/ShopPage';
import GalleryPage from './pages/main/GalleryPage';
import PortfolioPage from './pages/main/PortfolioPage';
import FAQPage from './pages/main/FAQPage';
import BlogPage from './pages/main/BlogPage';
import FeedbackPage from './pages/main/FeedbackPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import OAuthCallback from './pages/auth/OAuthCallback';
import CheckoutPage from './pages/main/CheckoutPage';
import UserDashboard from './pages/user/UserDashboard';
import OrdersPage from './pages/user/OrdersPage';
import SettingsPage from './pages/user/SettingsPage';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from "./pages/auth/ResetPassword";
import DataPolicy from './pages/main/DataPolicy.jsx';
import ServiceTerm from './pages/main/ServiceTerm.jsx';
import { useDarkMode } from './context/DarkModeContext.jsx';

export default function App() {
  const [loading, setLoading] = useState(true);

  // Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <Routes>
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      <Route element={<Layout />}>
        {/* Main Pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/ar" element={<ARPage />} />
        <Route path="/view-ar" element={<ARViewerPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/data-policy" element={<DataPolicy />} />
        <Route path="/service-terms" element={<ServiceTerm />} />
        
        {/* Auth Pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* User-specific Pages */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Catch-all for 404 Not Found */}
      </Route>
    </Routes>
  );
}
