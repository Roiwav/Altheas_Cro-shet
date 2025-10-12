// src/components/admin/orders/PaymentProofPreview.jsx
import React from 'react';
import { Eye } from 'lucide-react';

/**
 * Renders a preview of the payment proof image.
 * Clicking the preview triggers the onClick handler, typically to open a full-size modal.
 * @param {object} props - The component props.
 * @param {string|null} props.url - The URL of the payment proof image.
 * @param {boolean} [props.isDarkMode=false] - Flag to enable dark mode styling.
 * @param {function} props.onClick - Callback function to execute when the preview is clicked.
 */
export default function PaymentProofPreview({ url, isDarkMode = false, onClick }) {
  if (!url) return null;
  return (
    <div
      className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}
    >
      <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Payment Proof</h3>
      <div className="relative inline-block cursor-pointer" onClick={onClick}>
        <img
          src={url}
          alt="Payment Proof"
          className="w-full max-w-xs transition-shadow border border-gray-300 rounded-lg dark:border-gray-600 hover:shadow-md"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/placeholder-receipt.jpg';
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black bg-opacity-50 rounded-lg opacity-0 hover:opacity-100">
          <Eye className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
