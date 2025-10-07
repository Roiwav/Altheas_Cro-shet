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
  MapPin,
  Loader2,
  Eye,
  X,
  AlertCircle,
  User
} from 'lucide-react';

// Helper functions
const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { 
  year: 'numeric', 
  month: 'short', 
  day: 'numeric' 
});
const currencyFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

// Status Badge Component
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

// Order Tracker Component
const OrderTracker = ({ status }) => {
  const steps = [
    { key: 'pending', label: 'Pending', icon: <Clock className="h-4 w-4" /> },
    { key: 'processing', label: 'Making', icon: <Package className="h-4 w-4" /> },
    { key: 'shipped', label: 'Shipped', icon: <Truck className="h-4 w-4" /> },
    { key: 'delivered', label: 'Delivered', icon: <CheckCircle className="h-4 w-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === (status || 'pending').toLowerCase());

  if (['cancelled', 'rejected'].includes((status || '').toLowerCase())) {
    return (
      <div className="flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
        <p className="text-red-700 dark:text-red-300 font-medium text-sm">
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

// ✅ NEW: Refund Status Component
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

// Payment Proof Modal
const PaymentProofModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-full">
        <button 
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
        >
          <X className="h-8 w-8" />
        </button>
        <img
          src={imageUrl}
          alt="Payment Proof"
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

const OrdersPage = () => {
  const { user, token } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch orders function
  const fetchOrders = async () => {
    if (!user || !token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/orders/myorders', {
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
  };

  useEffect(() => {
    fetchOrders();
  }, [user, token]);

  // Cancel product
  const handleCancelProduct = async (orderId, productId) => {
    if (!window.confirm('Are you sure you want to remove this item from your order?')) return;

    try {
      const res = await fetch(`http://localhost:5001/api/orders/${orderId}/product/${productId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) {
        let errorMessage = 'Failed to cancel product';
        
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          if (res.status === 404) {
            errorMessage = 'This feature is not available yet';
          } else {
            errorMessage = `Server error (${res.status})`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (data.orderDeleted) {
        setOrders(prev => prev.filter(o => o._id !== orderId));
        toast.success('Item cancelled and order removed.');
      } else {
        setOrders(prev => prev.map(o => (o._id === orderId ? data.order : o)));
        toast.success('Item cancelled successfully.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Could not cancel the product.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-20 px-4">
        <Loader2 className="h-12 w-12 animate-spin text-pink-500" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg max-w-md w-full">
          <div className="flex items-center mb-4">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button 
            onClick={fetchOrders} 
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-20 px-4">
        <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No orders yet</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6">You haven't placed any orders yet.</p>
        <Link 
          to="/shop" 
          className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" /> 
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 bg-gray-50 dark:bg-gray-900 md:ml-[var(--sidebar-width,5rem)] transition-all duration-300 ease-in-out">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Track and manage your orders</p>
        </div>

        <div className="space-y-6">
          {orders.map(order => (
            <div key={order._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Order Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order #{order.orderNumber || order._id?.substring(0,8)}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <Calendar className="h-4 w-4 mr-1" /> 
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* ✅ NEW: Status Message */}
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

                  {/* ✅ NEW: Refund Status */}
                  <RefundStatus order={order} />
                </div>
              )}

              {/* Order Items */}
              <div className="px-4 sm:px-6 py-4">
                <div className="space-y-4">
                  {order.products?.map(item => (
                    <div key={item.productId || item._id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img 
                          src={item.image || '/images/placeholder-product.jpg'} 
                          alt={item.name} 
                          className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                          onError={(e)=>{e.target.src='/images/placeholder-product.jpg'}}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1">
                            <Link 
                              to={`/product/${item.productId || item._id}`} 
                              className="font-medium text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors line-clamp-2"
                            >
                              {item.name}
                            </Link>
                            <div className="mt-1 space-y-1">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Qty: {item.quantity} × {currencyFormatter.format(item.price)}
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
                                onClick={() => handleCancelProduct(order._id, item.productId || item._id)} 
                                className="mt-2 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:underline transition-colors"
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
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Payment Proof</h4>
                  <div className="relative inline-block">
                    <img
                      src={`http://localhost:5001${order.paymentProofUrl}`}
                      alt="Payment Proof"
                      className="h-24 w-auto rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedImage(`http://localhost:5001${order.paymentProofUrl}`)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/placeholder-receipt.jpg";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-50 rounded-lg transition-opacity">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <span>Shipping: {currencyFormatter.format(order.shippingFee || 0)}</span>
                      <span className="font-semibold">Total: {currencyFormatter.format(order.total || 0)}</span>
                    </div>
                    {order.paymentMethod && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Paid with {order.paymentMethod}
                      </div>
                    )}
                  </div>
                  <Link 
                    to="/shop" 
                    className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Shop Again
                  </Link>
                </div>
              </div>

              {/* Order Tracker */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Order Status</h4>
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
    </div>
  );
};

export default OrdersPage;