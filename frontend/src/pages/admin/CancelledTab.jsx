import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, Eye } from 'lucide-react';

import useOrders from '../../hooks/useOrders.js';
import OrderDetailsModal from '../../components/admin/orders/OrderDetailsModal.jsx';

function formatDate(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

export default function CancelledTab({ isDarkMode }) {
  const {
    orders,
    loading,
  } = useOrders();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Flatten cancelled items across all orders
  const cancellations = useMemo(() => {
    const rows = [];
    (orders || []).forEach((order) => {
      (order?.products || []).forEach((p) => {
        if (p?.cancelled) {
          rows.push({
            id: `${order._id}:${p.productId || p._id}`,
            orderId: order._id,
            orderNumber: order.orderNumber,
            username: order.username,
            status: order.status,
            productName: p.name,
            quantity: p.quantity,
            reason: p.cancellationReason || 'No reason provided',
            cancelledAt: p.cancelledAt,
            order,
          });
        }
      });
    });
    // newest first
    return rows.sort((a, b) => new Date(b.cancelledAt || 0) - new Date(a.cancelledAt || 0));
  }, [orders]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cancellations;
    return cancellations.filter((c) =>
      (c.orderNumber || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q) ||
      (c.productName || '').toLowerCase().includes(q) ||
      (c.reason || '').toLowerCase().includes(q)
    );
  }, [cancellations, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(pageStart, pageStart + itemsPerPage);

  return (
    <div className="space-y-8">
      {/* Header / Search */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cancelled Items</h2>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            All items cancelled by customers with reasons
          </p>
        </div>

        <div className="flex flex-col w-full gap-3 md:flex-row md:w-auto">
          <div className="w-full md:w-72">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <input
                type="text"
                placeholder="Search order, customer, product, reason..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Cancelled At</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Order Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={8} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading cancellations...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No cancelled items found.
                  </td>
                </tr>
              ) : (
                pageItems.map((c) => (
                  <tr key={c.id} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-4 py-3 font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>#{c.orderNumber || (c.orderId || '').substring(0, 8)}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.username}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.productName}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.quantity}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.reason}</td>
                    <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(c.cancelledAt)}</td>
                    <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.status}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelectedOrder(c.order); setShowOrderModal(true); }}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700"
                      >
                        <Eye className="w-4 h-4 mr-1" /> View Order
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col md:flex-row justify-between items-center gap-4`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {Math.min(pageStart + 1, filtered.length)} to {Math.min(pageStart + itemsPerPage, filtered.length)} of {filtered.length} cancellations
            </p>
            <div className="flex items-center space-x-2">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className={`text-sm rounded-md border px-2 py-1 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} focus:ring-pink-500 focus:border-pink-500`}
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
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                </button>
                <span className={`text-sm px-3 py-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:ring-2 focus:ring-pink-500 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                  }`}
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderDetailsModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        order={selectedOrder}
        isDarkMode={isDarkMode}
        onOpenProof={() => {}}
      />
    </div>
  );
}
