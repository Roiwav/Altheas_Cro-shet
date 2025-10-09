// src/App.jsx - FIXED
import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Loader from './components/layout/Loader';
import AdminRoute from './components/auth/AdminRoute';
import AdminPage from './pages/admin/AdminPage';
import HomePage from './pages/main/HomePage';
import AboutUs from './pages/main/AboutUs';
import Contact from './pages/main/Contact';
import ShopPage from './pages/main/ShopPage';
import GalleryPage from './pages/main/GalleryPage';
import WishlistPage from './pages/main/WishlistPage';
import PortfolioPage from './pages/main/PortfolioPage';
import FAQPage from './pages/main/FAQPage';
import BlogPage from './pages/main/BlogPage';
import FeedbackPage from './pages/main/FeedbackPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import OAuthCallback from './pages/auth/OAuthCallback';
import CheckoutPage from './pages/main/CheckoutPage';
import CartPage from './pages/main/CartPage';
import UserDashboard from './pages/user/UserDashboard';
import OrdersPage from './pages/user/OrdersPage';
import SettingsPage from './pages/user/SettingsPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import DataPolicy from './pages/main/DataPolicy';
import ServiceTerm from './pages/main/ServiceTerm';
import NotFoundPage from './pages/main/NotFoundPage';
import ResetPassword from './pages/auth/ResetPassword';
import ARViewerPage from './pages/ar/ARViewerPage';
import FlowerViewerPage from './pages/ar/FlowerViewerPage';

function App() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

        {/* Auth Pages without Layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/success" element={<OAuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/data-policy" element={<DataPolicy />} />
        <Route path="/service-terms" element={<ServiceTerm />} />

        {/* AR Viewer Page without Layout */}
        <Route path="/view-ar" element={<ARViewerPage />} />

        <Route element={<Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}>
          {/* Main Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ar" element={<FlowerViewerPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          
          {/* User-specific Pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Cart and Checkout */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>

        {/* Catch-all for 404 Not Found - This should be the last route */}
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;