// src/components/admin/orders/OrdersCardsMobile.jsx
import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import OrderActionsMenu from './OrderActionsMenu.jsx';

export default function OrdersCardsMobile({
  isDarkMode = false,
  paginatedOrders = [],
  currencyFormatter,
  setSelectedOrder,
  setShowOrderModal,
  updateOrderStatus,
  handleRejectOrder,
}) {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {paginatedOrders.map((order) => (
        <div key={order._id} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs text-gray-500 dark:text-gray-400">#{order.orderNumber || order._id?.substring(0, 8)}</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.username}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900 dark:text-white">{currencyFormatter.format(order.total || 0)}</p>
              <StatusBadge status={order.status} />
            </div>
          </div>
          <div className="flex items-center justify-end mt-3">
            <OrderActionsMenu
              order={order}
              isDarkMode={isDarkMode}
              onViewDetails={() => {
                setSelectedOrder(order);
                setShowOrderModal(true);
              }}
              updateOrderStatus={updateOrderStatus}
              handleRejectOrder={handleRejectOrder}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
