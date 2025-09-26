import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Package, Heart, Home, User, ShoppingBag, XCircle } from 'lucide-react';
import { useUser } from '../../context/useUser';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Currency formatter
const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function UserDashboard() {
  const { user, token } = useUser();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('http://localhost:5001/api/orders/myorders', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch orders.');
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [user, token]);

  const stats = [
    { 
      title: 'Orders', 
      value: orders.length.toString(),
      icon: <Package className="w-6 h-6" />, 
      color: 'pink', 
      link: '/orders' 
    },
    { 
      title: 'Wishlist', 
      value: '12', 
      icon: <Heart className="w-6 h-6" />, 
      color: 'purple', 
      link: '/wishlist' 
    },
    { 
      title: 'Addresses', 
      value: '', 
      icon: <Home className="w-6 h-6" />, 
      color: 'blue', 
      link: '/settings?tab=addresses' 
    },
    { 
      title: 'Account', 
      value: 'Active', 
      icon: <User className="w-6 h-6" />, 
      color: 'green', 
      link: '/settings?tab=profile' 
    }
  ];
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 text-pink-600 dark:text-pink-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md mx-auto bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-md text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-red-800 dark:text-red-200">Could not load dashboard data</h3>
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
              className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700`}
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
                    stat.color === 'pink' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' :
                    stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                    stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  }`}
                >
                  {stat.icon}
                </div>
              </div>
              <Link 
                to={stat.link} 
                className={`mt-4 inline-flex items-center text-sm font-medium ${
                  stat.color === 'pink' ? 'text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300' :
                  stat.color === 'purple' ? 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300' :
                  stat.color === 'blue' ? 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300' :
                  'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
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
              <ShoppingBag className="w-5 h-5 mr-2 text-pink-600 dark:text-pink-400" />
              Recent Orders
            </h2>
            {orders.length > 0 && (
              <Link to="/orders" className="text-sm font-medium text-pink-600 hover:underline">
                View All
              </Link>
            )}
          </div>
          {orders.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {orders.slice(0, 3).map(order => (
                <li key={order._id}>
                  <Link to="/orders" className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-pink-600 truncate">
                        Order #{order._id.substring(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {order.products.length} item(s)
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-900 dark:text-white sm:mt-0 font-semibold">
                        <p>{currencyFormatter.format(order.total)}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No recent orders</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                When you place an order, it will appear here.
              </p>
              <Link to="/shop" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors duration-200">
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;