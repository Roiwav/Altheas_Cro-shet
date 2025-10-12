// src/components/checkout/OrderItemsCard.jsx
import React from 'react';
import { Package } from 'lucide-react';

/**
 * A card component that displays a list of items included in the order.
 * Each item shows an image, name, quantity, and price.
 * @param {object} props - The component props.
 * @param {Array<object>} props.items - An array of item objects to display.
 * @param {function} props.getProductImageSrc - A utility function to resolve the correct image source URL.
 * @param {object} props.currencyFormatter - An Intl.NumberFormat instance for formatting currency.
 */
export default function OrderItemsCard({ items, getProductImageSrc, currencyFormatter }) {
  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
      <div className="px-6 py-4 border-b border-blue-100 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Order Items</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{items.length} item(s) to be ordered</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {items.map((item, index) => (
          // Using index as a key is acceptable here as the list is static during render.
          <div key={index} className="p-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={getProductImageSrc(item.image)}
                  alt={item.name}
                  className="object-cover w-20 h-20 border border-gray-200 rounded-xl dark:border-gray-600"
                  loading="lazy"
                  decoding="async"
                  // Fallback to a placeholder SVG if the image fails to load.
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>Image not available</text></svg>";
                  }}
                />
                <div className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full -top-2 -right-2">
                  {item.quantity || 1}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                {item.color && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Color: {item.color}</p>
                )}
                {item.variation && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Variation: {item.variation}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {currencyFormatter.format(item.price)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Qty: {item.quantity || 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
