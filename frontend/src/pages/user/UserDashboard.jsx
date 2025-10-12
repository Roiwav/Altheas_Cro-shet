import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Package, Heart, Home, User, Bell, XCircle } from 'lucide-react';
import { useUser } from '../../context/useUser';
import { useWishlistCount } from '../../context/useWishlistCount.js';
import { SERVER_BASE_URL } from '../../utils/product.js';
import useNotifications from '../../hooks/useNotifications';
/**
 * Formats a date string into a more readable format (e.g., "September 15, 2024").
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date string, or an empty string if the input is invalid.
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Currency formatter
const CURRENCY_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
});

/**
 * Renders the main dashboard for a logged-in user, displaying key stats and recent orders.
 */
function UserDashboard() {
  const { user, token } = useUser();
  const { wishlistCount } = useWishlistCount();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const { notifications, unreadCount, loading: notifLoading, markAsRead, markAllAsRead } = useNotifications();

  /**
   * Fetches the user's orders from the backend on component mount
   * or when the user/token changes.
   */
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`${SERVER_BASE_URL}/api/v1/orders/myorders`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const orders = Array.isArray(data.orders) ? data.orders : [];
        setOrders(orders);
        setHasFetched(true);
        setHasFetched(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [user, token]);

  // Configuration for the statistics cards displayed on the dashboard.
  const stats = [
    {
      title: 'Orders',
      value: hasFetched ? orders.length.toString() : '0',
      icon: <Package className="w-6 h-6" />,
      color: 'pink',
      link: '/orders',
    },
    {
      title: 'Wishlist',
      value: String(wishlistCount || 0),
      icon: <Heart className="w-6 h-6" />,
      color: 'purple',
      link: '/wishlist',
    },
    {
      title: 'Addresses',
      value: '',
      icon: <Home className="w-6 h-6" />,
      color: 'blue',
      link: '/settings?tab=addresses',
    },
    {
      title: 'Account',
      value: 'Active',
      icon: <User className="w-6 h-6" />,
      color: 'green',
      link: '/settings?tab=profile',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Loader2 className="w-12 h-12 text-pink-600 dark:text-pink-400 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-red-800 dark:text-red-200">
            Could not load dashboard data
          </h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 lg:pl-[calc(var(--sidebar-width,5rem)+1.5rem)] transition-[padding-left] duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your account
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full ${
                    stat.color === 'pink'
                      ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                      : stat.color === 'purple'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      : stat.color === 'blue'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  }`}
                >
                  {stat.icon}
                </div>
              </div>
              <Link
                to={stat.link}
                className={`mt-4 inline-flex items-center text-sm font-medium ${
                  stat.color === 'pink'
                    ? 'text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300'
                    : stat.color === 'purple'
                    ? 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300'
                    : stat.color === 'blue'
                    ? 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                    : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                } transition-colors duration-200`}
              >
                View {stat.title.toLowerCase()}
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-pink-600 dark:text-pink-400" />
              Notifications
            </h2>
            <div className="flex items-center gap-3">
              {notifLoading && <Loader2 className="w-4 h-4 text-pink-600 animate-spin" />}
              {notifications.length > 0 && unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-sm font-medium text-pink-600 hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
          </div>
          {notifications.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.slice(0, 8).map((n) => (
                <li key={n._id}>
                  <div className="block p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-start gap-3">
                      <div className={`${n.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-pink-500'} mt-1 w-2 h-2 rounded-full`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{n.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{n.message}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatDate(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <button onClick={() => markAsRead(n._id)} className="text-xs text-pink-600 hover:underline whitespace-nowrap">Read</button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No notifications</h3>
              <p className="text-gray-500 dark:text-gray-400">You're all caught up.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
