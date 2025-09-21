import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../../context/useUser";
import { useDarkMode } from "../../context/DarkModeContext.jsx";
import Navbar from "../../components/layout/Navbar";

export default function AdminPage() {
  const { user } = useUser();
  const { isDarkMode } = useDarkMode();
  const [metrics, setMetrics] = useState({
    revenue: 0,
    activeCustomers: 0,
    visits: 0,
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: () => <i className={`fas fa-tachometer-alt ${isDarkMode ? 'text-white' : 'text-gray-500'}`}></i> },
    { id: "orders", label: "Orders", icon: () => <i className={`fas fa-shopping-cart ${isDarkMode ? 'text-white' : 'text-gray-500'}`}></i> },
    { id: "products", label: "Products", icon: () => <i className={`fas fa-boxes ${isDarkMode ? 'text-white' : 'text-gray-500'}`}></i> },
    { id: "users", label: "Users", icon: () => <i className={`fas fa-users ${isDarkMode ? 'text-white' : 'text-gray-500'}`}></i> },
    { id: "analytics", label: "Analytics", icon: () => <i className={`fas fa-chart-line ${isDarkMode ? 'text-white' : 'text-gray-500'}`}></i> },
    { id: "settings", label: "Settings", icon: () => <i className={`fas fa-cog ${isDarkMode ? 'text-white' : 'text-gray-500'}`}></i> }
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
    setMetrics({
      revenue: 123456.78,
      activeCustomers: 42,
      visits: 1024,
    });
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
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

  const renderDashboard = () => {
    return (
      <div className="space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500">Revenue</h3>
            <p className="mt-2 text-2xl font-bold text-green-600">
              ₱{metrics.revenue.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500">Active Customers</h3>
            <p className="mt-2 text-2xl font-bold text-blue-600">{metrics.activeCustomers}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500">Visits</h3>
              <p className="mt-2 text-2xl font-bold text-purple-600">{metrics.visits}</p>
            </div>
            <a href="/" className="text-sm text-pink-500 hover:text-pink-700">
              Visit Website →
            </a>
          </div>
        </div>

        {/* Orders Table */}
        <div className="mt-12 bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-sm font-medium">Order ID</th>
                <th className="px-6 py-3 text-sm font-medium">Customer</th>
                <th className="px-6 py-3 text-sm font-medium">Product</th>
                <th className="px-6 py-3 text-sm font-medium">Variation</th>
                <th className="px-6 py-3 text-sm font-medium">Quantity</th>
                <th className="px-6 py-3 text-sm font-medium">Region</th>
                <th className="px-6 py-3 text-sm font-medium">City</th>
                <th className="px-6 py-3 text-sm font-medium">Shipping Fee</th>
                <th className="px-6 py-3 text-sm font-medium">Total</th>
                <th className="px-6 py-3 text-sm font-medium">Order Date</th>
                <th className="px-6 py-3 text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-4 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-6 py-4">{o.id}</td>
                  <td className="px-6 py-4">{o.fullname}</td>
                  <td className="px-6 py-4">{o.product_name}</td>
                  <td className="px-6 py-4">{o.variation}</td>
                  <td className="px-6 py-4">{o.quantity}</td>
                  <td className="px-6 py-4">{o.region}</td>
                  <td className="px-6 py-4">{o.city}</td>
                  <td className="px-6 py-4">₱{parseFloat(o.shipping_fee).toLocaleString()}</td>
                  <td className="px-6 py-4">₱{parseFloat(o.total_price).toLocaleString()}</td>
                  <td className="px-6 py-4">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 capitalize">{o.status}</td>
                  <td className="px-6 py-4 space-x-2">
                    {o.status === "pending" ? (
                      <>
                        <button
                          onClick={() => updateOrderStatus(o.id, "accepted")}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateOrderStatus(o.id, "rejected")}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    return (
      <div className="space-y-8">
        {/* Orders Table */}
        <div className="mt-12 bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-sm font-medium">Order ID</th>
                <th className="px-6 py-3 text-sm font-medium">Customer</th>
                <th className="px-6 py-3 text-sm font-medium">Product</th>
                <th className="px-6 py-3 text-sm font-medium">Variation</th>
                <th className="px-6 py-3 text-sm font-medium">Quantity</th>
                <th className="px-6 py-3 text-sm font-medium">Region</th>
                <th className="px-6 py-3 text-sm font-medium">City</th>
                <th className="px-6 py-3 text-sm font-medium">Shipping Fee</th>
                <th className="px-6 py-3 text-sm font-medium">Total</th>
                <th className="px-6 py-3 text-sm font-medium">Order Date</th>
                <th className="px-6 py-3 text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-4 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-6 py-4">{o.id}</td>
                  <td className="px-6 py-4">{o.fullname}</td>
                  <td className="px-6 py-4">{o.product_name}</td>
                  <td className="px-6 py-4">{o.variation}</td>
                  <td className="px-6 py-4">{o.quantity}</td>
                  <td className="px-6 py-4">{o.region}</td>
                  <td className="px-6 py-4">{o.city}</td>
                  <td className="px-6 py-4">₱{parseFloat(o.shipping_fee).toLocaleString()}</td>
                  <td className="px-6 py-4">₱{parseFloat(o.total_price).toLocaleString()}</td>
                  <td className="px-6 py-4">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 capitalize">{o.status}</td>
                  <td className="px-6 py-4 space-x-2">
                    {o.status === "pending" ? (
                      <>
                        <button
                          onClick={() => updateOrderStatus(o.id, "accepted")}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateOrderStatus(o.id, "rejected")}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProducts = () => {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Products</h2>
        <p className="text-sm text-gray-600">Coming soon...</p>
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Users</h2>
        <p className="text-sm text-gray-600">Coming soon...</p>
      </div>
    );
  };

  const renderAnalytics = () => {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-sm text-gray-600">Coming soon...</p>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-8">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Settings</h3>
          <div className="space-y-6">
            <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg border p-4`}>
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
            
            <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg border p-4`}>
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

  return (
    <>
      <div className="fixed top-0 w-full z-50">
        <Navbar cartCount={0} />
      </div>

      <main className={`pt-24 px-4 md:px-16 min-h-screen transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Admin Dashboard</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Welcome back, {user?.name || 'Admin'}! Here's what's happening with your store.
            </p>
          </div>
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className={`flex flex-wrap items-center gap-2 mb-8 p-1 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? `${isDarkMode ? 'bg-gray-700 text-blue-400' : 'bg-white text-blue-600'} shadow-sm`
                    : `${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "orders" && renderOrders()}
          {activeTab === "products" && renderProducts()}
          {activeTab === "users" && renderUsers()}
          {activeTab === "analytics" && renderAnalytics()}
          {activeTab === "settings" && renderSettings()}
        </div>
      </main>
    </>
  );
}
