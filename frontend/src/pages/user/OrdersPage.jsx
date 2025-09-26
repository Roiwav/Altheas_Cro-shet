import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  Loader2,
  MapPin
} from 'lucide-react';

// Helper function to format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Currency formatter
const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

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

// Order Tracker Component
const OrderTracker = ({ status }) => {
  const steps = [
    { key: 'pending', label: 'Pending', icon: <Clock className="h-5 w-5" /> },
    { key: 'processing', label: 'On the Making', icon: <Package className="h-5 w-5" /> },
    { key: 'shipped', label: 'On the Road', icon: <Truck className="h-5 w-5" /> },
    { key: 'delivered', label: 'Delivered', icon: <CheckCircle className="h-5 w-5" /> },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === status);

  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg my-4">
        <XCircle className="h-6 w-6 text-red-500 mr-2" />
        <p className="text-red-700 dark:text-red-300 font-medium">This order has been cancelled.</p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Keyframes for the animated dots on the tracker line */}
      <style>{`
        @keyframes running-dots {
          from { background-position-x: 0px; }
          to { background-position-x: -40px; }
        }
      `}</style>
      <div className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = currentStepIndex >= index;
          const isLastStep = index === steps.length - 1;
          const isActiveConnector = isCompleted && currentStepIndex > index;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center text-center w-1/4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-pink-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  {step.icon}
                </div>
                <p className={`mt-2 text-xs ${isCompleted ? 'text-gray-800 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{step.label}</p>
              </div>
              {!isLastStep && (
                <div className={`flex-1 h-1 mt-5 transition-colors ${isActiveConnector ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {isActiveConnector && <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 3px)', backgroundSize: '20px 20px', backgroundRepeat: 'repeat-x', backgroundPosition: '0% 50%', animation: 'running-dots 1.5s linear infinite' }} />}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const OrdersPage = () => {
  const { user, token } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleCancelProduct = async (orderId, productId) => {
    if (!window.confirm('Are you sure you want to remove this item from your order?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/orders/${orderId}/product/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel product.');
      }

      // If the backend confirms the order was deleted, remove it from the list. Otherwise, update it.
      if (data.orderDeleted) {
        setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
      } else {
        setOrders(prevOrders => prevOrders.map(order => (order._id === orderId ? data.order : order)));
      }
      toast.success('Item cancelled successfully.');
    } catch (err) {
      console.error('Error cancelling product:', err);
      toast.error(err.message || 'Could not cancel the product.');
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5001/api/orders/myorders', {
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
  }, [user, token]);

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center min-h-screen pt-16 lg:pl-[var(--sidebar-width,5rem)] transition-all duration-300 ease-in-out">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-lg text-gray-600 dark:text-gray-300">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-16 flex items-center justify-center p-4 lg:pl-[var(--sidebar-width,5rem)] transition-all duration-300 ease-in-out">
        <div className="max-w-4xl mx-auto bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-md">
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
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-16 flex items-center justify-center p-4 lg:pl-[var(--sidebar-width,5rem)] transition-all duration-300 ease-in-out">
        <div className="text-center">
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-16 lg:pl-[var(--sidebar-width,5rem)] transition-all duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {/* Since each order now has only one product, we can display it directly */}
                  {order.products?.[0] && (() => {
                    const item = order.products[0];
                    return (
                      <div key={item.productId} className="flex items-start">
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
                              to={`/product/${item.productId}`}
                              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {item.name}
                            </Link>
                            <p className="ml-4">{currencyFormatter.format(item.price * item.quantity)}</p>
                          </div>
                          {item.variation && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Variation: {item.variation}
                            </p>
                          )}
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Qty: {item.quantity} × {currencyFormatter.format(item.price)}
                          </p>
                          <button
                            onClick={() => handleCancelProduct(order._id, item.productId)}
                            className="mt-2 text-xs font-medium text-red-600 hover:text-red-500 hover:underline"
                          >
                            Cancel Item
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Shipping To</h4>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start">
                    <MapPin className="inline-block h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      {order.shippingAddress ? 
                        [order.shippingAddress.line1, order.shippingAddress.line2, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode, order.shippingAddress.country].filter(Boolean).join(', ') :
                        `${order.city}, ${order.region}` /* Fallback for old orders */
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Track Order</h4>
                <OrderTracker status={order.status || 'pending'} />
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-3 sm:mb-0">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Shipping Fee: </span>
                      <span className="text-gray-900 dark:text-white ml-1">
                        {currencyFormatter.format(order.shippingFee || 0)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      <span className="font-medium">Total: </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white ml-1">
                        {currencyFormatter.format(order.total || 0)}
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
