// src/components/checkout/PaymentMethodCard.jsx
import React from 'react';
import { CreditCard } from 'lucide-react';

export default function PaymentMethodCard({ method, setMethod, gcashIcon }) {
  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
      <div className="px-6 py-4 border-b border-purple-100 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
            <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Payment Method</h3>
          </div>
        </div>
      </div>
      <div className="p-6">
        <label className="flex items-center p-4 transition-colors border-2 border-orange-300 cursor-pointer rounded-xl dark:border-orange-500 bg-orange-50 dark:bg-orange-900/10 hover:border-orange-400 dark:hover:border-orange-400">
          <input
            type="radio"
            name="paymentMethod"
            value="GCash"
            checked={method === 'GCash'}
            onChange={() => setMethod('GCash')}
            className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500"
          />
          <img src={gcashIcon} alt="GCash" className="w-auto h-8 ml-4" />
          <div className="flex-1 ml-3">
            <p className="font-medium text-gray-900 dark:text-white">GCash</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Fast and secure mobile payment</p>
          </div>
        </label>
      </div>
    </div>
  );
}
