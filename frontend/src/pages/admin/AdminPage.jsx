import React, { useEffect, useState, useMemo, Fragment } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../../context/useUser";
import AdminNavbar from "../../components/admin/AdminNavbar.jsx"
import { useDarkMode } from "../../context/DarkModeContext.jsx";
import { Search, ArrowUp, ArrowDown, X, ChevronDown, Package, Truck, CheckCircle, XCircle, Trash2 } from "lucide-react";
import logoSrc from '../../assets/images/icons/logo althea.jpg'; // Import the logo
import { Dialog, Transition, Menu } from '@headlessui/react';

export default function AdminPage() {
  const { isDarkMode } = useDarkMode();
  const { user } = useUser();
  const [metrics, setMetrics] = useState({
    revenue: 0,
    incomingOrders: 0,
    shippedProducts: 0,
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items per page
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [feedbacks, setFeedbacks] = useState([
    { id: 1, name: 'Jane Doe', email: 'jane.d@example.com', message: 'Absolutely love the crochet flowers! The quality is amazing and they look beautiful in my living room.', created_at: '2023-10-26T10:00:00Z' },
    { id: 2, name: 'John Smith', email: 'john.s@example.com', message: 'Great customer service and fast shipping. The packaging was also very lovely. Will definitely buy again!', created_at: '2023-10-25T14:30:00Z' },
    { id: 3, name: 'Emily White', email: 'emily.w@example.com', message: 'The sunflower is so cheerful and well-made. It brightens up my desk.', created_at: '2023-10-25T11:20:00Z' },
  ]);
  const [subscribers, setSubscribers] = useState([
    { id: 1, email: 'subscriber1@example.com', subscribed_at: '2023-10-24T09:00:00Z' },
    { id: 2, email: 'subscriber2@example.com', subscribed_at: '2023-10-23T18:45:00Z' },
    { id: 3, email: 'another.fan@example.com', subscribed_at: '2023-10-22T12:00:00Z' },
  ]);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'dashboard';
  });
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: () => <i className="fas fa-tachometer-alt text-gray-500"></i> },
    { id: "orders", label: "Orders", icon: () => <i className="fas fa-shopping-cart text-gray-500"></i> },
    { id: "products", label: "Products", icon: () => <i className="fas fa-boxes text-gray-500"></i> },
    { id: "users", label: "Users", icon: () => <i className="fas fa-users text-gray-500"></i> },
    { id: "feedback", label: "Feedback", icon: () => <i className="fas fa-comment-dots text-gray-500"></i> },
    { id: "subscribers", label: "Subscribers", icon: () => <i className="fas fa-envelope-open-text text-gray-500"></i> },
    { id: "settings", label: "Settings", icon: () => <i className="fas fa-cog text-gray-500"></i> },
  ];

  // Fetch orders from backend
  const fetchOrders = () => {
    setLoading(true);
    fetch("http://localhost/croshet_db/get-order.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.orders) {
          setOrders(data.orders);
        } else {
          console.error("Invalid response structure:", data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      });
  };

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

  useEffect(() => {
    fetchOrders();
  }, []);

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  // Reset to first page when sorting or filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig]);

  if (user?.role !== "admin") {
    return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  }

  // Update order status via backend API
  const updateOrderStatus = (orderId, newStatus) => {
    const formData = new FormData();
    formData.append("order_id", orderId);
    formData.append("status", newStatus);

    fetch("http://localhost/my-backend/update-order.php", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          fetchOrders(); // Refresh after update
        } else {
          alert("Failed to update order: " + data.message);
        }
      })
      .catch(() => {
        alert("Error updating order status.");
      });
  };

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      order.fullname.toLowerCase().includes(query) ||
      order.product_name.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  });

  // Sort orders based on sortConfig
  const sortedAndFilteredOrders = useMemo(() => {
    let sortableItems = [...filteredOrders];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
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
    }
    return sortableItems;
  }, [filteredOrders, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Paginate orders
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
      preparing: isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800',
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
    return (
      <div className="space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenue</h3>
            <p className={`mt-2 text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              ₱{metrics.revenue.toLocaleString()}
            </p>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Incoming Orders</h3>
            <p className={`mt-2 text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{metrics.incomingOrders}</p>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Products Shipped</h3>
            <p className={`mt-2 text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{metrics.shippedProducts}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} mt-12 rounded-xl shadow overflow-x-auto`}>
          <table className="w-full text-left">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>{[
                  { key: 'id', label: 'Order ID' },
                  { key: 'fullname', label: 'Customer' },
                  { key: 'product_name', label: 'Product' },
                  { key: 'variation', label: 'Variation' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: 'region', label: 'Region' },
                  { key: 'city', label: 'City' },
                  { key: 'shipping_fee', label: 'Shipping Fee' },
                  { key: 'total_price', label: 'Total' },
                  { key: 'created_at', label: 'Order Date' },
                  { key: 'status', label: 'Status' },
                  { key: null, label: 'Actions' },
                ].map(col => (
                  <th key={col.key} className="px-6 py-3 text-sm font-medium">
                    {col.key ? (
                      <button onClick={() => requestSort(col.key)} className={`flex items-center space-x-1 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                        <span className="whitespace-nowrap">{col.label}</span>
                        {sortConfig.key === col.key && (
                          sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </th>
                ))}</tr>
            </thead>
            <tbody className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={12} className={`px-6 py-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {searchQuery ? 'No orders match your search.' : 'No orders found.'}
                  </td>
                </tr>
              )}
              {paginatedOrders.map((o) => (
                <tr key={o.id} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.id}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.fullname}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.product_name}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.variation}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.quantity}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.region}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.city}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>₱{parseFloat(o.shipping_fee).toLocaleString()}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>₱{parseFloat(o.total_price).toLocaleString()}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize"><StatusBadge status={o.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{renderActions(o)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && renderPagination()}
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    return (
      <div className="space-y-8">
        {/* Orders Table */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} mt-12 rounded-xl shadow overflow-x-auto`}>
          <table className="w-full text-left">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>{[
                  { key: 'id', label: 'Order ID' },
                  { key: 'fullname', label: 'Customer' },
                  { key: 'product_name', label: 'Product' },
                  { key: 'variation', label: 'Variation' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: 'region', label: 'Region' },
                  { key: 'city', label: 'City' },
                  { key: 'shipping_fee', label: 'Shipping Fee' },
                  { key: 'total_price', label: 'Total' },
                  { key: 'created_at', label: 'Order Date' },
                  { key: 'status', label: 'Status' },
                  { key: null, label: 'Actions' },
                ].map(col => (
                  <th key={col.key} className="px-6 py-3 text-sm font-medium">
                    {col.key ? (
                      <button onClick={() => requestSort(col.key)} className={`flex items-center space-x-1 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                        <span className="whitespace-nowrap">{col.label}</span>
                        {sortConfig.key === col.key && (
                          sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </th>
                ))}</tr>
            </thead>
            <tbody className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={12} className={`px-6 py-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {searchQuery ? 'No orders match your search.' : 'No orders found.'}
                  </td>
                </tr>
              )}
              {paginatedOrders.map((o) => (
                <tr key={o.id} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.id}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.fullname}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.product_name}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.variation}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.quantity}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.region}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.city}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>₱{parseFloat(o.shipping_fee).toLocaleString()}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>₱{parseFloat(o.total_price).toLocaleString()}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize"><StatusBadge status={o.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{renderActions(o)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && renderPagination()}
        </div>
      </div>
    );
  };

  const renderProducts = () => {
    return (
      <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Products</h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Coming soon...</p>
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Users</h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Coming soon...</p>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-8">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Settings</h3>
          <div className="space-y-6">
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Site Configuration</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Maintenance Mode</span>
                  <button className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition">
                    Disabled
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Registration</span>
                  <button className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition">
                    Enabled
                  </button>
                </div>
              </div>
            </div>
            
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Payment Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cash on Delivery</span>
                  <button className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition">
                    Enabled
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Online Payment</span>
                  <button className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition">
                    Disabled
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{feedback.name}</div>
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{feedback.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-md whitespace-normal`}>{feedback.message}</p>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(feedback.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteFeedback(feedback.id)}
                        className="text-red-600 hover:text-red-800 transition-colors flex items-center"
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

  const renderSubscribers = () => (
    <div className="space-y-8">
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Newsletter Subscribers</h2>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-hidden`}>
        <ul className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {subscribers.length === 0 ? (
            <li className={`px-6 py-10 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No subscribers yet.</li>
          ) : (
            subscribers.map(subscriber => (
              <li key={subscriber.id} className={`px-6 py-4 flex items-center justify-between ${isDarkMode ? 'hover:bg-gray-700/50' : ''}`}>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{subscriber.email}</span>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Subscribed on: {new Date(subscriber.subscribed_at).toLocaleDateString()}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );

  const renderPagination = () => (
    <div className={`flex items-center justify-between mt-4 px-6 pb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 text-sm font-medium border rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 text-sm font-medium border rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
        >
          Next
        </button>
      </div>
    </div>
  );

  const isSidebarCollapsed = !isSidebarHovered;
  
  const SidebarContent = () => (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
           <div className="flex items-center h-16 flex-shrink-0 px-4 space-x-2">
            <img
              className="h-8 w-auto"
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
                return (
                  <div key={tab.id} className="relative">
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isSidebarCollapsed && !sidebarOpen ? 'justify-center' : ''
                      } ${
                        activeTab === tab.id
                          ? isDarkMode ? 'bg-gray-900 text-pink-400' : 'bg-pink-100 text-pink-700'
                          : isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isSidebarCollapsed ? tab.label : ''}
                    >
                      <Icon className={`h-5 w-5 ${isSidebarCollapsed && !sidebarOpen ? '' : 'mr-3'}`} />
                      {(!isSidebarCollapsed || sidebarOpen) && <span>{tab.label}</span>}
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

          <div className="fixed inset-0 flex z-40">
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
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
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
        <main className="flex-1 relative z-0 focus:outline-none">
          {/* Header */}
          <div className="p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className={`text-2xl font-bold capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activeTab}</h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Welcome back, {user?.name || 'Admin'}!
              </p>
            </div>
            {loading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</span>
              </div>
            )}
            </div>

            {/* Search Bar for Mobile */}
            {showSearch && (
              <div className="relative mb-4 md:hidden">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Search className="h-5 w-5 text-gray-400" />
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
              {activeTab === "products" && renderProducts()}
              {activeTab === "users" && renderUsers()}
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
