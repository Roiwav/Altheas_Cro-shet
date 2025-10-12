// src/components/checkout/DeliveryAddressCard.jsx
import React from 'react';
import { MapPin, Truck } from 'lucide-react';
import { formatPHP } from '../../utils/currency';

/**
 * A card component that displays the delivery address for an order.
 * It shows the full address and shipping fee if an address is provided,
 * or a prompt to add an address if one is not available.
 * @param {object} props - The component props.
 * @param {object|null} props.address - The user's shipping address object.
 * @param {number} props.shippingFee - The calculated shipping fee for the address.
 * @param {function} props.onChangeAddress - Callback function to trigger the address change/add modal.
 */
export default function DeliveryAddressCard({ address, shippingFee, onChangeAddress }) {
  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
      <div className="px-6 py-4 border-b border-orange-100 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/30">
            <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Delivery Address</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Where should we deliver your order?</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Renders a prompt to add an address if none is provided */}
        {!address ? (
          <div className="py-8 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="mb-2 text-gray-500 dark:text-gray-400">No shipping address available</p>
            <button
              onClick={onChangeAddress}
              className="text-sm font-medium text-orange-600 underline hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
            >
              Add Address
            </button>
          </div>
        ) : (
          /* Renders the address details and a button to change it */
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {[address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Truck className="w-4 h-4" />
                  <span>Shipping: {formatPHP(shippingFee)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onChangeAddress}
              className="ml-4 text-sm font-medium text-orange-600 underline hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 shrink-0"
            >
              Change Address
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
