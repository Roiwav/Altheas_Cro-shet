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
        const response = await fetch(`https://altheascroshetbackend.vercel.app/api/v1/orders/myorders`, {
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 mb-4 text-pink-600 dark:text-pink-400 animate-spin" />
        <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-red-800 dark:text-red-200">
            Could not load dashboard data
          </h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-800 dark:text-gray-200">
            Welcome Back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your account
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-5 transition-shadow duration-300 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl hover:shadow-md dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">
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
        <div className="overflow-hidden transition-shadow duration-300 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl hover:shadow-md dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
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
                        <p className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">{n.title}</p>
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
              <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">No notifications</h3>
              <p className="text-gray-500 dark:text-gray-400">You're all caught up.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
