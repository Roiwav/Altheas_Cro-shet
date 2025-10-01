/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo, Fragment } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../../context/useUser";
import { SettingsContext } from "../../context/SettingsContext.jsx";
import AdminSidebar from "../../components/admin/AdminSidebar.jsx";
import OrdersTab from "./OrdersTab.jsx";
import ProductsTab from "./ProductsTab.jsx";
import SettingsTab from "./SettingsTab.jsx";
import FeedbackTab from "./FeedbackTab.jsx";
import SubscribersTab from "./SubscribersTab.jsx";
import { useDarkMode } from "../../context/DarkModeContext.jsx";
import { Search, ArrowUp, ArrowDown, X, ChevronDown, Package, Truck, CheckCircle, XCircle, Trash2, LayoutDashboard, ShoppingCart, Box, Users, MessageSquare, Mail, Settings as SettingsIcon, UploadCloud, Image as ImageIcon, Plus, Clock, RefreshCw, Check, CreditCard, DollarSign, ArrowLeft, ArrowRight, Menu as MenuIcon } from "lucide-react";
import { Dialog, Transition, Menu, Switch } from '@headlessui/react';
import { toast } from 'react-toastify';

export default function AdminPage() {
  const { darkMode: isDarkMode } = useDarkMode();
  const { user } = useUser();
  const token = localStorage.getItem("token");
  const [metrics, setMetrics] = useState({
    revenue: 0,
    incomingOrders: 0,
    shippedProducts: 0,
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Number of items per page
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'dashboard';
  });
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "products", label: "Products", icon: Box },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "subscribers", label: "Subscribers", icon: Mail },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  useEffect(() => {
  console.log("Orders from backend:", orders);
}, [orders]);

  useEffect(() => {
  fetch("http://localhost:5001/api/orders", {
    method: "GET",
    credentials: "include", // include cookies if backend uses them
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`, // if JWT
    },
  })
    .then((res) => res.json())
    .then((data) => {
      setOrders(Array.isArray(data) ? data : data.orders || []);
    })
    .catch((err) => console.error("Error fetching orders:", err))
    .finally(() => setLoading(false));
}, []);

  useEffect(() => {
    // Calculate metrics from orders
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

    const incoming = orders.filter(o => o.status === 'pending').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;

    setMetrics({
      revenue: totalRevenue,
      incomingOrders: incoming,
      shippedProducts: shipped,
    });
  }, [orders]);

  // Save active tab to localStorage and reset search/filters when switching tabs
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
    
    // Reset search and filters when switching to orders tab
    if (activeTab === 'orders') {
      setCurrentPage(1);
    }
  }, [activeTab]);

  // Reset to first page when sorting or filtering
  useEffect(() => {
  }, [searchQuery]);

  if (user?.role !== "admin") {
    return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  }

  // Determine if search bar should be visible
  const showSearch = activeTab === 'dashboard' || activeTab === 'orders';

  const StatusBadge = ({ status }) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800',
      shipped: isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-800',
      delivered: isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800',
      rejected: isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800',
      cancelled: isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          statusClasses[status.toLowerCase()] || (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')
        }`}
      >
        {status}
      </span>
    );
  };

  const renderDashboard = () => {
    // If we're not on the dashboard tab, don't render anything
    if (activeTab !== 'dashboard') return null;
    
    return (
      <div className="space-y-8">
        {/* Welcome Card */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Welcome back, {user?.name || 'Admin'}!</h2>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Here's what's happening with your store today.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</h3>
                <p className={`mt-1 text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  ₱{metrics.revenue.toLocaleString()}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                <DollarSign className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Incoming Orders</h3>
                <p className={`mt-1 text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{metrics.incomingOrders}</p>
              </div>
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <ShoppingCart className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Products Shipped</h3>
                <p className={`mt-1 text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{metrics.shippedProducts}</p>
              </div>
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <Truck className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <button 
              onClick={() => setActiveTab('orders')}
              className="flex flex-col items-center justify-center p-4 transition-colors border border-gray-300 border-dashed rounded-lg hover:border-pink-500 hover:bg-pink-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <ShoppingCart className="w-6 h-6 mb-2 text-pink-600 dark:text-pink-400" />
              <span className="text-sm font-medium">View All Orders</span>
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className="flex flex-col items-center justify-center p-4 transition-colors border border-gray-300 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Box className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium">Manage Products</span>
            </button>
            <button 
              onClick={() => setActiveTab('feedback')}
              className="flex flex-col items-center justify-center p-4 transition-colors border border-gray-300 border-dashed rounded-lg hover:border-green-500 hover:bg-green-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <MessageSquare className="w-6 h-6 mb-2 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium">View Feedback</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className="flex flex-col items-center justify-center p-4 transition-colors border border-gray-300 border-dashed rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <SettingsIcon className="w-6 h-6 mb-2 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return <SettingsTab isDarkMode={isDarkMode} />;
  };

  const renderPagination = () => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        <span>Previous</span>
      </button>
      <span className={`text-sm px-3 py-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
      >
        <span>Next</span>
        <ArrowRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );

  const isSidebarCollapsed = !isSidebarHovered;
  
  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Mobile Sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className={`relative flex-1 flex flex-col max-w-xs w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 pt-2 -mr-12">
                    <button
                      type="button"
                      className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <X className="w-6 h-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <AdminSidebar
                  isDarkMode={isDarkMode}
                  tabs={tabs}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isSidebarCollapsed={isSidebarCollapsed}
                  sidebarOpen={sidebarOpen}
                />
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out overflow-x-hidden ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <AdminSidebar
          isDarkMode={isDarkMode}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSidebarCollapsed={isSidebarCollapsed}
          sidebarOpen={sidebarOpen}
        />
      </aside>

      <div className="flex flex-col flex-1 w-0 overflow-y-auto">
        {/* Header for mobile and search */}
        <div className={`sticky top-0 z-10 flex items-center justify-between flex-shrink-0 h-16 px-4 border-b md:justify-end ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
          <button
            type="button"
            className={`text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500 md:hidden`}
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="w-6 h-6" aria-hidden="true" />
          </button>
          {/* You can add a search bar here if needed for desktop, or other header items */}
        </div>

        <main className="relative z-0 flex-1 focus:outline-none">
          {/* Header */}
          <div className="p-4 md:p-8">
            {/* This div is now inside main content */}
            <div className="flex justify-end mb-4">
              {loading && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</span>
                </div>
              )}
            </div>

            {/* Search Bar for Mobile */}
            {showSearch && (
              <div className="relative mb-4 md:hidden">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'}`}
                />
              </div>
            )}

            {/* Tab Content */}
            <div className="transition-all duration-300 ease-in-out">
              {activeTab === "dashboard" && renderDashboard()}
              {activeTab === "orders" && <OrdersTab isDarkMode={isDarkMode} />}
              {activeTab === "products" && <ProductsTab isDarkMode={isDarkMode} />}
              {activeTab === "feedback" && <FeedbackTab isDarkMode={isDarkMode} />}
              {activeTab === "subscribers" && <SubscribersTab isDarkMode={isDarkMode} />}
              {activeTab === "settings" && <SettingsTab isDarkMode={isDarkMode} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
