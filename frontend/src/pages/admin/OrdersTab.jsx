import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { toast } from 'react-toastify';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { 
  Search, 
  ArrowUp, 
  ArrowDown, 
  ChevronDown, 
  Clock, 
  RefreshCw, 
  Truck, 
  CheckCircle, 
  XCircle, 
  X, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  Eye,
  Package,
  CreditCard,
  MapPin,
  User,
  AlertCircle
} from 'lucide-react';

const OrdersTab = ({ isDarkMode }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedPaymentProof, setSelectedPaymentProof] = useState(null);
  
  // ✅ NEW: Rejection modal states
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionOrder, setRejectionOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Helper to format currency
  const currencyFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5001/api/orders", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : data.orders || []);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        toast.error("Failed to fetch orders.");
      })
      .finally(() => setLoading(false));
  }, []);

  // ✅ UPDATED: Enhanced updateOrderStatus function
  const updateOrderStatus = async (orderId, newStatus, rejectionReason = '') => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus, 
          rejectionReason,
          adminName: 'Admin' // You can get this from user context
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to update order status");
      }

      toast.success(`Order status updated to ${newStatus}`);
      
      // Update the orders state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, ...data.order } : order
        )
      );
      
      // Update selected order if modal is open
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, ...data.order });
      }

    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(error.message || "Failed to update order status");
    }
  };

  const updateMultipleStatuses = (newStatus) => {
    if (selectedOrders.length === 0) {
      toast.error("No orders selected.");
      return;
    }
    
    selectedOrders.forEach(orderId => updateOrderStatus(orderId, newStatus));
    setSelectedOrders([]);
  };

  // ✅ NEW: Handle rejection with reason
  const handleRejectOrder = (order) => {
    setRejectionOrder(order);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const confirmRejection = () => {
    if (rejectionOrder) {
      updateOrderStatus(rejectionOrder._id, 'rejected', rejectionReason);
      setShowRejectionModal(false);
      setRejectionOrder(null);
      setRejectionReason('');
    }
  };

  const searchedOrders = useMemo(() => {
    if (!orders) return [];
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return orders;
    const query = trimmedQuery.toLowerCase();
    
    return orders.filter(order => {
      if (!order) return false;
      
      // Search in order number/ID
      if (order.orderNumber?.toLowerCase().includes(query)) return true;
      if (order._id?.toLowerCase().includes(query)) return true;
      
      // Search in customer info
      if (order.username?.toLowerCase().includes(query)) return true;
      if (order.userId?.email?.toLowerCase().includes(query)) return true;
      
      // Search in status
      if (order.status?.toLowerCase().includes(query)) return true;
      
      // Search in products
      if (order.products?.some(p => p.name?.toLowerCase().includes(query))) return true;
      
      // Search in address
      if (order.shippingAddress) {
        const { line1, city, state, postalCode, country } = order.shippingAddress;
        if ([line1, city, state, postalCode, country].some(field => 
          field && field.toLowerCase().includes(query)
        )) return true;
      }
      
      // Search in payment method
      if (order.paymentMethod?.toLowerCase().includes(query)) return true;
      
      // Search in total
      if (order.total?.toString().includes(query)) return true;
      
      return false;
    });
  }, [orders, searchQuery]);

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return searchedOrders;
    return searchedOrders.filter(order => order.status?.toLowerCase() === statusFilter.toLowerCase());
  }, [searchedOrders, statusFilter]);

  const sortedAndFilteredOrders = useMemo(() => {
    if (!sortConfig.key) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (['total', 'shippingFee'].includes(sortConfig.key)) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }
      
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAndFilteredOrders.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const StatusBadge = ({ status }) => {
    const statusLower = (status || 'pending').toLowerCase();
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[statusLower] || statusClasses.pending}`}>
        {status || 'Pending'}
      </span>
    );
  };

  // ✅ UPDATED: Enhanced renderActions with separate reject option
  const renderActions = (order) => {
    const statusOptions = [
      { value: 'pending', label: 'Mark as Pending', icon: Clock, color: 'text-yellow-500' },
      { value: 'processing', label: 'Mark as Processing', icon: RefreshCw, color: 'text-blue-500' },
      { value: 'shipped', label: 'Mark as Shipped', icon: Truck, color: 'text-purple-500' },
      { value: 'delivered', label: 'Mark as Delivered', icon: CheckCircle, color: 'text-green-500' },
      { value: 'cancelled', label: 'Cancel Order', icon: X, color: 'text-gray-500' },
    ];
    
    return (
      <div className="flex items-center space-x-2">
        {/* View Details Button */}
        <button
          onClick={() => {
            setSelectedOrder(order);
            setShowOrderModal(true);
          }}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          title="View order details"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Status Actions Menu */}
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className={`inline-flex items-center justify-center rounded-md border shadow-sm px-3 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            Actions
            <ChevronDown className="w-4 h-4 ml-1" />
          </Menu.Button>
          
          <Transition as={Fragment}>
            <Menu.Items className={`absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="px-1 py-1">
                {statusOptions.map((status) => {
                  const Icon = status.icon;
                  return (
                    <Menu.Item key={status.value}>
                      {({ active }) => (
                        <button 
                          onClick={() => updateOrderStatus(order._id, status.value)} 
                          className={`${active ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : (isDarkMode ? 'text-gray-200' : 'text-gray-700')} group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                        >
                          <Icon className={`mr-3 h-4 w-4 ${status.color}`} />
                          {status.label}
                          {order.status === status.value && <Check className="w-4 h-4 ml-auto text-green-500" />}
                        </button>
                      )}
                    </Menu.Item>
                  );
                })}
                
                {/* ✅ Separate Reject option with reason */}
                <Menu.Item>
                  {({ active }) => (
                    <button 
                      onClick={() => handleRejectOrder(order)} 
                      className={`${active ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : (isDarkMode ? 'text-gray-200' : 'text-gray-700')} group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                    >
                      <XCircle className="mr-3 h-4 w-4 text-red-500" />
                      Reject Order
                      {order.status === 'rejected' && <Check className="w-4 h-4 ml-auto text-green-500" />}
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    );
  };

  const renderPagination = () => (
    <div className="flex items-center space-x-2">
      <button 
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
        disabled={currentPage === 1} 
        className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
        }`}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Previous
      </button>
      
      <span className={`text-sm px-3 py-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {currentPage} of {totalPages}
      </span>
      
      <button 
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
        disabled={currentPage === totalPages || totalPages === 0} 
        className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
        }`}
      >
        Next
        <ArrowRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );

  // ✅ UPDATED: Order Details Modal with status messages and refund info
  const OrderModal = () => {
    if (!selectedOrder) return null;

    return (
      <Dialog open={showOrderModal} onClose={() => setShowOrderModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/25" />
        
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className={`mx-auto max-w-4xl w-full rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Order Details - #{selectedOrder.orderNumber || selectedOrder._id?.substring(0, 8)}
                </Dialog.Title>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ✅ NEW: Status Message Display */}
              {selectedOrder.statusMessage && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  selectedOrder.status === 'rejected' || selectedOrder.status === 'cancelled' 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                    : selectedOrder.status === 'delivered' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${
                      selectedOrder.status === 'rejected' || selectedOrder.status === 'cancelled' 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : selectedOrder.status === 'delivered' 
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {selectedOrder.status === 'rejected' || selectedOrder.status === 'cancelled' ? (
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      ) : selectedOrder.status === 'delivered' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        selectedOrder.status === 'rejected' || selectedOrder.status === 'cancelled' 
                          ? 'text-red-800 dark:text-red-200' 
                          : selectedOrder.status === 'delivered' 
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-blue-800 dark:text-blue-200'
                      }`}>
                        {selectedOrder.statusMessage}
                      </p>
                      {selectedOrder.statusUpdatedAt && (
                        <p className={`text-xs mt-1 ${
                          selectedOrder.status === 'rejected' || selectedOrder.status === 'cancelled' 
                            ? 'text-red-600 dark:text-red-400' 
                            : selectedOrder.status === 'delivered' 
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          Updated {formatDate(selectedOrder.statusUpdatedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer & Order Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Customer Info */}
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`font-medium mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <User className="w-4 h-4 mr-2" />
                      Customer Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        <strong>Name:</strong> {selectedOrder.username}
                      </p>
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        <strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}
                      </p>
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
                      </p>
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        <strong>Status:</strong> <StatusBadge status={selectedOrder.status} />
                      </p>
                      {selectedOrder.rejectionReason && (
                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          <strong>Rejection Reason:</strong> {selectedOrder.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Products */}
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`font-medium mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Package className="w-4 h-4 mr-2" />
                      Products ({selectedOrder.products?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.products?.map((product, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <img
                            src={product.image || '/images/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                            onError={(e) => {e.target.src='/images/placeholder-product.jpg'}}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {product.name}
                            </p>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <p>Qty: {product.quantity} × {currencyFormatter.format(product.price)}</p>
                              {product.color && <p>Color: {product.color}</p>}
                              {product.variation && <p>Variation: {product.variation}</p>}
                            </div>
                          </div>
                          <div className={`text-right font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {currencyFormatter.format(product.price * product.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {selectedOrder.shippingAddress && (
                    <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <h3 className={`font-medium mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <MapPin className="w-4 h-4 mr-2" />
                        Shipping Address
                      </h3>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <p>{selectedOrder.shippingAddress.line1}</p>
                        {selectedOrder.shippingAddress.line2 && <p>{selectedOrder.shippingAddress.line2}</p>}
                        <p>
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                        </p>
                        <p>{selectedOrder.shippingAddress.country}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment & Actions */}
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`font-medium mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Order Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className={`flex justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span>Subtotal:</span>
                        <span>{currencyFormatter.format((selectedOrder.total || 0) - (selectedOrder.shippingFee || 0))}</span>
                      </div>
                      <div className={`flex justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span>Shipping:</span>
                        <span>{currencyFormatter.format(selectedOrder.shippingFee || 0)}</span>
                      </div>
                      <div className={`flex justify-between font-semibold text-base pt-2 border-t ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-200'}`}>
                        <span>Total:</span>
                        <span>{currencyFormatter.format(selectedOrder.total || 0)}</span>
                      </div>
                      
                      {/* ✅ NEW: Refund Information */}
                      {selectedOrder.refundStatus && selectedOrder.refundStatus !== 'Not Required' && (
                        <div className={`mt-3 p-3 rounded-lg border ${
                          selectedOrder.refundStatus === 'Completed' 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}>
                          <p className={`text-sm font-medium ${
                            selectedOrder.refundStatus === 'Completed' 
                              ? 'text-green-800 dark:text-green-200' 
                              : 'text-blue-800 dark:text-blue-200'
                          }`}>
                            Refund Status: {selectedOrder.refundStatus}
                          </p>
                          {selectedOrder.refundAmount && (
                            <p className={`text-xs mt-1 ${
                              selectedOrder.refundStatus === 'Completed' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              Amount: {currencyFormatter.format(selectedOrder.refundAmount)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Proof */}
                  {selectedOrder.paymentProofUrl && (
                    <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Payment Proof
                      </h3>
                      <div className="relative inline-block cursor-pointer" onClick={() => setSelectedPaymentProof(`http://localhost:5001${selectedOrder.paymentProofUrl}`)}>
                        <img
                          src={`http://localhost:5001${selectedOrder.paymentProofUrl}`}
                          alt="Payment Proof"
                          className="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 hover:shadow-md transition-shadow"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/placeholder-receipt.jpg";
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-50 rounded-lg transition-opacity">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      {selectedOrder.status !== 'processing' && (
                        <button
                          onClick={() => updateOrderStatus(selectedOrder._id, 'processing')}
                          className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Mark as Processing
                        </button>
                      )}
                      {selectedOrder.status !== 'shipped' && (
                        <button
                          onClick={() => updateOrderStatus(selectedOrder._id, 'shipped')}
                          className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                          Mark as Shipped
                        </button>
                      )}
                      {selectedOrder.status !== 'delivered' && (
                        <button
                          onClick={() => updateOrderStatus(selectedOrder._id, 'delivered')}
                          className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Mark as Delivered
                        </button>
                      )}
                      {selectedOrder.status !== 'rejected' && (
                        <button
                          onClick={() => handleRejectOrder(selectedOrder)}
                          className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Reject Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    );
  };

  // Payment Proof Modal
  const PaymentProofModal = () => {
    if (!selectedPaymentProof) return null;

    return (
      <Dialog open={!!selectedPaymentProof} onClose={() => setSelectedPaymentProof(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/75" />
        
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              <button 
                onClick={() => setSelectedPaymentProof(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
              >
                <X className="h-8 w-8" />
              </button>
              <img
                src={selectedPaymentProof}
                alt="Payment Proof"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      </Dialog>
    );
  };

  // ✅ NEW: Rejection Modal
  const RejectionModal = () => {
    if (!rejectionOrder) return null;

    return (
      <Dialog open={showRejectionModal} onClose={() => setShowRejectionModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/25" />
        
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className={`mx-auto max-w-md w-full rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Reject Order #{rejectionOrder.orderNumber || rejectionOrder._id?.substring(0, 8)}
                </Dialog.Title>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Product out of stock, Payment issue, Invalid shipping address..."
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  rows={3}
                />
              </div>

              <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                  <strong>Note:</strong> Rejecting this order will automatically process a full refund of {currencyFormatter.format(rejectionOrder.total || 0)} within 5-7 business days.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRejection}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Reject Order
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    );
  };

  const columns = [
    { key: 'select', label: '', width: 'w-6' },
    { key: 'orderNumber', label: 'Order ID', width: 'w-24' },
    { key: 'username', label: 'Customer', width: 'w-32' },
    { key: 'products', label: 'Products', width: 'w-48' },
    { key: 'shippingAddress', label: 'Location', width: 'w-32' },
    { key: 'total', label: 'Total', width: 'w-24' },
    { key: 'createdAt', label: 'Date', width: 'w-32' },
    { key: 'status', label: 'Status', width: 'w-28' },
    { key: null, label: 'Actions', width: 'w-32' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Orders Management</h2>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage and track customer orders ({sortedAndFilteredOrders.length} total)
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`block w-full sm:w-40 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {selectedOrders.length > 0 && (
        <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex flex-wrap gap-2">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedOrders.length} order(s) selected:
            </span>
            <button
              onClick={() => updateMultipleStatuses("processing")}
              className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 text-sm transition-colors"
            >
              Mark as Processing
            </button>
            <button
              onClick={() => updateMultipleStatuses("shipped")}
              className="px-3 py-1 rounded-md bg-purple-500 text-white hover:bg-purple-600 text-sm transition-colors"
            >
              Mark as Shipped
            </button>
            <button
              onClick={() => updateMultipleStatuses("delivered")}
              className="px-3 py-1 rounded-md bg-green-500 text-white hover:bg-green-600 text-sm transition-colors"
            >
              Mark as Delivered
            </button>
          </div>
        </div>
      )}

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(paginatedOrders.map((o) => o._id));
                      } else {
                        setSelectedOrders([]);
                      }
                    }}
                    className="rounded border-gray-300 focus:ring-pink-500"
                  />
                </th>

                {columns.slice(1).map(col => (
                  <th key={col.key || 'actions'} className={`px-4 py-3 text-left text-xs font-medium ${col.width} ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {col.key ? (
                      <button 
                        onClick={() => requestSort(col.key)} 
                        className="flex items-center w-full space-x-1 text-left transition-colors hover:text-pink-500"
                      >
                        <span className="truncate">{col.label}</span>
                        {sortConfig.key === col.key && (
                          sortConfig.direction === 'ascending' 
                            ? <ArrowUp className="flex-shrink-0 w-3 h-3" /> 
                            : <ArrowDown className="flex-shrink-0 w-3 h-3" />
                        )}
                      </button>
                    ) : (
                      <span className="truncate">{col.label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Loading orders...
                    </div>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {searchQuery || statusFilter ? 'No orders match your filters.' : 'No orders found.'}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order._id} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders((prev) => [...prev, order._id]);
                          } else {
                            setSelectedOrders((prev) => prev.filter((id) => id !== order._id));
                          }
                        }}
                        className="rounded border-gray-300 focus:ring-pink-500"
                      />
                    </td>
                    
                    <td className={`px-4 py-3 font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`} title={order.orderNumber || order._id}>
                      #{order.orderNumber || order._id?.substring(0, 8)}
                    </td>
                    
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="truncate max-w-32" title={order.username}>
                        {order.username}
                      </div>
                    </td>
                    
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="space-y-1">
                        {order.products?.slice(0, 2).map((product, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="truncate max-w-40 inline-block">{product.name}</span>
                            <span className="text-gray-500 ml-1">(×{product.quantity})</span>
                          </div>
                        ))}
                        {order.products?.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{order.products.length - 2} more items
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="truncate max-w-32" title={`${order.shippingAddress?.city}, ${order.shippingAddress?.state}`}>
                        {order.shippingAddress?.city}, {order.shippingAddress?.state}
                      </div>
                    </td>
                    
                    <td className={`px-4 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {currencyFormatter.format(order.total || 0)}
                    </td>
                    
                    <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit'
                      })}
                    </td>
                    
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    
                    <td className="px-4 py-3">
                      {renderActions(order)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {paginatedOrders.length > 0 && (
          <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedAndFilteredOrders.length)} to {Math.min(currentPage * itemsPerPage, sortedAndFilteredOrders.length)} of {sortedAndFilteredOrders.length} orders
            </p>
            
            <div className="flex items-center space-x-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`text-sm rounded-md border px-2 py-1 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} focus:ring-pink-500 focus:border-pink-500`}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
              {renderPagination()}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderModal />
      <PaymentProofModal />
      <RejectionModal />
    </div>
  );
};

export default OrdersTab;