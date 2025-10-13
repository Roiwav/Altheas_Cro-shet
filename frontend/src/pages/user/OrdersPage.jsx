import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/useUser';
import CancelItemModal from '../../components/orders/CancelItemModal';

import { getMediaUrl, getProductImageSrc, SERVER_BASE_URL } from '../../utils/product.js';
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
  MapPin,
  Loader2,
  Eye,
  X,
  AlertCircle,
  User
} from 'lucide-react';

// Inline fallback for receipts
const PLACEHOLDER_RECEIPT =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>Receipt not available</text></svg>";


/**
 * Formats a date string into a more readable format (e.g., "Sep 15, 2024").
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date string.
 */
const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { 
  year: 'numeric', 
  month: 'short', 
  day: 'numeric' 
});
const currencyFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

/**
 * A component that displays a styled badge for a given order status.
 * @param {object} props - The component props.
 * @param {string} props.status - The status of the order (e.g., 'pending', 'shipped').
 */
const StatusBadge = ({ status }) => {
  const statusLower = (status || 'pending').toLowerCase();
  const config = {
    pending: { text: 'Pending', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', darkBg: 'dark:bg-yellow-900/20', darkText: 'dark:text-yellow-400' },
    processing: { text: 'Processing', bgColor: 'bg-blue-100', textColor: 'text-blue-800', darkBg: 'dark:bg-blue-900/20', darkText: 'dark:text-blue-400' },
    shipped: { text: 'Shipped', bgColor: 'bg-purple-100', textColor: 'text-purple-800', darkBg: 'dark:bg-purple-900/20', darkText: 'dark:text-purple-400' },
    delivered: { text: 'Delivered', bgColor: 'bg-green-100', textColor: 'text-green-800', darkBg: 'dark:bg-green-900/20', darkText: 'dark:text-green-400' },
    cancelled: { text: 'Cancelled', bgColor: 'bg-red-100', textColor: 'text-red-800', darkBg: 'dark:bg-red-900/20', darkText: 'dark:text-red-400' },
    rejected: { text: 'Rejected', bgColor: 'bg-red-100', textColor: 'text-red-800', darkBg: 'dark:bg-red-900/20', darkText: 'dark:text-red-400' },
  }[statusLower] || { text: 'Pending', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', darkBg: 'dark:bg-yellow-900/20', darkText: 'dark:text-yellow-400' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${config.darkBg} ${config.darkText}`}>
      {config.text}
    </span>
  );
};

/**
 * A visual component to track the progress of an order through its various stages.
 * @param {object} props - The component props.
 * @param {string} props.status - The current status of the order.
 */
const OrderTracker = ({ status }) => {
  const steps = [
    { key: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" /> },
    { key: 'processing', label: 'Processing', icon: <Package className="w-4 h-4" /> },
    { key: 'shipped', label: 'Shipped', icon: <Truck className="w-4 h-4" /> },
    { key: 'delivered', label: 'Delivered', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === (status || 'pending').toLowerCase());

  if (['cancelled', 'rejected'].includes((status || '').toLowerCase())) {
    return (
      <div className="flex items-center justify-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
        <XCircle className="flex-shrink-0 w-5 h-5 mr-2 text-red-500" />
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          Order {status?.toLowerCase() === 'rejected' ? 'rejected' : 'cancelled'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
              index <= currentStepIndex 
                ? 'bg-pink-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {step.icon}
            </div>
            <span className={`text-xs text-center leading-tight ${
              index <= currentStepIndex 
                ? 'font-semibold text-gray-900 dark:text-white' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${
              index < currentStepIndex 
                ? 'bg-pink-600' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Displays the status of a refund associated with an order.
 * @param {object} props - The component props.
 * @param {object} props.order - The order object, which may contain refund information.
 */
const RefundStatus = ({ order }) => {
  if (!order.refundStatus || order.refundStatus === 'Not Required') return null;

  const refundStatusConfig = {
    'Pending': { color: 'yellow', text: 'Refund Pending', icon: Clock },
    'Processing': { color: 'blue', text: 'Processing Refund', icon: CreditCard },
    'Completed': { color: 'green', text: 'Refund Completed', icon: CheckCircle },
    'Failed': { color: 'red', text: 'Refund Failed', icon: XCircle },
  };

  const config = refundStatusConfig[order.refundStatus] || refundStatusConfig['Pending'];
  const Icon = config.icon;

  return (
    <div className={`p-3 rounded-lg border mt-3 ${
      config.color === 'yellow' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
      config.color === 'blue' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
      config.color === 'green' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
      'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    }`}>
      <div className="flex items-start space-x-3">
        <div className={`p-1 rounded-full ${
          config.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
          config.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
          config.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
          'bg-red-100 dark:bg-red-900/30'
        }`}>
          <Icon className={`w-4 h-4 ${
            config.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
            config.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
            config.color === 'green' ? 'text-green-600 dark:text-green-400' :
            'text-red-600 dark:text-red-400'
          }`} />
        </div>
        <div className="flex-1">
          <h4 className={`font-medium ${
            config.color === 'yellow' ? 'text-yellow-800 dark:text-yellow-200' :
            config.color === 'blue' ? 'text-blue-800 dark:text-blue-200' :
            config.color === 'green' ? 'text-green-800 dark:text-green-200' :
            'text-red-800 dark:text-red-200'
          }`}>
            {config.text}
          </h4>
          <div className={`text-sm mt-1 ${
            config.color === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' :
            config.color === 'blue' ? 'text-blue-700 dark:text-blue-300' :
            config.color === 'green' ? 'text-green-700 dark:text-green-300' :
            'text-red-700 dark:text-red-300'
          }`}>
            {order.refundStatus === 'Processing' && (
              <p>
                Refund of {currencyFormatter.format(order.refundAmount || 0)} is being processed. 
                Expected completion: {order.refundEstimatedDays || 7} business days.
              </p>
            )}
            {order.refundStatus === 'Completed' && order.refundProcessedAt && (
              <p>
                Refund of {currencyFormatter.format(order.refundAmount || 0)} was completed on {formatDate(order.refundProcessedAt)}.
              </p>
            )}
            {order.refundStatus === 'Pending' && (
              <p>Your refund is being reviewed and will be processed soon.</p>
            )}
            {order.refundStatus === 'Failed' && (
              <p>There was an issue processing your refund. Please contact support.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * A full-screen modal to display a larger view of the payment proof image.
 * @param {object} props - The component props.
 * @param {string|null} props.imageUrl - The URL of the image to display.
 * @param {function} props.onClose - Callback function to close the modal.
 */
const PaymentProofModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" onClick={onClose}>
      <div className="relative max-w-4xl max-h-full">
        <button 
          onClick={onClose}
          className="absolute right-0 z-10 text-white -top-10 hover:text-gray-300"
        >
          <X className="w-8 h-8" />
        </button>
        <img
          src={imageUrl}
          alt="Payment Proof"
          className="object-contain max-w-full max-h-full rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

/**
 * Renders the "My Orders" page for a logged-in user.
 * It fetches and displays a list of the user's past and current orders.
 */
const OrdersPage = () => {
  const { user, token } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cancellationItem, setCancellationItem] = useState(null);

  /**
   * Fetches the user's orders from the backend.
   * Wrapped in useCallback to prevent re-creation on every render.
   */
  const fetchOrders = useCallback(async () => {
    if (!user || !token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://altheascroshetbackend.vercel.app/api/v1/orders/myorders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Sets the state to show the cancellation confirmation modal for a specific item.
   * @param {string} orderId - The ID of the order containing the item.
   * @param {string} productId - The ID of the product to be cancelled.
   * @param {string} productName - The name of the product to be cancelled.
   */
  const showCancelConfirmation = (orderId, productId, productName) => {
    setCancellationItem({ orderId, productId, productName });
  };

  /**
   * Handles the actual cancellation of a product within an order after user confirmation.
   * @param {string} reason - The reason for the cancellation provided by the user.
   */
  const handleCancelProduct = async (reason) => {
    if (!cancellationItem) return;
    
    const { orderId, productId } = cancellationItem;
    
    try {
      const res = await fetch(`https://altheascroshetbackend.vercel.app/api/orders/${orderId}/product/${productId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancellationReason: reason })
      });

      if (!res.ok) {
        let errorMessage = 'Failed to cancel product';
        
        // Try to parse a more specific error message from the backend response.
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
          if (res.status === 404) {
            errorMessage = 'This feature is not available yet';
          } else {
            errorMessage = `Server error (${res.status})`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // If the entire order was deleted (e.g., it was the last item), remove it from the list.
      if (data.orderDeleted) {
        setOrders(prev => prev.filter(o => o._id !== orderId));
        toast.success('Item cancelled and order removed.');
      } else {
        setOrders(prev => prev.map(o => (o._id === orderId ? data.order : o)));
        toast.success('Item cancelled successfully.');
      }
      
      // Close the cancellation modal.
      setCancellationItem(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Could not cancel the product.');
    }
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 pt-20">
        <div className="w-full max-w-md p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center mb-4">
            <XCircle className="w-5 h-5 mr-2 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button 
            onClick={fetchOrders} 
            className="w-full px-4 py-2 text-white transition-colors bg-red-600 rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20">
        <ShoppingBag className="w-16 h-16 mb-4 text-gray-400" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">No orders yet</h2>
        <p className="mb-6 text-center text-gray-500 dark:text-gray-400">You haven't placed any orders yet.</p>
        <Link 
          to="/shop" 
          className="inline-flex items-center px-6 py-3 text-white transition-colors bg-pink-600 rounded-lg hover:bg-pink-700"
        >
          <Plus className="w-5 h-5 mr-2" /> 
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 bg-gray-50 dark:bg-gray-900 md:ml-[var(--sidebar-width,5rem)] transition-all duration-300 ease-in-out">
      <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order History</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Track and manage your orders</p>
        </div>

        <div className="space-y-6">
          {orders.map(order => (
            <div key={order._id} className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
              {/* Order Header */}
              <div className="px-4 py-4 border-b border-gray-200 sm:px-6 dark:border-gray-700">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order #{order.orderNumber || order._id?.substring(0,8)}
                    </h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" /> 
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Status Message Section */}
              {order.statusMessage && (
                <div className={`px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 ${
                  order.status === 'rejected' || order.status === 'cancelled' 
                    ? 'bg-red-50 dark:bg-red-900/20' 
                    : order.status === 'delivered' 
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-blue-50 dark:bg-blue-900/20'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${
                      order.status === 'rejected' || order.status === 'cancelled' 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : order.status === 'delivered' 
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {order.status === 'rejected' || order.status === 'cancelled' ? (
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      ) : order.status === 'delivered' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${
                        order.status === 'rejected' || order.status === 'cancelled' 
                          ? 'text-red-800 dark:text-red-200' 
                          : order.status === 'delivered' 
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-blue-800 dark:text-blue-200'
                      }`}>
                        {order.statusMessage}
                      </p>
                      {order.statusUpdatedAt && (
                        <p className={`text-xs mt-1 ${
                          order.status === 'rejected' || order.status === 'cancelled' 
                            ? 'text-red-600 dark:text-red-400' 
                            : order.status === 'delivered' 
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          Updated {formatDate(order.statusUpdatedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Refund Status Sub-component */}
                  <RefundStatus order={order} />
                </div>
              )}

              {/* Order Items */}
              <div className="px-4 py-4 sm:px-6">
                <div className="space-y-4">
                  {order.products?.map(item => (
                    <div key={item.productId || item._id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={getProductImageSrc(item.image)}
                          alt={item.name}
                          className="object-cover w-20 h-20 border border-gray-200 rounded-xl dark:border-gray-600"
                        />

                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <Link 
                              to={`/product/${item.productId || item._id}`} 
                              className="font-medium text-gray-900 transition-colors dark:text-white hover:text-pink-600 dark:hover:text-pink-400 line-clamp-2"
                            >
                              {item.name}
                            </Link>
                            <div className="mt-1 space-y-1">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Qty: {item.quantity} &times; {currencyFormatter.format(item.price)}
                              </p>
                              {item.color && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Color: {item.color}</p>
                              )}
                              {item.variation && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Variation: {item.variation}</p>
                              )}
                            </div>
                            {order.status === 'Pending' && (
                              <button 
                                onClick={() => showCancelConfirmation(
                                  order._id, 
                                  item.productId || item._id,
                                  item.name
                                )} 
                                className="mt-2 text-xs text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:underline"
                              >
                                Cancel Item
                              </button>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {currencyFormatter.format(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Proof */}
              {order.paymentProofUrl && (
                <div className="px-4 py-4 border-t border-gray-200 sm:px-6 dark:border-gray-700">
                  <h4 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Payment Proof</h4>
                  <div className="relative inline-block">
                    <img
                      src={getMediaUrl(order.paymentProofUrl)}
                      alt="Payment Proof"
                      className="w-auto h-24 transition-shadow border border-gray-300 rounded-lg cursor-pointer dark:border-gray-600 hover:shadow-md"
                      onClick={() => setSelectedImage(getMediaUrl(order.paymentProofUrl))}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER_RECEIPT;
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black bg-opacity-50 rounded-lg opacity-0 hover:opacity-100">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="px-4 py-4 border-t border-gray-200 sm:px-6 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <span>Shipping: {currencyFormatter.format(order.shippingFee || 0)}</span>
                      <span className="font-semibold">Total: {currencyFormatter.format(order.total || 0)}</span>
                    </div>
                    {order.paymentMethod && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <CreditCard className="w-4 h-4 mr-1" />
                        Paid with {order.paymentMethod}
                      </div>
                    )}
                  </div>
                  <Link 
                    to="/shop" 
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-colors bg-pink-600 rounded-lg hover:bg-pink-700"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Shop Again
                  </Link>
                </div>
              </div>

              {/* Order Tracker */}
              <div className="px-4 py-4 border-t border-gray-200 sm:px-6 dark:border-gray-700">
                <h4 className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Order Status</h4>
                <OrderTracker status={order.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Proof Modal */}
      <PaymentProofModal 
        imageUrl={selectedImage} 
        onClose={() => setSelectedImage(null)} 
      />
      
      <CancelItemModal
        isOpen={!!cancellationItem}
        onClose={() => setCancellationItem(null)}
        onConfirm={handleCancelProduct}
      />
    </div>
  );
};

export default OrdersPage;
