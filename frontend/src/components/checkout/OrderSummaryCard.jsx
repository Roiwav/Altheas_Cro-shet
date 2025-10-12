// src/components/checkout/OrderSummaryCard.jsx
import React from 'react';
import { CreditCard } from 'lucide-react';

/**
 * A card component that displays a summary of the order costs.
 * It shows the subtotal, shipping fee, and the final total cost.
 * @param {object} props - The component props.
 * @param {number} props.itemsCount - The total number of items in the order.
 * @param {number} props.subtotal - The subtotal cost of all items.
 * @param {number} props.shippingFee - The calculated shipping fee.
 * @param {number} props.totalCost - The final total cost (subtotal + shipping).
 * @param {object} props.currencyFormatter - An Intl.NumberFormat instance for formatting currency.
 */
export default function OrderSummaryCard({ itemsCount, subtotal, shippingFee, totalCost, currencyFormatter }) {
  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
      <div className="px-6 py-4 border-b border-green-100 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
            <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Order Summary</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{itemsCount} item(s)</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Subtotal ({itemsCount} items)</span>
          <span>{currencyFormatter.format(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Shipping Fee</span>
          <span>{currencyFormatter.format(shippingFee)}</span>
        </div>
        <hr className="border-gray-200 dark:border-gray-700" />
        <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
          <span>Total</span>
          <span className="text-green-600 dark:text-green-400">{currencyFormatter.format(totalCost)}</span>
        </div>
      </div>
    </div>
  );
}
