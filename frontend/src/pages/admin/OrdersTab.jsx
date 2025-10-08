/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMediaQuery } from "react-responsive";

import useOrders from "../../hooks/useOrders.js";
import OrdersToolbar from "../../components/admin/orders/OrdersToolbar.jsx";
import OrdersTable from "../../components/admin/orders/OrdersTable.jsx";
import OrdersCardsMobile from "../../components/admin/orders/OrdersCardsMobile.jsx";
import PaymentProofModal from "../../components/admin/orders/PaymentProofModal.jsx";
import OrderDetailsModal from "../../components/admin/orders/OrderDetailsModal.jsx";
import RejectionModal from "../../components/admin/orders/RejectionModal.jsx";

const OrdersTab = ({ isDarkMode }) => {
  // ======= HOOK: useOrders (handles pagination, filtering, etc.) =======
  const {
    orders,
    loading,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    sortConfig,
    requestSort,
    statusFilter,
    setStatusFilter,
    selectedOrders,
    setSelectedOrders,
    paginatedOrders,
    sortedAndFilteredOrders,
    totalPages,
    updateOrderStatus,
    updateMultipleStatuses,
    exportToCsv,
  } = useOrders();

  // ======= LOCAL STATES =======
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedPaymentProof, setSelectedPaymentProof] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionOrder, setRejectionOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // ======= RESPONSIVE CHECK =======
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  // ======= HELPERS =======
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

  // ======= KEEP SELECTED ORDER UPDATED AFTER CHANGES =======
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o._id === selectedOrder._id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders, selectedOrder]);

  // ======= HANDLE REJECTION =======
  const handleRejectOrder = (order) => {
    setRejectionOrder(order);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const confirmRejection = () => {
    if (rejectionOrder) {
      updateOrderStatus(rejectionOrder._id, "rejected", rejectionReason);
      setShowRejectionModal(false);
      setRejectionOrder(null);
      setRejectionReason("");
    }
  };

  // ======= PAGINATION UI =======
  const renderPagination = () => (
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

      <span
        className={`text-sm px-3 py-1.5 ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
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
  );

  // ======= TABLE COLUMNS =======
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

  // ======= RENDER =======
  return (
    <div className="space-y-8">
      {/* Toolbar (Search, Filters, Export, Bulk Update) */}
      <OrdersToolbar
        isDarkMode={isDarkMode}
        totalCount={sortedAndFilteredOrders.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        setCurrentPage={setCurrentPage}
        exportToCsv={exportToCsv}
        selectedOrders={selectedOrders}
        updateMultipleStatuses={updateMultipleStatuses}
      />

      {/* Table for Desktop / Cards for Mobile */}
      <div
        className={`${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } rounded-xl shadow-sm border ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {isMobile ? (
          <OrdersCardsMobile
            isDarkMode={isDarkMode}
            paginatedOrders={paginatedOrders}
            currencyFormatter={currencyFormatter}
            setSelectedOrder={setSelectedOrder}
            setShowOrderModal={setShowOrderModal}
            updateOrderStatus={updateOrderStatus}
            handleRejectOrder={handleRejectOrder}
          />
        ) : (
          <OrdersTable
            isDarkMode={isDarkMode}
            loading={loading}
            columns={columns}
            paginatedOrders={paginatedOrders}
            selectedOrders={selectedOrders}
            setSelectedOrders={setSelectedOrders}
            sortConfig={sortConfig}
            requestSort={requestSort}
            currencyFormatter={currencyFormatter}
            setSelectedOrder={setSelectedOrder}
            setShowOrderModal={setShowOrderModal}
            updateOrderStatus={updateOrderStatus}
            handleRejectOrder={handleRejectOrder}
          />
        )}

        {/* Pagination */}
        {paginatedOrders.length > 0 && (
          <div
            className={`px-4 py-3 border-t ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            } flex flex-col md:flex-row justify-between items-center gap-4`}
          >
            <p
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Showing{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                sortedAndFilteredOrders.length
              )}{" "}
              to{" "}
              {Math.min(
                currentPage * itemsPerPage,
                sortedAndFilteredOrders.length
              )}{" "}
              of {sortedAndFilteredOrders.length} orders
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
              {renderPagination()}
            </div>
          </div>
        )}
      </div>

      {/* ======= MODALS ======= */}
      <OrderDetailsModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        order={selectedOrder}
        isDarkMode={isDarkMode}
      />
      <PaymentProofModal
        imageUrl={selectedPaymentProof}
        onClose={() => setSelectedPaymentProof(null)}
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
