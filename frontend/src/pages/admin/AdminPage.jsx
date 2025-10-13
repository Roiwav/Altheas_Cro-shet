/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo, useCallback, Fragment } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../../context/useUser";
import { SettingsContext } from "../../context/SettingsContext.jsx";
import AdminSidebar from "../../components/admin/AdminSidebar.jsx";
import OrdersTab from "./OrdersTab.jsx";
import CancelledTab from "./CancelledTab.jsx";
import ProductsTab from "./ProductsTab.jsx";
import SettingsTab from "./SettingsTab.jsx";
import TrashTab from "../../components/admin/products/TrashTab.jsx";
import FeedbackTab from "./FeedbackTab.jsx";
import UserManagementTab from "./UserManagementTab.jsx";
import LogsTab from "./LogsTab.jsx";
import { useDarkMode } from "../../context/useDarkMode.js";
import {
  Search,
  ArrowUp,
  ArrowDown,
  X,
  ChevronDown,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  LayoutDashboard,
  ShoppingCart,
  Box,
  Users,
  ClipboardList,
  MessageSquare,
  Mail,
  Settings as SettingsIcon,
  UploadCloud,
  Image as ImageIcon,
  Plus,
  Clock,
  RefreshCw,
  Check,
  CreditCard,
  DollarSign,
  ArrowLeft,
  ArrowRight,
  Menu as MenuIcon
} from "lucide-react";
import { Dialog, Transition, Menu, Switch } from '@headlessui/react';
import { toast } from 'react-toastify';
import { SERVER_BASE_URL } from '../../utils/product.js';

