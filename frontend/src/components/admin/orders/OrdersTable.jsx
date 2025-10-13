// src/components/admin/orders/OrdersTable.jsx
import React, { useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import OrderActionsMenu from './OrderActionsMenu.jsx';

/**
 * Renders a table of orders with sorting, selection, and action capabilities.
 * @param {object} props - The component props.
 * @param {boolean} [props.isDarkMode=false] - Flag to enable dark mode styling.
 * @param {boolean} props.loading - Indicates if orders are currently being loaded.
 * @param {Array} props.columns - Configuration for the table columns.
 * @param {Array} props.paginatedOrders - The array of order objects to display for the current page.
 * @param {Array} props.selectedOrders - An array of IDs for the currently selected orders.
 * @param {function} props.setSelectedOrders - Function to update the selected orders.
 * @param {object} props.sortConfig - The current sorting configuration (key and direction).
 * @param {function} props.requestSort - Function to request a sort on a specific column.
 * @param {object} props.currencyFormatter - An Intl.NumberFormat instance for formatting currency.
 * @param {function} props.setSelectedOrder - Function to set the currently selected order for details view.
 * @param {function} props.setShowOrderModal - Function to control the visibility of the order details modal.
 * @param {function} props.updateOrderStatus - Function to update an order's status.
 * @param {function} props.handleRejectOrder - Function to handle the rejection of an order.
 */

export default function OrdersTable({
  isDarkMode = false,
  loading,
  columns,
  paginatedOrders,
  selectedOrders,
  setSelectedOrders,
  sortConfig,
  requestSort,
  currencyFormatter,
  setSelectedOrder,
  setShowOrderModal,
  updateOrderStatus,
  handleRejectOrder,
}) {
  const headerCheckboxRef = useRef(null);
  const allSelected = selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0;
  const someSelected = selectedOrders.length > 0 && selectedOrders.length < paginatedOrders.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected, allSelected]);
  return (
    <div className="overflow-x-hidden">
      <table className="w-full text-sm table-fixed">
        <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
          <tr>
            <th className="px-4 py-3 w-10">
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                checked={allSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedOrders(paginatedOrders.map((o) => o._id));
                  } else {
                    setSelectedOrders([]);
                  }
                }}
                aria-label="Select all orders on page"
                className={`w-4 h-4 text-pink-600 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} rounded focus:ring-pink-500`}
              />
            </th>

            {columns.slice(1).map((col) => (
              <th
                key={col.key || 'actions'}
                className={`px-4 py-3 text-left text-xs font-medium ${col.width} ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
              >
                {col.key ? (
                  <button
                    onClick={() => requestSort(col.key)}
                    className="flex items-center w-full space-x-1 text-left transition-colors hover:text-pink-500"
                  >
                    <span className="truncate">{col.label}</span>
                    {sortConfig.key === col.key &&
                      (sortConfig.direction === 'ascending' ? (
                        <ArrowUp className="flex-shrink-0 w-3 h-3" />
                      ) : (
                        <ArrowDown className="flex-shrink-0 w-3 h-3" />
                      ))}
                  </button>
                ) : (
                  <span className="truncate">{col.label}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Loading orders...
                </div>
              </td>
            </tr>
          ) : paginatedOrders.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No orders found.
              </td>
            </tr>
          ) : (
            paginatedOrders.map((order) => (
              <tr key={order._id} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order._id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedOrders((prev) => [...prev, order._id]);
                      else setSelectedOrders((prev) => prev.filter((id) => id !== order._id));
                    }}
                    aria-label={`Select order ${order.orderNumber || order._id}`}
                    className={`w-4 h-4 text-pink-600 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} rounded focus:ring-pink-500`}
                  />
                </td>

                <td className={`px-4 py-3 font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`} title={order.orderNumber || order._id}>
                  #{order.orderNumber || order._id?.substring(0, 8)}
                </td>

                <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  <div className="truncate max-w-32" title={order.username}>
                    {order.username}
                  </div>
                </td>

                <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  <div className="space-y-1">
                    {order.products?.slice(0, 2).map((product, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="inline-block truncate max-w-40">{product.name}</span>
                        <span className="ml-1 text-gray-500">(×{product.quantity})</span>
                      </div>
                    ))}
                    {order.products?.length > 2 && (
                      <div className="text-xs text-gray-500">+{order.products.length - 2} more items</div>
                    )}
                  </div>
                </td>

                <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="truncate max-w-32" title={`${order.shippingAddress?.city}, ${order.shippingAddress?.state}`}>
                    {order.shippingAddress?.city}, {order.shippingAddress?.state}
                  </div>
                </td>

                <td className={`px-4 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currencyFormatter.format(order.total || 0)}
                </td>

                <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>

                <td className="px-4 py-3">
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
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
