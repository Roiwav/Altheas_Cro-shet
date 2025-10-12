// src/components/admin/orders/RejectionModal.jsx
import React from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { formatPHP } from '../../../utils/currency.js';

/**
 * A modal for administrators to reject an order and provide an optional reason.
 * @param {object} props - The component props.
 * @param {boolean} props.open - Whether the modal is open.
 * @param {function} props.onClose - Callback function to close the modal.
 * @param {object} props.order - The order object being rejected.
 * @param {boolean} [props.isDarkMode=false] - Flag to enable dark mode styling.
 * @param {string} props.rejectionReason - The current value of the rejection reason input.
 * @param {function} props.setRejectionReason - Function to update the rejection reason state.
 * @param {function} props.onConfirm - Callback function to confirm the rejection.
 */

export default function RejectionModal({
  open,
  onClose,
  order,
  isDarkMode = false,
  rejectionReason,
  setRejectionReason,
  onConfirm,
}) {
  if (!open || !order) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-4">
          <Dialog.Panel className={`mx-auto max-w-md w-full rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Reject Order #{order.orderNumber || order._id?.substring(0, 8)}
              </Dialog.Title>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
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
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                rows={3}
              />
            </div>

            <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                <strong>Note:</strong> Rejecting this order will automatically process a full refund of {formatPHP(order.total || 0)} within 5-7 business days.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-colors ${
                  isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
              >
                Reject Order
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
