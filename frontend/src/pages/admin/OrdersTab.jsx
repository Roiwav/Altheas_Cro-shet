import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { toast } from "react-toastify";

import OrdersToolbar from "../../components/admin/orders/OrdersToolbar.jsx";
import OrdersTable from "../../components/admin/orders/OrdersTable.jsx";
import OrdersCardsMobile from "../../components/admin/orders/OrdersCardsMobile.jsx";
import PaymentProofModal from "../../components/admin/orders/PaymentProofModal.jsx";
import OrderDetailsModal from "../../components/admin/orders/OrderDetailsModal.jsx";
import RejectionModal from "../../components/admin/orders/RejectionModal.jsx";

const OrdersTab = ({ isDarkMode, orders, refreshOrders }) => {
  // ======= LOCAL STATE FOR OPTIMISTIC UPDATES =======
  const [localOrders, setLocalOrders] = useState(orders);

  // keep in sync with prop
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // ======= LOCAL STATES AND ADMIN LOGIC =======
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

  const handleRejectOrder = (order) => {
    setRejectionOrder(order);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

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

    // Optimistically set status to rejected
    setLocalOrders(prev =>
      prev.map(order =>
        order._id === orderId ? { ...order, status: "rejected", statusMessage: `Order rejected: ${rejectionReason}` } : order
      )
    );

    setUpdatingOrders(prev => new Set(prev).add(orderId));

    try {
      const response = await fetch(`http://localhost:5001/api/v1/orders/${orderId}/reject`, {
        method: "PATCH",
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

  // ...other action handlers (for brevity, keep those as before, but swap orders for localOrders where needed)

  // ======= SEARCH, FILTER, SORT (use localOrders!) =======
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

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return searchedOrders;
    return searchedOrders.filter((order) => order.status?.toLowerCase() === statusFilter.toLowerCase());
  }, [searchedOrders, statusFilter]);

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

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredOrders, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(sortedAndFilteredOrders.length / itemsPerPage);

  useEffect(() => {
    if (selectedOrder) {
      const updated = localOrders.find((o) => o._id === selectedOrder._id);
      if (updated) setSelectedOrder(updated);
    }
  }, [localOrders, selectedOrder]);

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

  // -- The rest of your component rendering...
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
      <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl shadow-sm border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
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
          <div className={`px-4 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex flex-col md:flex-row justify-between items-center gap-4`}>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedAndFilteredOrders.length)} to {Math.min(currentPage * itemsPerPage, sortedAndFilteredOrders.length)} of {sortedAndFilteredOrders.length} orders
            </p>
            <div className="flex items-center space-x-2">
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
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:ring-2 focus:ring-pink-500 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                </button>
                <span className={`text-sm px-3 py-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:ring-2 focus:ring-pink-500 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <OrderDetailsModal open={showOrderModal} onClose={() => setShowOrderModal(false)} order={selectedOrder} isDarkMode={isDarkMode} onOpenProof={(url) => setSelectedPaymentProof(url)} onConfirmCancellation={() => {}} />
      <PaymentProofModal imageUrl={selectedPaymentProof} onClose={() => setSelectedPaymentProof(null)} />
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
