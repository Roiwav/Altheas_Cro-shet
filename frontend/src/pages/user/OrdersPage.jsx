import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/useUser';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Package, 
  Plus,
  CreditCard,
  Calendar,
  PackageOpen,
  Loader2
} from 'lucide-react';

// Helper function to format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { 
      text: 'Pending', 
      icon: <Clock className="h-4 w-4" />, 
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-800 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    processing: { 
      text: 'Processing', 
      icon: <Package className="h-4 w-4" />, 
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-800 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
    shipped: { 
      text: 'Shipped', 
      icon: <Truck className="h-4 w-4" />, 
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-800 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800'
    },
    delivered: { 
      text: 'Delivered', 
      icon: <CheckCircle className="h-4 w-4" />, 
      bg: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    },
    cancelled: { 
      text: 'Cancelled', 
      icon: <XCircle className="h-4 w-4" />, 
      bg: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-800 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800'
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.textColor} border ${config.border}`}>
      {config.icon}
      <span className="ml-1">{config.text}</span>
    </span>
  );
};

const OrdersPage = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/orders/myorders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-lg text-gray-600 dark:text-gray-300">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading orders</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
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
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <ShoppingBag className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No orders yet</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            You haven't placed any orders yet. Start shopping to see your orders here.
          </p>
          <div className="mt-6">
            <Link
              to="/shop"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order History</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage your recent orders
          </p>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id || order.id} className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Order #{order.orderNumber || order._id?.substring(0, 8) || 'N/A'}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <span>Placed on {formatDate(order.createdAt || order.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <StatusBadge status={order.status || 'pending'} />
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {order.orderItems?.map((item, itemIdx) => (
                    <div key={item._id || itemIdx} className="flex items-start">
                      <div className="flex-shrink-0 h-20 w-20 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img
                          src={item.image || '/images/placeholder-product.jpg'}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/placeholder-product.jpg';
                          }}
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                          <Link 
                            to={`/product/${item.product || item._id}`}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        {item.color || item.size ? (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {item.color && <span>Color: {item.color}</span>}
                            {item.size && <span className="ml-2">Size: {item.size}</span>}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-3 sm:mb-0">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Total: </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white ml-1">
                        ${order.totalPrice?.toFixed(2) || '0.00'}
                      </span>
                      {order.paymentMethod && (
                        <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <CreditCard className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          <span>Paid with {order.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <Link
                      to={`/orders/${order._id || order.id}`}
                      className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PackageOpen className="-ml-1 mr-2 h-4 w-4" />
                      Order Details
                    </Link>
                    <Link
                      to="/shop"
                      className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ShoppingBag className="-ml-1 mr-2 h-4 w-4" />
                      Shop Again
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
