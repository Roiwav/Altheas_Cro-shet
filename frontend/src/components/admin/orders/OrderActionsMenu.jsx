// src/components/admin/orders/OrderActionsMenu.jsx
import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown, Clock, RefreshCw, Truck, CheckCircle, X, XCircle, Check, Eye } from 'lucide-react';

export default function OrderActionsMenu({ order, isDarkMode = false, onViewDetails, updateOrderStatus, handleRejectOrder }) {
  const statusOptions = [
    { value: 'pending', label: 'Mark as Pending', icon: Clock, color: 'text-yellow-500' },
    { value: 'processing', label: 'Mark as Processing', icon: RefreshCw, color: 'text-blue-500' },
    { value: 'shipped', label: 'Mark as Shipped', icon: Truck, color: 'text-purple-500' },
    { value: 'delivered', label: 'Mark as Delivered', icon: CheckCircle, color: 'text-green-500' },
    { value: 'cancelled', label: 'Cancel Order', icon: X, color: 'text-gray-500' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onViewDetails}
        className={`p-2 rounded-lg transition-colors ${
          isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        title="View order details"
      >
        <Eye className="w-4 h-4" />
      </button>

      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button className={`inline-flex items-center justify-center rounded-md border shadow-sm px-3 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
          isDarkMode ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}>
          Actions
          <ChevronDown className="w-4 h-4 ml-1" />
        </Menu.Button>

        <Transition as={Fragment}>
          <Menu.Items className={`absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="px-1 py-1">
              {statusOptions.map((status) => {
                const Icon = status.icon;
                return (
                  <Menu.Item key={status.value}>
                    {({ active }) => (
                      <button
                        onClick={() => updateOrderStatus(order._id, status.value)}
                        className={`${
                          active ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : (isDarkMode ? 'text-gray-200' : 'text-gray-700')
                        } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                      >
                        <Icon className={`mr-3 h-4 w-4 ${status.color}`} />
                        {status.label}
                        {order.status === status.value && <Check className="w-4 h-4 ml-auto text-green-500" />}
                      </button>
                    )}
                  </Menu.Item>
                );
              })}

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleRejectOrder(order)}
                    className={`${
                      active ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : (isDarkMode ? 'text-gray-200' : 'text-gray-700')
                    } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                  >
                    <XCircle className="w-4 h-4 mr-3 text-red-500" />
                    Reject Order
                    {order.status === 'rejected' && <Check className="w-4 h-4 ml-auto text-green-500" />}
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