export default function AdminPage() {
  const { darkMode: isDarkMode } = useDarkMode();
  const { user } = useUser();
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const [metrics, setMetrics] = useState({
    revenue: 0,
    incomingOrders: 0,
    shippedProducts: 0,
  });
  const [revenuePerDay, setRevenuePerDay] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Number of items per page
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });

  // Calculate total pages based on orders and items per page
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'dashboard';
  });

  // Updated tabs array with new User Management and Logs tabs
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "cancelled", label: "Cancelled", icon: XCircle },
    { id: "products", label: "Products", icon: Box },
    { id: "usermanagement", label: "User Management", icon: Users },
    { id: "logs", label: "Logs", icon: ClipboardList },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  // Refresh Orders Utility
  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://altheascroshetbackend.vercel.app/api/v1/orders`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      const ordersArray = Array.isArray(data) ? data : data.orders || [];
      setOrders(ordersArray);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to refresh orders");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  // Live Metrics & Revenue By Day Calculation
  useEffect(() => {
    // Calculate metrics from orders
    const totalRevenue = orders
      .filter(o => String(o.status).trim().toLowerCase() === 'delivered')
      .reduce((sum, o) => {
        let price = parseFloat(
          o.total ?? o.total_price ?? o.totalPrice ?? o.amount ?? 0
        );
        return sum + (isNaN(price) ? 0 : price);
      }, 0);

    const incoming = orders.filter(
      o => String(o.status).trim().toLowerCase() === 'pending'
    ).length;

    const shipped = orders.filter(
      o => String(o.status).trim().toLowerCase() === 'shipped'
    ).length;

    // Revenue Per Day
    const delivered = orders.filter(o =>
      String(o.status).trim().toLowerCase() === 'delivered'
    );
    const revenueByDay = {};
    delivered.forEach(o => {
      const date = new Date(o.createdAt);
      const yyyy_mm_dd = date.toISOString().slice(0, 10);
      const amount = parseFloat(o.total ?? o.total_price ?? o.totalPrice ?? 0);
      if (!revenueByDay[yyyy_mm_dd]) revenueByDay[yyyy_mm_dd] = 0;
      revenueByDay[yyyy_mm_dd] += !isNaN(amount) ? amount : 0;
    });
    setRevenuePerDay(revenueByDay);

    setMetrics({
      revenue: totalRevenue,
      incomingOrders: incoming,
      shippedProducts: shipped,
    });
  }, [orders]);

  // Save active tab to localStorage and reset search/filters when switching tabs
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);

    if (activeTab === 'orders') {
      setCurrentPage(1);
    }
  }, [activeTab]);

  // Reset to first page when sorting or filtering
  useEffect(() => {}, [searchQuery]);

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
    if (activeTab !== 'dashboard') return null;
    return (
      <div className="space-y-8">
        {/* Welcome Card */}
        <div className="p-6 bg-white shadow rounded-xl dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name || 'Admin'}!</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Here's what's happening with your store today.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white shadow rounded-xl dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Revenue</h3>
                <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                  ₱{metrics.revenue.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-50 dark:bg-gray-700">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white shadow rounded-xl dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Incoming Orders</h3>
                <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.incomingOrders}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-gray-700">
                <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white shadow rounded-xl dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Products Shipped</h3>
                <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.shippedProducts}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-gray-700">
                <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        
        <div className="p-6 mt-8 bg-white shadow rounded-xl dark:bg-gray-800">
          <h3 className={`mb-2 text-lg font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>Revenue Per Day</h3>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className={`px-6 py-2 text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Date</th>
                <th className={`px-6 py-2 text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(revenuePerDay)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([date, amount]) => (
                  <tr key={date}>
                    <td className={`px-6 py-2 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{date}</td>
                    <td className={`px-6 py-2 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>₱{amount.toLocaleString()}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>


        {/* Quick Actions */}
        <div className="p-6 bg-white shadow rounded-xl dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <button
              onClick={() => setActiveTab('orders')}
              className="flex flex-col items-center justify-center p-4 transition-colors border border-gray-300 border-dashed rounded-lg hover:border-pink-500 hover:bg-pink-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <ShoppingCart className="w-6 h-6 mb-2 text-pink-600 dark:text-pink-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View All Orders</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className="flex flex-col items-center justify-center p-4 transition-colors border border-gray-300 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Box className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Products</span>
            </button>
            <button
              onClick={() => setActiveTab('usermanagement')}
              className="flex flex-col items-center justify-center p-4 transition-colors border border-gray-300 border-dashed rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Users className="w-6 h-6 mb-2 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User Management</span>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className="flex flex-col items-center justify-center p-4 transition-colors border border-gray-300 border-dashed rounded-lg hover:border-green-500 hover:bg-green-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <MessageSquare className="w-6 h-6 mb-2 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Feedback</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className="flex flex-col items-center justify-center p-4 transition-colors border border-gray-300 border-dashed rounded-lg hover:border-cyan-500 hover:bg-cyan-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <ClipboardList className="w-6 h-6 mb-2 text-cyan-600 dark:text-cyan-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Logs</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="flex flex-col items-center justify-center p-4 transition-colors border border-gray-300 border-dashed rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <SettingsIcon className="w-6 h-6 mb-2 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
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
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:border-gray-500"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        <span>Previous</span>
      </button>
      <span className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
        {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:border-gray-500"
      >
        <span>Next</span>
        <ArrowRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );

  const isSidebarCollapsed = !isSidebarHovered;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
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
              <Dialog.Panel className="relative flex flex-col flex-1 w-full max-w-xs bg-white dark:bg-gray-800">
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
        <div className="sticky top-0 z-10 flex items-center justify-between flex-shrink-0 h-16 px-4 bg-gray-100 border-b border-gray-200 md:justify-end dark:bg-gray-900 dark:border-gray-700">
          <button
            type="button"
            className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <main className="relative z-0 flex-1 focus:outline-none">
          <div className="p-4 md:p-8">
            <div className="flex justify-end mb-4">
              {loading && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                </div>
              )}
            </div>

            {/* Search Bar for Mobile */}
            {showSearch && (
              <div className="relative mb-4 md:hidden">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none dark:text-gray-400">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full py-2 pl-10 pr-3 leading-5 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-pink-500"
                />
              </div>
            )}

            {/* Tab Content */}
            <div className="transition-all duration-300 ease-in-out">
              {activeTab === "dashboard" && renderDashboard()}
              {activeTab === "orders" && <OrdersTab isDarkMode={isDarkMode} orders={orders} refreshOrders={refreshOrders} />}
              {activeTab === "cancelled" && <CancelledTab isDarkMode={isDarkMode} refreshOrders={refreshOrders} />}
              {activeTab === "products" && <ProductsTab isDarkMode={isDarkMode} onViewDeleted={() => setActiveTab('trash')} />}
              {activeTab === "usermanagement" && <UserManagementTab isDarkMode={isDarkMode} orders={orders} />}
              {activeTab === "logs" && <LogsTab isDarkMode={isDarkMode} />}
              {activeTab === "trash" && (
                <TrashTab
                  isDarkMode={isDarkMode}
                  onBackToProducts={() => setActiveTab('products')}
                  onGoToOrders={() => setActiveTab('orders')}
                />
              )}
              {activeTab === "feedback" && <FeedbackTab isDarkMode={isDarkMode} />}
              {activeTab === "settings" && <SettingsTab isDarkMode={isDarkMode} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
