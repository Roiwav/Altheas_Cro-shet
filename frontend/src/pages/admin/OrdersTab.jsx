import React, { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { toast } from "react-toastify";

import OrdersToolbar from "../../components/admin/orders/OrdersToolbar.jsx";
import OrdersTable from "../../components/admin/orders/OrdersTable.jsx";
import OrdersCardsMobile from "../../components/admin/orders/OrdersCardsMobile.jsx";
import PaymentProofModal from "../../components/admin/orders/PaymentProofModal.jsx";
import OrderDetailsModal from "../../components/admin/orders/OrderDetailsModal.jsx";
import RejectionModal from "../../components/admin/orders/RejectionModal.jsx";

/**
 * OrdersTab component for managing all customer orders in the admin dashboard.
 * It includes features for searching, sorting, filtering, paginating, and updating orders.
 * It uses an optimistic UI approach for status updates to provide a responsive user experience.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isDarkMode - Flag to indicate if dark mode is enabled.
 * @param {Array<object>} props.orders - The list of all orders fetched from the backend.
 * @param {function} props.refreshOrders - A function to re-fetch the orders list.
 */
const OrdersTab = ({ isDarkMode, orders, refreshOrders }) => {
  /**
   * Local state for orders to enable optimistic UI updates.
   * When an order status is changed, this state is updated immediately
   * before waiting for the API call to complete.
   */
  const [localOrders, setLocalOrders] = useState(orders);

  // Effect to synchronize local state when the `orders` prop changes.
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // ======= LOCAL STATES AND ADMIN LOGIC =======
  // State for UI controls and modals
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedPaymentProof, setSelectedPaymentProof] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionOrder, setRejectionOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [updatingOrders, setUpdatingOrders] = useState(new Set());

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const currencyFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  });

  // Reference to the main table section for smooth scrolling
  const mainTableRef = useRef(null);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getAuthToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  };

  // ---- ORDER STATUS UPDATE HANDLER (OPTIMISTIC UI) ----
  const updateOrderStatus = async (orderId, newStatus) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    // Optimistically update before actual API returns
    setLocalOrders(prev =>
      prev.map(order =>
        order._id === orderId ? { ...order, status: newStatus, statusMessage: `Order updated to ${newStatus}` } : order
      )
    );

    setUpdatingOrders(prev => new Set(prev).add(orderId));

    try {
      const response = await fetch(`http://localhost:5001/api/v1/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }

      toast.success(`Order status updated to ${newStatus}`);
      if (refreshOrders) {
        await refreshOrders();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(error.message || "Failed to update order status");
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  /**
   * Opens the rejection modal for a specific order.
   * @param {object} order - The order object to be rejected.
   */
  const handleRejectOrder = (order) => {
    setRejectionOrder(order);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  /**
   * Confirms and processes the rejection of an order.
   */
  const confirmRejection = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    const orderId = rejectionOrder._id;

    setLocalOrders(prev =>
      prev.map(order =>
        order._id === orderId ? { ...order, status: "rejected", statusMessage: `Order rejected: ${rejectionReason}` } : order
      )
    );

    setUpdatingOrders(prev => new Set(prev).add(orderId));

    try {
      const response = await fetch(`http://localhost:5001/api/v1/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "rejected",
          rejectionReason: rejectionReason.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject order");
      }

      toast.success("Order rejected successfully");
      setShowRejectionModal(false);
      setRejectionOrder(null);
      setRejectionReason("");
      if (refreshOrders) {
        await refreshOrders();
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      toast.error(error.message || "Failed to reject order");
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Memoized derivation of orders based on search, filter, and sort configurations.
  const searchedOrders = useMemo(() => {
    if (!localOrders) return [];
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return localOrders;
    const query = trimmedQuery.toLowerCase();
    return localOrders.filter((order) => {
      if (!order) return false;
      if (order.orderNumber?.toLowerCase().includes(query)) return true;
      if (order._id?.toLowerCase().includes(query)) return true;
      if (order.username?.toLowerCase().includes(query)) return true;
      if (order.userId?.email?.toLowerCase().includes(query)) return true;
      if (order.status?.toLowerCase().includes(query)) return true;
      if (order.products?.some((p) => p.name?.toLowerCase().includes(query))) return true;
      if (order.shippingAddress) {
        const { line1, city, state, postalCode, country } = order.shippingAddress;
        if ([line1, city, state, postalCode, country].some((field) => field && field.toLowerCase().includes(query))) return true;
      }
      if (order.paymentMethod?.toLowerCase().includes(query)) return true;
      if (order.total?.toString().includes(query)) return true;
      return false;
    });
  }, [localOrders, searchQuery]);

  // Filters orders by status.
  const filteredOrders = useMemo(() => {
    if (!statusFilter) return searchedOrders;
    return searchedOrders.filter((order) => order.status?.toLowerCase() === statusFilter.toLowerCase());
  }, [searchedOrders, statusFilter]);

  // Sorts the filtered orders.
  const sortedAndFilteredOrders = useMemo(() => {
    if (!sortConfig.key) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === "createdAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (["total", "shippingFee"].includes(sortConfig.key)) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else {
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  // Paginates the sorted and filtered orders.
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredOrders, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(sortedAndFilteredOrders.length / itemsPerPage);

  const pageList = useMemo(() => {
    if (totalPages <= 1) return [1];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);
    if (left > 2) pages.push("...");
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  // Effect to update the selected order details in the modal if the order data changes.
  useEffect(() => {
    if (selectedOrder) {
      const updated = localOrders.find((o) => o._id === selectedOrder._id);
      if (updated) setSelectedOrder(updated);
    }
  }, [localOrders, selectedOrder]);

  // Configuration for the columns in the orders table.
  const columns = [
    { key: "select", label: "", width: "w-6" },
    { key: "orderNumber", label: "Order ID", width: "w-24" },
    { key: "username", label: "Customer", width: "w-32" },
    { key: "products", label: "Products", width: "w-48" },
    { key: "shippingAddress", label: "Location", width: "w-32" },
    { key: "total", label: "Total", width: "w-24" },
    { key: "createdAt", label: "Date", width: "w-32" },
    { key: "status", label: "Status", width: "w-28" },
    { key: null, label: "Actions", width: "w-32" },
  ];

  // ======= Incoming Orders (Pending & Processing) =======
  const pendingOrdersTop = useMemo(() => {
    const items = (localOrders || []).filter(o => String(o.status).toLowerCase() === 'pending');
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [localOrders]);

  const processingOrdersTop = useMemo(() => {
    const items = (localOrders || []).filter(o => String(o.status).toLowerCase() === 'processing');
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [localOrders]);

  const shippedOrdersTop = useMemo(() => {
    const items = (localOrders || []).filter(o => String(o.status).toLowerCase() === 'shipped');
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [localOrders]);

  const deliveredOrdersTop = useMemo(() => {
    const items = (localOrders || []).filter(o => String(o.status).toLowerCase() === 'delivered');
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [localOrders]);

  const handleViewAllStatus = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    // Smooth scroll to the main table
    if (mainTableRef.current) {
      mainTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // FIXED: Handle payment proof modal with proper z-index
  const handleOpenPaymentProof = (url) => {
    // Close order modal first to prevent z-index conflicts
    setShowOrderModal(false);
    setSelectedPaymentProof(url);
  };

  const handleClosePaymentProof = () => {
    setSelectedPaymentProof(null);
    // Reopen order modal if there was a selected order
    if (selectedOrder) {
      setShowOrderModal(true);
    }
  };

  return (
    <div className="space-y-8">
      <OrdersToolbar
        isDarkMode={isDarkMode}
        totalCount={sortedAndFilteredOrders.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        setCurrentPage={setCurrentPage}
        exportToCsv={() => {}}
        selectedOrders={selectedOrders}
        updateMultipleStatuses={() => {}} // implement bulk
      />
      {/* Incoming Orders Overview */}
      <div className="space-y-3">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Incoming orders</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Pending */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-900'} font-medium`}>Pending</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>{(localOrders || []).filter(o => String(o.status).toLowerCase() === 'pending').length}</span>
              </div>
              <button onClick={() => handleViewAllStatus('pending')} className={`text-sm font-medium inline-flex items-center ${isDarkMode ? 'text-pink-300 hover:text-pink-200' : 'text-pink-600 hover:text-pink-700'}`}>
                View all
              </button>
            </div>
            {pendingOrdersTop.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No pending orders</div>
            ) : (
              <div className="overflow-x-hidden">
                <table className="w-full text-xs">
                  <thead className={`${isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-50'} text-xs uppercase`}>
                    <tr>
                      <th className="px-3 py-1.5 text-left">Order</th>
                      <th className="px-3 py-1.5 text-left">Customer</th>
                      <th className="px-3 py-1.5 text-left">Total</th>
                      <th className="px-3 py-1.5 text-left">Date</th>
                      <th className="px-3 py-1.5 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {pendingOrdersTop.map(order => (
                      <tr key={order._id} className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                        <td className={`px-3 py-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.orderNumber || order._id.slice(-6)}</td>
                        <td className={`px-3 py-1.5 max-w-[12rem] truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{order.username || order.userId?.email || '—'}</td>
                        <td className={`px-3 py-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currencyFormatter.format(parseFloat(order.total || 0))}</td>
                        <td className={`px-3 py-1.5 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} title={formatDate(order.createdAt)}>{formatDate(order.createdAt)}</td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateOrderStatus(order._id, 'processing')}
                              disabled={updatingOrders.has(order._id)}
                              className={`px-0.5 py-0.5 text-[11px] rounded ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'}`}
                            >
                              Mark processing
                            </button>
                            <button
                              onClick={() => handleRejectOrder(order)}
                              className={`px-2 py-1 text-xs rounded-md ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleOpenDetails(order)}
                              className={`px-2 py-1 text-xs rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Processing */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-900'} font-medium`}>Processing</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>{(localOrders || []).filter(o => String(o.status).toLowerCase() === 'processing').length}</span>
              </div>
              <button onClick={() => handleViewAllStatus('processing')} className={`text-sm font-medium inline-flex items-center ${isDarkMode ? 'text-pink-300 hover:text-pink-200' : 'text-pink-600 hover:text-pink-700'}`}>
                View all
              </button>
            </div>
            {processingOrdersTop.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No processing orders</div>
            ) : (
              <div className="overflow-x-hidden">
                <table className="w-full text-xs">
                  <thead className={`${isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-50'} text-xs uppercase`}>
                    <tr>
                      <th className="px-3 py-1.5 text-left">Order</th>
                      <th className="px-3 py-1.5 text-left">Customer</th>
                      <th className="px-3 py-1.5 text-left">Total</th>
                      <th className="px-3 py-1.5 text-left">Date</th>
                      <th className="px-3 py-1.5 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {processingOrdersTop.map(order => (
                      <tr key={order._id} className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                        <td className={`px-3 py-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.orderNumber || order._id.slice(-6)}</td>
                        <td className={`px-3 py-1.5 max-w-[12rem] truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{order.username || order.userId?.email || '—'}</td>
                        <td className={`px-3 py-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currencyFormatter.format(parseFloat(order.total || 0))}</td>
                        <td className={`px-3 py-1.5 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} title={formatDate(order.createdAt)}>{formatDate(order.createdAt)}</td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateOrderStatus(order._id, 'shipped')}
                              disabled={updatingOrders.has(order._id)}
                              className={`px-2 py-1 text-xs rounded-md ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'}`}
                            >
                              Mark shipped
                            </button>
                            <button
                              onClick={() => handleOpenDetails(order)}
                              className={`px-2 py-1 text-xs rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Shipped */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-900'} font-medium`}>Shipped</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-800'}`}>{(localOrders || []).filter(o => String(o.status).toLowerCase() === 'shipped').length}</span>
              </div>
              <button onClick={() => handleViewAllStatus('shipped')} className={`text-sm font-medium inline-flex items-center ${isDarkMode ? 'text-pink-300 hover:text-pink-200' : 'text-pink-600 hover:text-pink-700'}`}>
                View all
              </button>
            </div>
            {shippedOrdersTop.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No shipped orders</div>
            ) : (
              <div className="overflow-x-hidden">
                <table className="w-full text-xs">
                  <thead className={`${isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-50'} text-xs uppercase`}>
                    <tr>
                      <th className="px-3 py-1.5 text-left">Order</th>
                      <th className="px-3 py-1.5 text-left">Customer</th>
                      <th className="px-3 py-1.5 text-left">Total</th>
                      <th className="px-3 py-1.5 text-left">Date</th>
                      <th className="px-3 py-1.5 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {shippedOrdersTop.map(order => (
                      <tr key={order._id} className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                        <td className={`px-3 py-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.orderNumber || order._id.slice(-6)}</td>
                        <td className={`px-3 py-1.5 max-w-[12rem] truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{order.username || order.userId?.email || '—'}</td>
                        <td className={`px-3 py-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currencyFormatter.format(parseFloat(order.total || 0))}</td>
                        <td className={`px-3 py-1.5 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} title={formatDate(order.createdAt)}>{formatDate(order.createdAt)}</td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateOrderStatus(order._id, 'delivered')}
                              disabled={updatingOrders.has(order._id)}
                              className={`px-2 py-1 text-xs rounded-md ${isDarkMode ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50' : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'}`}
                            >
                              Mark delivered
                            </button>
                            <button
                              onClick={() => handleOpenDetails(order)}
                              className={`px-2 py-1 text-xs rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Delivered */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-900'} font-medium`}>Delivered</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'}`}>{(localOrders || []).filter(o => String(o.status).toLowerCase() === 'delivered').length}</span>
              </div>
              <button onClick={() => handleViewAllStatus('delivered')} className={`text-sm font-medium inline-flex items-center ${isDarkMode ? 'text-pink-300 hover:text-pink-200' : 'text-pink-600 hover:text-pink-700'}`}>
                View all
              </button>
            </div>
            {deliveredOrdersTop.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No delivered orders</div>
            ) : (
              <div className="overflow-x-hidden">
                <table className="w-full text-xs">
                  <thead className={`${isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-50'} text-xs uppercase`}>
                    <tr>
                      <th className="px-3 py-1.5 text-left">Order</th>
                      <th className="px-3 py-1.5 text-left">Customer</th>
                      <th className="px-3 py-1.5 text-left">Total</th>
                      <th className="px-3 py-1.5 text-left">Date</th>
                      <th className="px-3 py-1.5 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {deliveredOrdersTop.map(order => (
                      <tr key={order._id} className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                        <td className={`px-3 py-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.orderNumber || order._id.slice(-6)}</td>
                        <td className={`px-3 py-1.5 max-w-[12rem] truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{order.username || order.userId?.email || '—'}</td>
                        <td className={`px-3 py-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currencyFormatter.format(parseFloat(order.total || 0))}</td>
                        <td className={`px-3 py-1.5 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} title={formatDate(order.createdAt)}>{formatDate(order.createdAt)}</td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDetails(order)}
                              className={`px-2 py-1 text-xs rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Orders Table */}
      <div ref={mainTableRef} className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl shadow-sm border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        {isMobile ? (
          <OrdersCardsMobile
            isDarkMode={isDarkMode}
            paginatedOrders={paginatedOrders}
            currencyFormatter={currencyFormatter}
            setSelectedOrder={setSelectedOrder}
            setShowOrderModal={setShowOrderModal}
            updateOrderStatus={updateOrderStatus}
            handleRejectOrder={handleRejectOrder}
            onConfirmCancellation={() => {}}
            updatingOrders={updatingOrders}
          />
        ) : (
          <OrdersTable
            isDarkMode={isDarkMode}
            loading={false}
            columns={columns}
            paginatedOrders={paginatedOrders}
            selectedOrders={selectedOrders}
            setSelectedOrders={setSelectedOrders}
            sortConfig={sortConfig}
            requestSort={setSortConfig}
            currencyFormatter={currencyFormatter}
            setSelectedOrder={setSelectedOrder}
            setShowOrderModal={setShowOrderModal}
            updateOrderStatus={updateOrderStatus}
            handleRejectOrder={handleRejectOrder}
            onConfirmCancellation={() => {}}
            updatingOrders={updatingOrders}
          />
        )}
        {paginatedOrders.length > 0 && (
          <div className={`px-4 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
            <div className="flex items-center gap-3">
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedAndFilteredOrders.length)} to {Math.min(currentPage * itemsPerPage, sortedAndFilteredOrders.length)} of {sortedAndFilteredOrders.length}
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={`text-sm rounded-md border px-2 py-1 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-700"
                  } focus:ring-pink-500 focus:border-pink-500`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-1 self-end md:self-auto">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`inline-flex items-center px-2 py-1.5 border text-sm rounded-md ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                  aria-label="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`inline-flex items-center px-2 py-1.5 border text-sm rounded-md ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                  aria-label="Previous page"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {pageList.map((p, idx) => (
                  typeof p === 'string' ? (
                    <span key={`e-${idx}`} className={`px-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`inline-flex items-center px-2.5 py-1.5 border text-sm rounded-md ${
                        p === currentPage
                          ? (isDarkMode ? 'bg-pink-600 text-white border-pink-600' : 'bg-pink-50 text-pink-600 border-pink-300')
                          : (isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                      }`}
                    >
                      {p}
                    </button>
                  )
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`inline-flex items-center px-2 py-1.5 border text-sm rounded-md ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                  aria-label="Next page"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`inline-flex items-center px-2 py-1.5 border text-sm rounded-md ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                  aria-label="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* FIXED: Order Details Modal with proper onOpenProof handler */}
      <OrderDetailsModal 
        open={showOrderModal} 
        onClose={() => setShowOrderModal(false)} 
        order={selectedOrder} 
        isDarkMode={isDarkMode} 
        onOpenProof={handleOpenPaymentProof}
        onConfirmCancellation={() => {}} 
      />
      
      {/* FIXED: Payment Proof Modal with higher z-index */}
      <PaymentProofModal 
        imageUrl={selectedPaymentProof} 
        onClose={handleClosePaymentProof}
      />
      
      <RejectionModal
        open={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        order={rejectionOrder}
        isDarkMode={isDarkMode}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onConfirm={confirmRejection}
      />
    </div>
  );
};

export default OrdersTab;
