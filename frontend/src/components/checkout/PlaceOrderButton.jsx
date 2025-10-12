// src/components/checkout/PlaceOrderButton.jsx
import React from 'react';
import { Loader2, Camera, ShoppingBag } from 'lucide-react';

/**
 * A dynamic button for placing an order.
 * Its appearance and text change based on the checkout state:
 * - Shows a loader when the order is being placed.
 * - Prompts for payment proof if it's missing.
 * - Shows the final order total when ready to place.
 * - Is disabled if the order cannot be placed.
 * @param {object} props - The component props.
 * @param {boolean} props.canPlaceOrder - Whether the button should be enabled.
 * @param {boolean} props.isPlacingOrder - Whether the order is currently being submitted.
 * @param {function} props.onPlaceOrder - Callback function to execute when the button is clicked.
 * @param {number} props.totalCost - The total cost of the order.
 * @param {object} props.currencyFormatter - An Intl.NumberFormat instance for formatting currency.
 * @param {boolean} props.hasPaymentProof - Whether the payment proof has been uploaded.
 */
export default function PlaceOrderButton({
  canPlaceOrder, isPlacingOrder, onPlaceOrder, totalCost, currencyFormatter, hasPaymentProof
}) {
  return (
    <button
      disabled={!canPlaceOrder}
      onClick={onPlaceOrder}
      className={`w-full py-3 sm:py-4 font-bold text-base sm:text-lg rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 ${ 
        canPlaceOrder
          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl text-white'
          : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
      }`}
    >
      {isPlacingOrder ? (
        <>
          {/* State: Order is being submitted */}
          <Loader2 className="w-6 h-6 animate-spin" />
          Placing Order...
        </>
      ) : !hasPaymentProof ? (
        <>
          {/* State: Payment proof is required */}
          <Camera className="w-6 h-6" />
          <span className="hidden sm:inline">Upload Payment Proof First</span>
          <span className="sm:hidden">Upload Proof</span>
        </>
      ) : (
        <>
          {/* State: Ready to place order */}
          <ShoppingBag className="w-6 h-6" />
          <span className="hidden sm:inline">Place Order • {currencyFormatter.format(totalCost)}</span>
          <span className="sm:hidden">Place Order</span>
        </>
      )}
    </button>
  );
}
