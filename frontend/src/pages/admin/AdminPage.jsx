/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo, Fragment } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../../context/useUser";
import { SettingsContext } from "../../context/SettingsContext.jsx";
import AdminNavbar from "../../components/admin/AdminNavbar.jsx"
import { useDarkMode } from "../../context/DarkModeContext.jsx";
import { Search, ArrowUp, ArrowDown, X, ChevronDown, Package, Truck, CheckCircle, XCircle, Trash2, LayoutDashboard, ShoppingCart, Box, Users, MessageSquare, Mail, Settings as SettingsIcon, UploadCloud, Image as ImageIcon, Plus, Clock, RefreshCw, Check, CreditCard, DollarSign, ArrowLeft, ArrowRight } from "lucide-react";
import logoSrc from '../../assets/images/icons/logo althea.jpg'; // Import the logo
import { Dialog, Transition, Menu, Switch } from '@headlessui/react';
import { toast } from 'react-toastify';

export default function AdminPage() {
  const { isDarkMode } = useDarkMode();
  const { user } = useUser();
  const token = localStorage.getItem("token");
  const [metrics, setMetrics] = useState({
    revenue: 0,
    incomingOrders: 0,
    shippedProducts: 0,
  });
  const [editingZone, setEditingZone] = useState(null);
  const [zoneBackup, setZoneBackup] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchQuery(searchTerm);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Number of items per page
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [feedbacks, setFeedbacks] = useState([
    { id: 1, name: 'Jane Doe', email: 'jane.d@example.com', message: 'Absolutely love the crochet flowers! The quality is amazing and they look beautiful in my living room.', created_at: '2023-10-26T10:00:00Z' },
    { id: 2, name: 'John Smith', email: 'john.s@example.com', message: 'Great customer service and fast shipping. The packaging was also very lovely. Will definitely buy again!', created_at: '2023-10-25T14:30:00Z' },
    { id: 3, name: 'Emily White', email: 'emily.w@example.com', message: 'The sunflower is so cheerful and well-made. It brightens up my desk.', created_at: '2023-10-25T11:20:00Z' },
  ]);
  const [subscribers, setSubscribers] = useState([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'subscribedAt', direction: 'descending' });
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

  // Fetch orders from backend
  // const fetchOrders = () => {
  //   const token = localStorage.getItem('token');
  //   setLoading(true);
  //   fetch("/api/v1/orders", {
  //     headers: {
  //       'Authorization': `Bearer ${token}`
  //     }
  //   })
  //     .then((res) => res.json())
  //     .then((data) => {
  //       // Assuming the backend returns an array of orders directly or under a 'orders' key
  //       if (Array.isArray(data)) {
  //         setOrders(data);
  //       } else if (data && Array.isArray(data.orders)) {
  //         setOrders(data.orders);
  //       } else {
  //         console.error("Fetched data is not an array:", data);
  //         setOrders([]); // Set to empty array on failure
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching orders:", error);
  //     });
  // };

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
      setSearchQuery('');
      setSearchTerm('');
      setCurrentPage(1);
    }
  }, [activeTab]);

  // Reset to first page when sorting or filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig]);

  if (user?.role !== "admin") {
    return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  }

  // Update order status via backend API
  const updateOrderStatus = (orderId, formattedStatus) => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: formattedStatus }),


    })
      .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {  
        toast.error("Failed to update order: " + (data.message || "Unknown error"));
        return;
      } 

      toast.success(`Order #${orderId} status updated to ${formattedStatus}`);
      
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: formattedStatus } : order
        )
      );
      
    })
      .catch((err) => {
        console.error("Network error:", err); 
        toast.error("Network error updating order status.");
      });
  };

  // Filter orders based on search query with comprehensive field matching
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const filteredOrders = useMemo(() => {
    // Return empty array if orders is not yet loaded
    if (!orders) return [];
    
    // Return all orders if no search query
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return orders;
    
    const query = trimmedQuery.toLowerCase();
    return orders.filter(order => {
      if (!order) return false;
      
      // Check order number
      if (order._id?.toLowerCase().includes(query)) return true;
      
      // Check customer name
      if (order.fullname?.toLowerCase().includes(query)) return true;
      
      // Check email if exists
      if (order.email?.toLowerCase().includes(query)) return true;
      
      // Check phone number if exists
      if (order.phoneNumber?.includes(query)) return true;
      
      // Check status
      if (order.status?.toLowerCase().includes(query)) return true;
      
      // Check products
      if (order.products?.some(p => 
        p.name?.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query))
      )) return true;
      
      // Check product name (legacy support)
      if (order.product_name?.toLowerCase().includes(query)) return true;
      
      // Check shipping address
      if (order.shippingAddress) {
        const { address, city, state, postalCode, country } = order.shippingAddress;
        if (
          (address && address.toLowerCase().includes(query)) ||
          (city && city.toLowerCase().includes(query)) ||
          (state && state.toLowerCase().includes(query)) ||
          (postalCode && postalCode.includes(query)) ||
          (country && country.toLowerCase().includes(query))
        ) return true;
      }
      
      // Check payment method
      if (order.paymentMethod?.toLowerCase().includes(query)) return true;
      
      // Check total amount
      if (order.total?.toString().includes(query)) return true;
      
      return false;
    });
  }, [orders, searchQuery]);

  // Sort orders based on sortConfig
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sortedAndFilteredOrders = useMemo(() => {
    if (!sortConfig.key) return filteredOrders;

    return [...filteredOrders].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      const numericKeys = ['id', 'quantity', 'shipping_fee', 'total_price'];
      const dateKeys = ['created_at'];

      let valA, valB;

      if (numericKeys.includes(sortConfig.key)) {
        valA = parseFloat(aValue) || 0;
        valB = parseFloat(bValue) || 0;
      } else if (dateKeys.includes(sortConfig.key)) {
        valA = new Date(aValue).getTime() || 0;
        valB = new Date(bValue).getTime() || 0;
      } else { // String sorting
        valA = String(aValue).toLowerCase();
        valB = String(bValue).toLowerCase();
      }

      if (valA < valB) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (valA > valB) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Paginate orders
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAndFilteredOrders.length / itemsPerPage);

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

  const renderActions = (order) => {
    const statusOptions = [
      { value: 'pending', label: 'Mark as Pending', icon: Clock, color: 'text-yellow-500' },
      { value: 'processing', label: 'Mark as Processing', icon: RefreshCw, color: 'text-blue-500' },
      { value: 'shipped', label: 'Mark as Shipped', icon: Truck, color: 'text-indigo-500' },
      { value: 'delivered', label: 'Mark as Delivered', icon: CheckCircle, color: 'text-green-500' },
      { value: 'rejected', label: 'Reject Order', icon: XCircle, color: 'text-red-500' },
      { value: 'cancelled', label: 'Cancel Order', icon: X, color: 'text-gray-500' },
    ];

    return (
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button 
            className={`inline-flex items-center justify-center w-full rounded-md border shadow-sm px-4 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <span>Actions</span>
            <ChevronDown className="w-4 h-4 ml-2 -mr-1" aria-hidden="true" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items 
            className={`absolute right-0 mt-2 w-64 origin-top-right divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
          >
            <div className="px-1 py-1">
              <div className={`px-3 py-2 text-xs font-semibold ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                UPDATE ORDER STATUS
              </div>
              {statusOptions.map((status) => {
                const Icon = status.icon;
                return (
                  <Menu.Item key={status.value}>
                    {({ active }) => (
                      <button
                        onClick={() => updateOrderStatus(order._id, status.value)}
                        className={`${
                          active 
                            ? isDarkMode 
                              ? 'bg-gray-700 text-white' 
                              : 'bg-gray-100 text-gray-900'
                            : isDarkMode 
                              ? 'text-gray-200' 
                              : 'text-gray-700'
                        } group flex w-full items-center rounded-md px-3 py-2.5 text-sm transition-colors duration-150`}
                      >
                        <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${status.color}`} />
                        <span className="flex-1 text-left">{status.label}</span>
                        {order.status === status.value && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </button>
                    )}
                  </Menu.Item>
                );
              })}
            </div>
            <div className="px-1 py-1">
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    );
  };

  const OrderTable = ({
    orders,
    isDarkMode,
    sortConfig,
    requestSort,
    renderActions,
    searchQuery,
    StatusBadge,
    totalPages,
    renderPagination,
  }) => {
    const columns = [
      { key: 'orderNumber', label: 'Order ID', width: 'w-24' },
      { key: 'fullname', label: 'Customer', width: 'w-40' },
      { key: 'products', label: 'Product', width: 'w-48' },
      { key: 'region', label: 'Region', width: 'w-24' },
      { key: 'shippingFee', label: 'Shipping', width: 'w-20' },
      { key: 'total', label: 'Total', width: 'w-24' },
      { key: 'createdAt', label: 'Date', width: 'w-32' },
      { key: 'status', label: 'Status', width: 'w-28' },
      { key: null, label: 'Actions', width: 'w-28' },
    ];

    return (
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-hidden mt-8`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                {columns.map(col => (
                  <th 
                    key={col.key || 'actions'} 
                    className={`px-3 py-2 text-left text-xs font-medium ${col.width} ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    {col.key ? (
                      <button 
                        onClick={() => requestSort(col.key)} 
                        className="flex items-center w-full space-x-1 text-left transition-colors hover:text-pink-500"
                      >
                        <span className="truncate">{col.label}</span>
                        {sortConfig.key === col.key && (
                          sortConfig.direction === 'ascending' 
                            ? <ArrowUp className="flex-shrink-0 w-3 h-3" /> 
                            : <ArrowDown className="flex-shrink-0 w-3 h-3" />
                        )}
                      </button>
                    ) : (
                      <span className="truncate">{col.label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className={`px-3 py-4 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {searchQuery ? 'No orders match your search.' : 'No orders found.'}
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                    <td className={`px-3 py-2 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`} title={o.orderNumber || o._id}>
                      {o.orderNumber || o._id?.substring(0, 8)}
                    </td>
                    <td className={`px-3 py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="truncate" title={o.username || o.userId?.fullname}>
                        {o.username || o.userId?.fullname}
                      </div>
                    </td>
                    <td className={`px-3 py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="truncate" title={o.products?.map(p => `${p.name} (x${p.quantity})`).join(", ")}>
                        {o.products?.map(p => `${p.name} (x${p.quantity})`).join(", ")}
                      </div>
                    </td>
                    <td className={`px-3 py-2 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`} title={o.shippingAddress?.state || o.region || "-"}>
                      {o.shippingAddress?.state || o.region || "-"}
                    </td>
                    <td className={`px-3 py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      ₱{parseFloat(o.shippingFee || 0).toLocaleString()}
                    </td>
                    <td className={`px-3 py-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      ₱{Number(o.total || 0).toLocaleString()}
                    </td>
                    <td className={`px-3 py-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="w-full">
                        <StatusBadge status={o.status} isDarkMode={isDarkMode} />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end">
                        {renderActions(o)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            {renderPagination()}
          </div>
        )}
      </div>
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

  const renderOrders = () => {
    // If we're not on the orders tab, don't render anything
    if (activeTab !== 'orders') return null;
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Orders</h2>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Manage and track customer orders
            </p>
          </div>
          <div className="w-full sm:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-hidden`}>
          <OrderTable
            orders={paginatedOrders}
            isDarkMode={isDarkMode}
            sortConfig={sortConfig}
            requestSort={requestSort}
            renderActions={renderActions}
            searchQuery={searchQuery}
            StatusBadge={StatusBadge}
            totalPages={totalPages}
            renderPagination={renderPagination}
          />
          
          {paginatedOrders.length > 0 && (
            <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              <div className="flex items-center space-x-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={`text-sm rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} focus:ring-pink-500 focus:border-pink-500`}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                {renderPagination()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Component for displaying products
  const ProductsTab = ({ isDarkMode, Plus }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddProductForm, setShowAddProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null); // State to hold product being edited
    const [editFormData, setEditFormData] = useState({}); // Form data for editing
  
    useEffect(() => {
      const fetchProducts = async () => {
        setLoading(true);
        // Replace with your actual backend endpoint to fetch products
        fetch('/api/v1/products')
          .then(response => response.json())
          .then(data => {
            if (Array.isArray(data.products)) {
              setProducts(data.products);
            } else {
              console.error('Failed to fetch products:', data.message || 'Invalid data structure');
            }
            setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching products:', error);
            setLoading(false);
          });
      };

      fetchProducts();
    }, []);

    const [newImage, setNewImage] = useState(null);
    const [newImagePreview, setNewImagePreview] = useState(null);
  
    const handleNewImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setNewImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    };
  
    const handleNewRemoveImage = () => {
      setNewImage(null);
      setNewImagePreview(null);
    };
  
    const handleNewProductSubmit = (e) => {
      e.preventDefault();

      // --- Validation ---
      if (!editFormData.productName?.trim()) {
        toast.error('Product name is required.');
        return;
      }
      if (!editFormData.description?.trim()) {
        toast.error('Product description is required.');
        return;
      }
      const priceValue = parseFloat(editFormData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        toast.error('Please enter a valid positive price.');
        return;
      }
      const quantityValue = parseInt(editFormData.quantity, 10);
      if (isNaN(quantityValue) || quantityValue < 0) {
        toast.error('Please enter a valid non-negative quantity.');
        return;
      }
      if (!newImage) {
        toast.error('Product image is required.');
        return;
      }

      // Backend logic will be added here later
      console.log({
        productName: editFormData.productName,
        description: editFormData.description,
        price: editFormData.price,
        quantity: editFormData.quantity,
        newImage,
      });
      toast.success(`Product "${editFormData.productName}" has been staged for creation.`);
      // Reset form
      setEditFormData({});
      handleNewRemoveImage();
      setShowAddProductForm(false); // Hide form after submission
    };

    const handleEditClick = (product) => {
      setEditingProduct(product);
      setEditFormData({
        id: product.id,
        productName: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
      });
      setNewImagePreview(product.image); // Assuming product.image holds the URL
      setShowAddProductForm(false); // Hide add form if editing
    };

    const handleEditFormChange = (e) => {
      const { name, value } = e.target;
      setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditProductSubmit = (e) => {
      e.preventDefault();

      // --- Validation ---
      if (!editFormData.productName?.trim()) {
        toast.error('Product name is required.');
        return;
      }
      if (!editFormData.description?.trim()) {
        toast.error('Product description is required.');
        return;
      }
      const priceValue = parseFloat(editFormData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        toast.error('Please enter a valid positive price.');
        return;
      }
      const quantityValue = parseInt(editFormData.quantity, 10);
      if (isNaN(quantityValue) || quantityValue < 0) {
        toast.error('Please enter a valid non-negative quantity.');
        return;
      }
      if (!newImage && !newImagePreview) { // Check if no new image and no existing preview
        toast.error('Product image is required.');
        return;
      }

      // Backend logic will be added here later
      console.log('Updating product:', editFormData.id, {
        productName: editFormData.productName,
        description: editFormData.description,
        price: editFormData.price,
        quantity: editFormData.quantity,
        image: newImage || newImagePreview, // Use new image if uploaded, else existing preview
      });
      toast.success(`Product "${editFormData.productName}" updated.`);

      // Update products list in state (frontend only)
      setProducts(prevProducts => prevProducts.map(p =>
        p.id === editFormData.id ? { ...p, ...editFormData, image: newImagePreview } : p
      ));

      setEditingProduct(null); // Close modal
      setEditFormData({});
      setNewImage(null);
      setNewImagePreview(null);
    };

    const handleCancelEdit = () => {
      setEditingProduct(null);
      setEditFormData({});
      setNewImage(null);
      setNewImagePreview(null);
    };

    const handleDeleteClick = (productId) => {
      if (window.confirm('Are you sure you want to delete this product?')) {
        // Backend logic will be added here later
        console.log('Deleting product with ID:', productId);
        toast.success('Product deleted.');
        // Update products list in state (frontend only)
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      }
    };
  
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Products</h2>
          <button
            onClick={() => setShowAddProductForm(!showAddProductForm)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            {showAddProductForm ? 'Cancel Add Product' : 'Add New Product'}
          </button>
        </div>
  
        {showAddProductForm && (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6 mb-8`}>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add New Product</h3>
            <form onSubmit={handleNewProductSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Image Uploader */}
              <div className="space-y-4 lg:col-span-1">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Image</label>
                <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} border-dashed rounded-md`}>
                  <div className="space-y-1 text-center">
                    {newImagePreview ? (
                      <div>
                        <img src={newImagePreview} alt="Product preview" className="object-contain w-auto h-48 mx-auto rounded-md" />
                        <button type="button" onClick={handleNewRemoveImage} className="mt-2 text-sm text-red-600 hover:text-red-500">
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="file-upload" className={`relative cursor-pointer rounded-md font-medium ${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-500'} focus-within:outline-none`}>
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleNewImageChange} />
                          </label>
                          <p className={`pl-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>or drag and drop</p>
                        </div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
  
              {/* Product Details */}
              <div className="space-y-6 lg:col-span-2">
                <div>
                  <label htmlFor="productName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Name</label>
                  <input type="text" id="productName" name="productName" value={editFormData.productName || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                </div>
                <div>
                  <label htmlFor="description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                  <textarea id="description" name="description" rows="4" value={editFormData.description || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}></textarea>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="price" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price (₱)</label>
                    <input type="number" id="price" name="price" value={editFormData.price || ''} onChange={handleEditFormChange} required min="0" step="0.01" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                  </div>
                  <div>
                    <label htmlFor="quantity" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantity Available</label>
                    <input type="number" id="quantity" name="quantity" value={editFormData.quantity || ''} onChange={handleEditFormChange} required min="0" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                  </div>
                </div>
              </div>
  
              {/* Form Actions */}
              <div className="flex justify-end lg:col-span-3">
                <button type="submit" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
                  <UploadCloud className="w-5 h-5 mr-2" />
                  Add Product
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Product Modal */}
        <Transition appear show={editingProduct !== null} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={handleCancelEdit}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-75" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-full p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className={`w-full max-w-3xl transform overflow-hidden rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 text-left align-middle shadow-xl transition-all`}>
                    <Dialog.Title as="h3" className={`text-lg font-medium leading-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Edit Product: {editingProduct?.name}
                    </Dialog.Title>
                    <form onSubmit={handleEditProductSubmit} className="grid grid-cols-1 gap-6 mt-4 lg:grid-cols-2">
                      {/* Image Uploader for Edit */}
                      <div className="space-y-4">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Image</label>
                        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} border-dashed rounded-md`}>
                          <div className="space-y-1 text-center">
                            {newImagePreview ? (
                              <div>
                                <img src={newImagePreview} alt="Product preview" className="object-contain w-auto h-48 mx-auto rounded-md" />
                                <button type="button" onClick={handleNewRemoveImage} className="mt-2 text-sm text-red-600 hover:text-red-500">
                                  Remove Image
                                </button>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                <div className="flex text-sm text-gray-600">
                                  <label htmlFor="edit-file-upload" className={`relative cursor-pointer rounded-md font-medium ${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-500'} focus-within:outline-none`}>
                                    <span>Upload a file</span>
                                    <input id="edit-file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleNewImageChange} />
                                  </label>
                                  <p className={`pl-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>or drag and drop</p>
                                </div>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>PNG, JPG, GIF up to 10MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Product Details for Edit */}
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="productName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Name</label>
                          <input type="text" id="productName" name="productName" value={editFormData.productName || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                        </div>
                        <div>
                          <label htmlFor="description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                          <textarea id="description" name="description" rows="3" value={editFormData.description || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="price" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price (₱)</label>
                            <input type="number" id="price" name="price" value={editFormData.price || ''} onChange={handleEditFormChange} required min="0" step="0.01" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                          </div>
                          <div>
                            <label htmlFor="quantity" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantity Available</label>
                            <input type="number" id="quantity" name="quantity" value={editFormData.quantity || ''} onChange={handleEditFormChange} required min="0" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                          </div>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end mt-4 space-x-3 lg:col-span-2">
                        <button
                          type="button"
                          className={`inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 focus-visible:ring-blue-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-blue-500'}`}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
  
        {/* Existing Products List */}
        {loading ? (
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading products...</p>
        ) : (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-x-auto`}>
            <table className="w-full text-left">
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Name</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Price</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                {products.map(product => (
                  <tr key={product.id} className={isDarkMode ? 'hover:bg-gray-700/50' : ''}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {product.name} 
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      ₱{parseFloat(product.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="mr-2 text-pink-600 hover:text-pink-800"
                        title="Edit Product"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Product"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Component for displaying settings
  const SettingsTab = ({ isDarkMode }) => {
    const { settings, updateSettings } = React.useContext(SettingsContext);
    
    const ToggleSwitch = ({ enabled, onChange, label, description }) => (
      <div className="flex items-start space-x-4">
        <div className="flex-1">
          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {label}
          </div>
          {description && (
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
        </div>
        <Switch
          className={`${enabled ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
          checked={enabled}
          onChange={onChange}
        >
          <span className="sr-only">Toggle {label}</span>
          <span 
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            aria-hidden="true"
          />
        </Switch>
      </div>
    );

    // Use settings from context

    const handleToggle = (key) => {
      const updatedSettings = { ...settings, [key]: !settings[key] };
      updateSettings(updatedSettings);
      toast.info(`Setting updated.`);
    };

    // Shipping Zones State
    const [expandedZone, setExpandedZone] = useState(null);
  const [editingCities, setEditingCities] = useState(null);
  const [citiesInput, setCitiesInput] = useState('');
    
    // Toggle zone expansion
    const toggleZone = (zoneId) => {
      if (editingZone && editingZone.id === zoneId) {
        // If clicking the same zone that's being edited, do nothing
        return;
      }
      
      if (editingZone) {
        // If there's an unsaved edit, confirm before switching
        if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
          // Discard changes and close the zone
          setEditingZone(null);
          setZoneBackup(null);
          setExpandedZone(expandedZone === zoneId ? null : zoneId);
        }
      } else {
        // No editing in progress, just toggle normally
        setExpandedZone(expandedZone === zoneId ? null : zoneId);
      }
    };
    
    // Update shipping method details
    const updateZoneMethod = (zoneId, methodId, field, value) => {
      const updatedZones = settings.shippingZones.map(zone => {
        if (zone.id === zoneId) {
          const method = zone.methods.find(m => m.id === methodId);
          const updatedMethods = zone.methods.map(method => 
            method.id === methodId ? { ...method, [field]: value } : method
          );
          return { ...zone, methods: updatedMethods };
        }
        return zone;
      });
      updateSettings({ ...settings, shippingZones: updatedZones });
      toast.success(`Updated ${field} for shipping method`);
    };
    
    // Update zone details
    const updateZone = (zoneId, field, value) => {
      const updatedZones = settings.shippingZones.map(zone => 
        zone.id === zoneId ? { ...zone, [field]: value } : zone
      );
      
      updateSettings({ ...settings, shippingZones: updatedZones });
      
      // Update the editing zone state if we're editing this zone
      if (editingZone?.id === zoneId) {
        setEditingZone(prev => ({
          ...prev,
          [field]: value
        }));
      }

      // Show success message for all updates except when just starting to edit
      if (field !== 'name' || !editingZone) {
        toast.success('Zone updated successfully');
      }
    };
    
    // Toggle zone active status
    const toggleZoneStatus = (zoneId) => {
      const zone = settings.shippingZones.find(z => z.id === zoneId);
      const newStatus = !zone.isActive;
      const updatedZones = settings.shippingZones.map(zone => 
        zone.id === zoneId ? { ...zone, isActive: newStatus } : zone
      );
      updateSettings({ ...settings, shippingZones: updatedZones });
      toast.success(`Shipping zone ${newStatus ? 'enabled' : 'disabled'} successfully`);
    };
    
    // Toggle method active status
    const toggleMethodStatus = (zoneId, methodId) => {
      let methodName = '';
      const updatedZones = settings.shippingZones.map(zone => {
        if (zone.id === zoneId) {
          const updatedMethods = zone.methods.map(method => {
            if (method.id === methodId) {
              methodName = method.name;
              return { ...method, isActive: !method.isActive };
            }
            return method;
          });
          return { ...zone, methods: updatedMethods };
        }
        return zone;
      });
      updateSettings({ ...settings, shippingZones: updatedZones });
      const method = updatedZones
        .find(z => z.id === zoneId)?.methods
        .find(m => m.id === methodId);
      if (method) {
        toast.success(`Shipping method "${method.name}" ${method.isActive ? 'enabled' : 'disabled'}`);
      }
    };
    
    // Start editing a zone
    const startEditingZone = (zone) => {
      setZoneBackup(JSON.parse(JSON.stringify(zone)));
      setEditingZone(zone);
    };
    
    // Cancel editing
    const cancelEditingZone = (zoneId) => {
      if (zoneBackup) {
        const updatedZones = settings.shippingZones.map(zone => 
          zone.id === zoneId ? { ...zoneBackup } : zone
        );
        updateSettings({ ...settings, shippingZones: updatedZones });
        setZoneBackup(null);
        setEditingZone(null);
        toast.info('Changes discarded');
      }
    };
    
    // Save zone changes
    const saveZoneChanges = (zoneId) => {
      setZoneBackup(null);
      setEditingZone(null);
      toast.success('Zone updated successfully');
    };
    
    // Delete a zone
    const deleteZone = (zoneId) => {
      if (window.confirm('Are you sure you want to delete this shipping zone? This action cannot be undone.')) {
        const updatedZones = settings.shippingZones.filter(zone => zone.id !== zoneId);
        updateSettings({ ...settings, shippingZones: updatedZones });
        toast.success('Shipping zone deleted successfully');
        
        if (expandedZone === zoneId) {
          setExpandedZone(null);
        }
        
        if (editingZone?.id === zoneId) {
          setEditingZone(null);
          setZoneBackup(null);
        }
      }
    };
    
    // Add a new shipping zone
    const handleAddShippingZone = () => {
      const newZone = {
        id: `zone-${Date.now()}`,
        name: 'New Shipping Zone',
        cities: [],
        methods: [
          { id: 'standard', name: 'Standard Delivery', price: 0, description: 'Standard delivery time', isActive: true },
          { id: 'express', name: 'Express Delivery', price: 0, description: 'Faster delivery option', isActive: true }
        ],
        freeShippingThreshold: 0,
        isActive: true
      };
      
      // Ensure settings.shippingZones is an array
      const currentZones = Array.isArray(settings.shippingZones) ? settings.shippingZones : [];
      
      updateSettings({ 
        ...settings, 
        shippingZones: [...currentZones, newZone] 
      });
      
      setExpandedZone(newZone.id);
      toast.info('New shipping zone added. Please configure the details.');
    };

    // Settings are saved automatically via the context

    const inputClasses = `block w-full rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900 placeholder-gray-500'} focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2`;
    const sectionClasses = `rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm overflow-hidden transition-all duration-200`;
    const sectionHeaderClasses = `px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`;
    const sectionBodyClasses = 'p-6 space-y-6';
    const cardClasses = `p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} border`;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Settings</h2>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage your store's configuration and preferences. Changes are saved automatically.
            </p>
          </div>
        </div>

        {/* Site Configuration */}
        <div className={sectionClasses}>
          <div className={sectionHeaderClasses}>
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Site Configuration</h3>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Control your store's global settings
            </p>
          </div>
          <div className={sectionBodyClasses}>
            <div className={`${cardClasses} space-y-6`}>
              <ToggleSwitch 
                enabled={settings.maintenanceMode} 
                onChange={() => handleToggle('maintenanceMode')}
                label="Maintenance Mode"
                description="When enabled, only administrators can access the store"
              />
              <div className="my-2 border-t border-gray-200 dark:border-gray-600"></div>
              <ToggleSwitch 
                enabled={settings.registration} 
                onChange={() => handleToggle('registration')}
                label="User Registration"
                description="Allow new customers to create accounts"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className={sectionClasses}>
          <div className={sectionHeaderClasses}>
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Payment Methods</h3>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Configure available payment options for your customers
            </p>
          </div>
          <div className={sectionBodyClasses}>
            <div className={`${cardClasses} space-y-6`}>
              <ToggleSwitch 
                enabled={settings.cod} 
                onChange={() => handleToggle('cod')}
                label="Cash on Delivery (COD)"
                description="Allow customers to pay when they receive their order"
              />
              <div className="my-2 border-t border-gray-200 dark:border-gray-600"></div>
              <ToggleSwitch 
                enabled={settings.gcashPayment} 
                onChange={() => handleToggle('gcashPayment')}
                label="GCash Payment"
                description="Enable GCash as a payment option at checkout"
              />
            </div>
          </div>
        </div>

        {/* Shipping Zones */}
        <div className={sectionClasses}>
          <div className={sectionHeaderClasses}>
            <div>
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shipping Zones</h3>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Configure shipping rates and methods for different locations
              </p>
            </div>
          </div>
          <div className={sectionBodyClasses}>
            <div className="space-y-4">
              {settings.shippingZones?.map((zone) => (
                <div key={zone.id} className={`${cardClasses} overflow-hidden`}>
                  {/* Zone Header */}
                  <div 
                    className={`p-4 cursor-pointer flex justify-between items-center ${expandedZone === zone.id ? 'border-b' : ''} ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                    onClick={() => toggleZone(zone.id)}
                  >
                    <div className="flex items-center">
                      <Switch
                        checked={zone.isActive}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleZoneStatus(zone.id);
                        }}
                        className={`${zone.isActive ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full`}
                      >
                        <span className="sr-only">Enable</span>
                        <span
                          className={`${
                            zone.isActive ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                        />
                      </Switch>
                      {editingZone?.id === zone.id ? (
                        <input
                          type="text"
                          value={editingZone.name}
                          onChange={(e) => setEditingZone({...editingZone, name: e.target.value})}
                          onClick={(e) => e.stopPropagation()}
                          className={`ml-3 bg-transparent border-b ${isDarkMode ? 'text-white border-gray-500' : 'text-gray-900 border-gray-300'} focus:outline-none focus:border-pink-500`}
                          autoFocus
                        />
                      ) : (
                        <h4 
                          className={`ml-3 font-medium ${zone.isActive ? (isDarkMode ? 'text-white' : 'text-gray-900') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')} cursor-text`}
                          onDoubleClick={() => startEditingZone(zone)}
                        >
                          {zone.name}
                        </h4>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${zone.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <ChevronDown 
                        className={`ml-2 h-5 w-5 transition-transform duration-200 ${expandedZone === zone.id ? 'transform rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  
                  {/* Zone Content */}
                  {expandedZone === zone.id && (
                    <div className="p-4 pt-2">
                      {/* Zone Name */}
                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Zone Name
                        </label>
                        <input
                          type="text"
                          value={zone.name}
                          onChange={(e) => updateZone(zone.id, 'name', e.target.value)}
                          className={inputClasses}
                          placeholder="e.g. Metro Manila"
                        />
                      </div>
                      
                      {/* Cities Covered */}
                      <div className="mb-4">
                        <h5 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Cities Covered
                        </h5>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {zone.cities.slice(0, 5).map((city, idx) => (
                            <span 
                              key={idx}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isDarkMode 
                                  ? 'bg-gray-700 text-gray-200' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {city}
                            </span>
                          ))}
                          {zone.cities.length > 5 && (
                            <span className="self-center text-xs text-gray-500">
                              +{zone.cities.length - 5} more
                            </span>
                          )}
                        </div>
                        {editingCities === zone.id ? (
                          <div className="mt-2">
                            <textarea
                              value={citiesInput}
                              onChange={(e) => setCitiesInput(e.target.value)}
                              className="w-full p-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
                              rows="3"
                              placeholder="Enter cities, separated by commas"
                            />
                            <div className="flex justify-end mt-2 space-x-2">
                              <button
                                onClick={() => setEditingCities(null)}
                                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  try {
                                    const updatedZones = settings.shippingZones.map(z => {
                                      if (z.id === zone.id) {
                                        const newCities = citiesInput
                                          .split(',')
                                          .map(city => city.trim())
                                          .filter(city => city.length > 0);
                                        
                                        console.log('Updating cities:', newCities); // Debug log
                                        
                                        return {
                                          ...z,
                                          cities: newCities
                                        };
                                      }
                                      return z;
                                    });
                                    
                                    updateSettings({
                                      ...settings,
                                      shippingZones: updatedZones
                                    });
                                    
                                    toast.success('Cities updated successfully');
                                    setEditingCities(null);
                                  } catch (error) {
                                    console.error('Error updating cities:', error);
                                    toast.error('Failed to update cities. Please try again.');
                                  }
                                }}
                                className="px-2 py-1 text-xs text-white bg-pink-600 rounded-md hover:bg-pink-700"
                              >
                                Save Cities
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCities(zone.id);
                              setCitiesInput(zone.cities.join(', '));
                            }}
                            className="text-xs text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                          >
                            Edit cities
                          </button>
                        )}
                      </div>
                      
                      {/* Shipping Methods */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Shipping Methods
                          </h5>
                        </div>
                        
                        <div className="space-y-3">
                          {zone.methods.map((method) => (
                            <div 
                              key={method.id}
                              className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Switch
                                    checked={method.isActive}
                                    onChange={() => toggleMethodStatus(zone.id, method.id)}
                                    className={`${method.isActive ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-5 w-9 items-center rounded-full`}
                                  >
                                    <span className="sr-only">Enable</span>
                                    <span
                                      className={`${
                                        method.isActive ? 'translate-x-5' : 'translate-x-1'
                                      } inline-block h-3 w-3 transform rounded-full bg-white transition`}
                                    />
                                  </Switch>
                                  <div className="ml-3">
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                      {method.name}
                                    </span>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {method.description}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center">
                                  {method.price > 0 ? (
                                    <div className="relative rounded-md shadow-sm w-28">
                                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">₱</span>
                                      </div>
                                      <input
                                        type="number"
                                        value={method.price}
                                        onChange={(e) => updateZoneMethod(zone.id, method.id, 'price', parseFloat(e.target.value) || 0)}
                                        className="block w-full rounded-md border-0 py-1.5 pl-7 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-600 sm:text-sm sm:leading-6"
                                        min="0"
                                        step="1"
                                        disabled={!method.isActive}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                      FREE
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Free Shipping Threshold */}
                      <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Free Shipping
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Minimum order amount for free shipping
                            </p>
                          </div>
                          <div className="relative w-32 rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">₱</span>
                            </div>
                            <input
                              type="number"
                              value={zone.freeShippingThreshold}
                              onChange={(e) => updateZone(zone.id, 'freeShippingThreshold', parseFloat(e.target.value) || 0)}
                              className="block w-full rounded-md border-0 py-1.5 pl-7 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-600 sm:text-sm sm:leading-6"
                              min="0"
                              step="100"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Zone Actions */}
                      <div className="flex justify-between pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteZone(zone.id);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Zone
                        </button>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditingZone(zone.id);
                            }}
                            className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md ${
                              isDarkMode 
                                ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600' 
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500`}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveZoneChanges(zone.id);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add New Zone */}
              <div className="p-6 mt-6 text-center border border-gray-300 border-dashed rounded-lg dark:border-gray-600">
                <button
                  type="button"
                  onClick={handleAddShippingZone}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-pink-700 bg-pink-100 border border-transparent rounded-md shadow-sm hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  <Plus className="w-5 h-5 mr-2 -ml-1" />
                  Add Shipping Zone
                </button>
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Add a new shipping zone for a specific region or area
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return <SettingsTab isDarkMode={isDarkMode} />;
  };

  const renderFeedback = () => {
    const handleDeleteFeedback = (feedbackId) => {
      // This will be a backend call later. For now, it just updates the UI state.
      setFeedbacks(currentFeedbacks => currentFeedbacks.filter(f => f.id !== feedbackId));
      // You can add a toast notification here for better UX, e.g., toast.success("Feedback deleted!");
    };

    return (
      <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Customer Feedback</h2>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-x-auto`}>
          <table className="w-full text-left">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Customer</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Message</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Received On</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="4" className={`px-6 py-10 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No feedback received yet.
                  </td>
                </tr>
              ) : (
                feedbacks.map((feedback) => (
                  <tr key={feedback.id} className={isDarkMode ? 'hover:bg-gray-700/50' : ''}>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{feedback.name}</div>
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{feedback.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-md whitespace-normal`}>{feedback.message}</p>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(feedback.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteFeedback(feedback.id)}
                        className="flex items-center text-red-600 transition-colors hover:text-red-800"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSubscribers = () => {
    // Sort subscribers based on sortConfig
    const sortedSubscribers = [...subscribers].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    // Request sort for table headers
    const requestSort = (key) => {
      let direction = 'ascending';
      if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      setSortConfig({ key, direction });
    };

    // Render sort direction indicator
    const renderSortIndicator = (key) => {
      if (sortConfig.key !== key) return null;
      return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Newsletter Subscribers</h2>
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {subscribers.length} {subscribers.length === 1 ? 'subscriber' : 'subscribers'}
          </span>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-x-auto`}>
          {isLoadingSubscribers ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-b-2 border-pink-500 rounded-full animate-spin"></div>
            </div>
          ) : subscribers.length === 0 ? (
            <div className={`p-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No subscribers yet. Your newsletter subscribers will appear here.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase cursor-pointer"
                    onClick={() => requestSort('email')}
                  >
                    <span className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Email {renderSortIndicator('email')}
                    </span>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase cursor-pointer"
                    onClick={() => requestSort('subscribedAt')}
                  >
                    <span className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Subscribed On {renderSortIndicator('subscribedAt')}
                    </span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>Status</span>
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {sortedSubscribers.map((subscriber) => (
                  <tr key={subscriber._id} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        <a 
                          href={`mailto:${subscriber.email}`}
                          className={isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-800'}
                        >
                          {subscriber.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(subscriber.subscribedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        subscriber.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {subscriber.isActive ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
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
  
  const SidebarContent = () => (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center flex-shrink-0 h-16 px-4 space-x-2">
            <img
              className="w-auto h-8"
              src={logoSrc}
              alt="Althea's Cro-shet Logo"
            />
            {(!isSidebarCollapsed || sidebarOpen) && (
              <span className={`text-lg font-bold whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Althea's Cro-shet
              </span>
            )}
          </div>
          <div className={`flex-1 flex flex-col overflow-y-auto border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="flex-1 px-2 py-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                // Determine text color classes for icon and label
                const textColorClasses = activeTab === tab.id
                    ? isDarkMode ? 'text-pink-400' : 'text-pink-700'
                    : isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900';

                return (
                  <div key={tab.id} className="relative group"> {/* Added group for hover effects */}
                    <button
                      onClick={() => {
                        setActiveTab(tab.id);
                      }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isSidebarCollapsed && !sidebarOpen ? 'justify-center' : ''
                      } ${
                        activeTab === tab.id
                          ? isDarkMode ? 'bg-gray-900' : 'bg-pink-100' // Background color only
                          : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50' // Background color only
                      }`}
                      title={isSidebarCollapsed ? tab.label : ''}
                    >
                      <Icon className={`h-5 w-5 ${textColorClasses} ${isSidebarCollapsed && !sidebarOpen ? '' : 'mr-3'}`} aria-hidden="true" />
                      {(!isSidebarCollapsed || sidebarOpen) && <span className={textColorClasses}>{tab.label}</span>}
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
  );

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
                <SidebarContent />
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
        <SidebarContent />
      </aside>

      <div className="flex flex-col flex-1 w-0 overflow-y-auto">
        <AdminNavbar 
          showSearch={showSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="relative z-0 flex-1 focus:outline-none">
          {/* Header */}
          <div className="p-4 md:p-8">
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
              {activeTab === "orders" && renderOrders()}
              {activeTab === "products" && <ProductsTab isDarkMode={isDarkMode} Plus={Plus} />}
              {activeTab === "feedback" && renderFeedback()}
              {activeTab === "subscribers" && renderSubscribers()}
              {activeTab === "settings" && renderSettings()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
