// src/components/admin/orders/OrderDetailsModal.jsx
import React from 'react';
import { Dialog } from '@headlessui/react';
import { X, AlertCircle, CheckCircle, Clock, Package, MapPin, CreditCard, User } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import PaymentProofPreview from './PaymentProofPreview.jsx';
import { getMediaUrl, getProductImageSrc } from '../../../utils/product.js';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function OrderDetailsModal({ open, onClose, order, isDarkMode = false, onOpenProof }) {
  if (!open || !order) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-4">
          <Dialog.Panel className={`mx-auto max-w-4xl w-full rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Order Details - #{order.orderNumber || order._id?.substring(0, 8)}
              </Dialog.Title>
              <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {order.statusMessage && (
              <div className={`mb-6 p-4 rounded-lg border ${
                order.status === 'rejected' || order.status === 'cancelled'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : order.status === 'delivered'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${
                    order.status === 'rejected' || order.status === 'cancelled'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : order.status === 'delivered'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {order.status === 'rejected' || order.status === 'cancelled' ? (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : order.status === 'delivered' ? (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      order.status === 'rejected' || order.status === 'cancelled'
                        ? 'text-red-800 dark:text-red-200'
                        : order.status === 'delivered'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-blue-800 dark:text-blue-200'
                    }`}>
                      {order.statusMessage}
                    </p>
                    {order.statusUpdatedAt && (
                      <p className={`text-xs mt-1 ${
                        order.status === 'rejected' || order.status === 'cancelled'
                          ? 'text-red-600 dark:text-red-400'
                          : order.status === 'delivered'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        Updated {formatDate(order.statusUpdatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`font-medium mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <User className="w-4 h-4 mr-2" />
                    Customer Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      <strong>Name:</strong> {order.username}
                    </p>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      <strong>Order Date:</strong> {formatDate(order.createdAt)}
                    </p>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      <strong>Payment Method:</strong> {order.paymentMethod}
                    </p>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      <strong>Status:</strong> <StatusBadge status={order.status} />
                    </p>
                    {order.rejectionReason && (
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        <strong>Rejection Reason:</strong> {order.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`font-medium mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Package className="w-4 h-4 mr-2" />
                    Products ({order.products?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {order.products?.map((product, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <img
                          src={getProductImageSrc(product.image)}
                          alt={product.name}
                          className="object-cover w-12 h-12 border border-gray-300 rounded-lg dark:border-gray-600"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>Image not available</text></svg>";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <p>
                              Qty: {product.quantity} × {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(product.price)}
                            </p>
                            {product.color && <p>Color: {product.color}</p>}
                            {product.variation && <p>Variation: {product.variation}</p>}
                          </div>
                        </div>
                        <div className={`text-right font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(product.price * product.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.shippingAddress && (
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`font-medium mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Shipping Address
                    </h3>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <p>{order.shippingAddress.line1}</p>
                      {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`font-medium mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Order Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} flex justify-between`}>
                      <span>Subtotal:</span>
                      <span>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format((order.total || 0) - (order.shippingFee || 0))}</span>
                    </div>
                    <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} flex justify-between`}>
                      <span>Shipping:</span>
                      <span>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(order.shippingFee || 0)}</span>
                    </div>
                    <div className={`${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-200'} flex justify-between font-semibold text-base pt-2 border-t`}>
                      <span>Total:</span>
                      <span>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(order.total || 0)}</span>
                    </div>
                  </div>
                </div>

                {order.paymentProofUrl && (
                  <PaymentProofPreview
                    url={getMediaUrl(order.paymentProofUrl)}
                    isDarkMode={isDarkMode}
                    onClick={() => onOpenProof && onOpenProof(getMediaUrl(order.paymentProofUrl))}
                  />
                )}
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
