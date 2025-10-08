// src/components/admin/orders/OrdersToolbar.jsx
import React from 'react';
import { Search, Download } from 'lucide-react';

export default function OrdersToolbar({
  isDarkMode = false,
  totalCount = 0,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  setCurrentPage,
  exportToCsv,
  selectedOrders = [],
  updateMultipleStatuses,
}) {
  return (
    <>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Orders Management</h2>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage and track customer orders ({totalCount} total)
          </p>
        </div>

        <div className="flex flex-col w-full gap-3 md:flex-row md:w-auto">
          <div className="w-full md:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className={`block w-full sm:w-40 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={exportToCsv}
            className={`inline-flex items-center justify-center px-3 py-2 text-sm font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {selectedOrders.length > 0 && (
        <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex flex-wrap gap-2">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedOrders.length} order(s) selected:
            </span>
            <button
              onClick={() => updateMultipleStatuses('processing')}
              className="px-3 py-1 text-sm text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Mark as Processing
            </button>
            <button
              onClick={() => updateMultipleStatuses('shipped')}
              className="px-3 py-1 text-sm text-white transition-colors bg-purple-500 rounded-md hover:bg-purple-600"
            >
              Mark as Shipped
            </button>
            <button
              onClick={() => updateMultipleStatuses('delivered')}
              className="px-3 py-1 text-sm text-white transition-colors bg-green-500 rounded-md hover:bg-green-600"
            >
              Mark as Delivered
            </button>
          </div>
        </div>
      )}
    </>
  );
}
