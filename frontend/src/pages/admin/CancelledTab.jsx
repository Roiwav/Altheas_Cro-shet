import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, Eye, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useUser } from '../../context/useUser.js';
import { SERVER_BASE_URL } from '../../utils/product.js';

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
    refetch,
  } = useOrders();
  const { token: authToken, user } = useUser();

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
            productId: p.productId || p._id,
            orderNumber: order.orderNumber,
            username: order.username,
            status: order.status,
            refundStatus: p.refundStatus,
            productName: p.name,
            quantity: p.quantity,
            price: p.price,
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

  // Split into unresolved and resolved groups
  const unresolved = useMemo(() => filtered.filter(c => (c.refundStatus || 'Pending') !== 'Completed'), [filtered]);
  const resolved = useMemo(() => filtered.filter(c => c.refundStatus === 'Completed'), [filtered]);

  const totalPages = Math.ceil(unresolved.length / itemsPerPage) || 1;
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageItems = unresolved.slice(pageStart, pageStart + itemsPerPage);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null); // { orderId, productId, productName, defaultAmount }
  const [etaHours, setEtaHours] = useState(24);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const _openConfirm = (row) => {
    const defaultAmount = (Number(row.price) || 0) * (Number(row.quantity) || 1);
    setConfirmItem({
      orderId: row.orderId,
      productId: row.productId,
      productName: row.productName,
      defaultAmount,
    });
    setEtaHours(24);
    setAmount(String(defaultAmount));
    setMessage(`Your refund for ${row.productName} is being processed and will be returned within 24 hour(s).`);
    setConfirmOpen(true);
  };

  const markDone = async (row) => {
    try {
      if (user && user.role && user.role !== 'admin') {
        throw new Error('Forbidden: Admins only');
      }
      const rawToken =
        authToken ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        '';
      const cleanToken = String(rawToken)
        .trim()
        .replace(/^Bearer\s+/i, '')
        .replace(/^"|"$/g, '');
      if (!cleanToken) throw new Error('Not authenticated. Please log in again.');

      const res = await fetch(
        `${SERVER_BASE_URL}/api/v1/orders/${row.orderId}/product/${row.productId}/mark-done`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${cleanToken}`,
          },
          credentials: 'include',
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) throw new Error('Forbidden: Admins only');
      if (res.status === 401) throw new Error(data.message || 'Not authorized, token failed');
      if (!res.ok) throw new Error(data.message || 'Failed to mark as done');
      toast.success('Marked as done');
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to mark as done');
    }
  };

  const submitConfirm = async () => {
    if (!confirmItem) return;
    try {
      if (user && user.role && user.role !== 'admin') {
        throw new Error('Forbidden: Admins only');
      }
      // Resolve and sanitize token
      const rawToken =
        authToken ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        '';
      const cleanToken = String(rawToken)
        .trim()
        .replace(/^Bearer\s+/i, '')
        .replace(/^"|"$/g, '');

      if (!cleanToken) {
        throw new Error('Not authenticated. Please log in again.');
      }
      // Proceed; backend will return 401 if token is invalid

      const res = await fetch(
        `${SERVER_BASE_URL}/api/v1/orders/${confirmItem.orderId}/product/${confirmItem.productId}/confirm-cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${cleanToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            etaHours: Number(etaHours) || 24,
            amount: Number(amount) || confirmItem.defaultAmount,
            message,
          }),
        }
      );
      const data = await res.json();
      if (res.status === 403) throw new Error('Forbidden: Admins only');
      if (res.status === 401) throw new Error(data.message || 'Not authorized, token failed');
      if (!res.ok) throw new Error(data.message || 'Failed to confirm cancellation');
      toast.success('Cancellation confirmed and customer notified');
      setConfirmOpen(false);
      setConfirmItem(null);
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to confirm cancellation');
    }
  };

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

      {/* To Resolve Table */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Refund</th>
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
                    No cancelled items to resolve.
                  </td>
                </tr>
              ) : (
                pageItems.map((c) => (
                  <tr key={c.id} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-4 py-3 font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>#{c.orderNumber || (c.orderId || '').substring(0, 8)}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.username}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.productName}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.quantity}</td>
                    <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.refundStatus || 'Pending'}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.reason}</td>
                    <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(c.cancelledAt)}</td>
                    <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.status}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button 
                        onClick={() => { setSelectedOrder(c.order); setShowOrderModal(true); }}
                        title="View Order Details"
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => _openConfirm(c)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 dark:focus:ring-offset-gray-800"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        <span>Confirm Refund</span>
                      </button>
                      <button
                        onClick={() => markDone(c)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        <span>Mark as Done</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {unresolved.length > 0 && (
          <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col md:flex-row justify-between items-center gap-4`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {Math.min(pageStart + 1, unresolved.length)} to {Math.min(pageStart + itemsPerPage, unresolved.length)} of {unresolved.length} cancellations
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

      {/* Resolved Table */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="px-4 pt-4">
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Resolved (Done)</h3>
          <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cancelled items that were completed</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Refund</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Cancelled At</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Order Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={8} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading...
                  </td>
                </tr>
              ) : resolved.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No resolved cancellations.
                  </td>
                </tr>
              ) : (
                resolved.map((c) => (
                  <tr key={c.id} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-4 py-3 font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>#{c.orderNumber || (c.orderId || '').substring(0, 8)}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.username}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.productName}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.quantity}</td>
                    <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>{c.refundStatus}</td>
                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.reason}</td>
                    <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(c.cancelledAt)}</td>
                    <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{c.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <OrderDetailsModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        order={selectedOrder}
        isDarkMode={isDarkMode}
        onOpenProof={() => {}}
      />

      {/* Confirm Refund Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmOpen(false)}>
          <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full max-w-md rounded-lg p-5`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Confirm Refund</h3>
            <p className="text-sm mb-4">Send a refund confirmation to the customer for <strong>{confirmItem?.productName}</strong>.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">ETA (hours)</label>
                <input type="number" value={etaHours} onChange={(e) => setEtaHours(e.target.value)} className={`w-full rounded-md border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} min={1} />
              </div>
              <div>
                <label className="block text-sm mb-1">Refund Amount (PHP)</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full rounded-md border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} />
              </div>
              <div>
                <label className="block text-sm mb-1">Message to customer</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className={`w-full rounded-md border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmOpen(false)} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={submitConfirm} className="px-3 py-1.5 text-sm rounded-md bg-pink-600 text-white hover:bg-pink-700">Confirm & Notify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
