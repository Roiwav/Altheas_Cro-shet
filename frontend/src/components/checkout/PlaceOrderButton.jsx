// src/components/checkout/PlaceOrderButton.jsx
import React from 'react';
import { Loader2, Camera, ShoppingBag } from 'lucide-react';

export default function PlaceOrderButton({ canPlaceOrder, isPlacingOrder, onPlaceOrder, totalCost, currencyFormatter, hasPaymentProof }) {
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
          <Loader2 className="w-6 h-6 animate-spin" />
          Placing Order...
        </>
      ) : !hasPaymentProof ? (
        <>
          <Camera className="w-6 h-6" />
          <span className="hidden sm:inline">Upload Payment Proof First</span>
          <span className="sm:hidden">Upload Proof</span>
        </>
      ) : (
        <>
          <ShoppingBag className="w-6 h-6" />
          <span className="hidden sm:inline">Place Order • {currencyFormatter.format(totalCost)}</span>
          <span className="sm:hidden">Place Order</span>
        </>
      )}
    </button>
  );
}
