import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Package, Heart, Home, User, ShoppingBag } from 'lucide-react';

function UserDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { 
      title: 'Orders', 
      value: '5', 
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
      value: '2', 
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-pink-600 dark:text-pink-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
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
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <ShoppingBag className="w-5 h-5 mr-2 text-pink-600 dark:text-pink-400" />
              Recent Orders
            </h2>
          </div>
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No orders yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link 
              to="/shop" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors duration-200"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;