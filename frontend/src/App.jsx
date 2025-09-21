import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Loader from './components/layout/Loader';
import AdminPage from './pages/admin/AdminPage';
import HomePage from './pages/main/HomePage';
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
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import DataPolicy from './pages/main/DataPolicy.jsx';
import ServiceTerm from './pages/main/ServiceTerm.jsx';
import { useDarkMode } from './context/DarkModeContext.jsx';
import { ProductProvider } from './context/ProductContext';

export default function App() {
  const { darkMode } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  // Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (ref) => {
    if (ref.current) {
      window.scrollTo({
        top: ref.current.offsetTop - 80, // adjust offset for header
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return <Loader />;
  }

  // Landing page with scroll sections
  const LandingPage = () => (
    <div className="space-y-0">
      <div ref={homeRef}>
        <HomePage 
          onAboutClick={() => scrollToSection(aboutRef)}
          onContactClick={() => scrollToSection(contactRef)}
        />
      </div>
      
      <div ref={aboutRef}>
        <AboutUs noNavbar={true} />
      </div>
      
      <div ref={contactRef}>
        <Contact noNavbar={true} />
      </div>
    </div>
  );

  // Regular page layout
  const PageLayout = ({ children }) => (
    <div className="container mx-auto px-4 py-16">
      {children}
    </div>
  );

  return (
    <ProductProvider>
      <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          scrollToSection={scrollToSection}
          homeRef={homeRef}
          aboutRef={aboutRef}
          contactRef={contactRef}
        />

        <div
          className={`flex-1 min-h-screen transition-all duration-300
          ${sidebarOpen ? 'pl-72' : 'pl-20'}
          bg-gradient-to-br from-gray-50 via-white to-pink-50 
          dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`}
        >
          <Routes>
            {/* Home and Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<LandingPage />} />
            
            {/* Individual Pages (for direct navigation) */}
            <Route path="/ar" element={<ARPage />} />
            <Route path="/view-ar" element={<ARViewerPage />} />
            <Route path="/about" element={
              <PageLayout>
                <AboutUs />
              </PageLayout>
            } />
            <Route path="/contact" element={
              <PageLayout>
                <Contact />
              </PageLayout>
            } />
            
            {/* Other Routes */}
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/data-policy" element={<DataPolicy />} />
            <Route path="/service-terms" element={<ServiceTerm />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/blog" element={<BlogPage />} />
            
            {/* Static Pages */}
            <Route path="/shipping-returns" element={
              <PageLayout>
                <h1 className="text-3xl font-bold mb-8">Shipping & Returns</h1>
                <p className="text-gray-600 dark:text-gray-300">Coming soon...</p>
              </PageLayout>
            } />
            
            <Route path="/terms" element={
              <PageLayout>
                <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
                <p className="text-gray-600 dark:text-gray-300">Coming soon...</p>
              </PageLayout>
            } />
            
            <Route path="/privacy" element={
              <PageLayout>
                <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
                <p className="text-gray-600 dark:text-gray-300">Coming soon...</p>
              </PageLayout>
            } />
          </Routes>
        </div>
      </div>
    </ProductProvider>
  );
}
