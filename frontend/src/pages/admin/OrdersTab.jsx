import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { toast } from 'react-toastify';
import { Menu, Transition } from '@headlessui/react';
import { Search, ArrowUp, ArrowDown, ChevronDown, Clock, RefreshCw, Truck, CheckCircle, XCircle, X, Check, ArrowLeft, ArrowRight } from 'lucide-react';

const OrdersTab = ({ isDarkMode }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5001/api/orders", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : data.orders || []);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        toast.error("Failed to fetch orders.");
      })
      .finally(() => setLoading(false));
  }, []);

  const updateOrderStatus = (orderId, formattedStatus) => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: formattedStatus }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          toast.error("Failed to update order: " + (data.message || "Unknown error"));
          return;
        }
        toast.success(`Order #${orderId} status updated to ${formattedStatus}`);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId ? { ...order, status: formattedStatus } : order
          )
        );
      })
      .catch((err) => {
        console.error("Network error:", err);
        toast.error("Network error updating order status.");
      });
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return orders;
    const query = trimmedQuery.toLowerCase();
    return orders.filter(order => {
      if (!order) return false;
      if (order._id?.toLowerCase().includes(query)) return true;
      if (order.fullname?.toLowerCase().includes(query)) return true;
      if (order.email?.toLowerCase().includes(query)) return true;
      if (order.phoneNumber?.includes(query)) return true;
      if (order.status?.toLowerCase().includes(query)) return true;
      if (order.products?.some(p => p.name?.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query)))) return true;
      if (order.product_name?.toLowerCase().includes(query)) return true;
      if (order.shippingAddress) {
        const { address, city, state, postalCode, country } = order.shippingAddress;
        if ((address && address.toLowerCase().includes(query)) || (city && city.toLowerCase().includes(query)) || (state && state.toLowerCase().includes(query)) || (postalCode && postalCode.includes(query)) || (country && country.toLowerCase().includes(query))) return true;
      }
      if (order.paymentMethod?.toLowerCase().includes(query)) return true;
      if (order.total?.toString().includes(query)) return true;
      return false;
    });
  }, [orders, searchQuery]);

  const sortedAndFilteredOrders = useMemo(() => {
    if (!sortConfig.key) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      const numericKeys = ['id', 'quantity', 'shipping_fee', 'total_price'];
      const dateKeys = ['createdAt'];
      let valA, valB;
      if (numericKeys.includes(sortConfig.key)) {
        valA = parseFloat(aValue) || 0;
        valB = parseFloat(bValue) || 0;
      } else if (dateKeys.includes(sortConfig.key)) {
        valA = new Date(aValue).getTime() || 0;
        valB = new Date(bValue).getTime() || 0;
      } else {
        valA = String(aValue).toLowerCase();
        valB = String(bValue).toLowerCase();
      }
      if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAndFilteredOrders.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const StatusBadge = ({ status }) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800',
      shipped: isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-800',
      delivered: isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800',
      rejected: isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800',
      cancelled: isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status?.toLowerCase()] || (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')}`}>
        {status}
      </span>
    );
  };

  const renderActions = (order) => {
    const statusOptions = [
      { value: 'pending', label: 'Mark as Pending', icon: Clock, color: 'text-yellow-500' },
      { value: 'processing', label: 'Mark as Processing', icon: RefreshCw, color: 'text-blue-500' },
      { value: 'shipped', label: 'Mark as Shipped', icon: Truck, color: 'text-indigo-500' },
      { value: 'delivered', label: 'Mark as Delivered', icon: CheckCircle, color: 'text-green-500' },
      { value: 'rejected', label: 'Reject Order', icon: XCircle, color: 'text-red-500' },
      { value: 'cancelled', label: 'Cancel Order', icon: X, color: 'text-gray-500' },
    ];
    return (
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className={`inline-flex items-center justify-center w-full rounded-md border shadow-sm px-4 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'}`}>
            <span>Actions</span>
            <ChevronDown className="w-4 h-4 ml-2 -mr-1" aria-hidden="true" />
          </Menu.Button>
        </div>
        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
          <Menu.Items className={`absolute right-0 mt-2 w-64 origin-top-right divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="px-1 py-1">
              <div className={`px-3 py-2 text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>UPDATE ORDER STATUS</div>
              {statusOptions.map((status) => {
                const Icon = status.icon;
                return (
                  <Menu.Item key={status.value}>
                    {({ active }) => (
                      <button onClick={() => updateOrderStatus(order._id, status.value)} className={`${active ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : (isDarkMode ? 'text-gray-200' : 'text-gray-700')} group flex w-full items-center rounded-md px-3 py-2.5 text-sm transition-colors duration-150`}>
                        <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${status.color}`} />
                        <span className="flex-1 text-left">{status.label}</span>
                        {order.status === status.value && (<Check className="w-4 h-4 text-green-500" />)}
                      </button>
                    )}
                  </Menu.Item>
                );
              })}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    );
  };

  const renderPagination = () => (
    <div className="flex items-center space-x-2">
      <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
        <ArrowLeft className="w-4 h-4 mr-1" />
        <span>Previous</span>
      </button>
      <span className={`text-sm px-3 py-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {currentPage} of {totalPages}
      </span>
      <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
        <span>Next</span>
        <ArrowRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );

  const columns = [
    { key: 'orderNumber', label: 'Order ID', width: 'w-24' },
    { key: 'fullname', label: 'Customer', width: 'w-40' },
    { key: 'products', label: 'Product', width: 'w-48' },
    { key: 'region', label: 'Region', width: 'w-24' },
    { key: 'shippingFee', label: 'Shipping', width: 'w-20' },
    { key: 'total', label: 'Total', width: 'w-24' },
    { key: 'createdAt', label: 'Date', width: 'w-32' },
    { key: 'status', label: 'Status', width: 'w-28' },
    { key: null, label: 'Actions', width: 'w-28' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Orders</h2>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage and track customer orders
          </p>
        </div>
        <div className="w-full sm:w-64">
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
      </div>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                {columns.map(col => (
                  <th key={col.key || 'actions'} className={`px-3 py-2 text-left text-xs font-medium ${col.width} ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {col.key ? (
                      <button onClick={() => requestSort(col.key)} className="flex items-center w-full space-x-1 text-left transition-colors hover:text-pink-500">
                        <span className="truncate">{col.label}</span>
                        {sortConfig.key === col.key && (sortConfig.direction === 'ascending' ? <ArrowUp className="flex-shrink-0 w-3 h-3" /> : <ArrowDown className="flex-shrink-0 w-3 h-3" />)}
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
                  <td colSpan={columns.length} className={`px-3 py-10 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading orders...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className={`px-3 py-4 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {searchQuery ? 'No orders match your search.' : 'No orders found.'}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => (
                  <tr key={o._id} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                    <td className={`px-3 py-2 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`} title={o.orderNumber || o._id}>
                      {o.orderNumber || o._id?.substring(0, 8)}
                    </td>
                    <td className={`px-3 py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="truncate" title={o.username || o.userId?.fullname}>
                        {o.username || o.userId?.fullname}
                      </div>
                    </td>
                    <td className={`px-3 py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="truncate" title={o.products?.map(p => `${p.name} (x${p.quantity})`).join(", ")}>
                        {o.products?.map(p => `${p.name} (x${p.quantity})`).join(", ")}
                      </div>
                    </td>
                    <td className={`px-3 py-2 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`} title={o.shippingAddress?.state || o.region || "-"}>
                      {o.shippingAddress?.state || o.region || "-"}
                    </td>
                    <td className={`px-3 py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      ₱{parseFloat(o.shippingFee || 0).toLocaleString()}
                    </td>
                    <td className={`px-3 py-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      ₱{Number(o.total || 0).toLocaleString()}
                    </td>
                    <td className={`px-3 py-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="w-full">
                        <StatusBadge status={o.status} />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end">
                        {renderActions(o)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {paginatedOrders.length > 0 && (
          <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedAndFilteredOrders.length)} to {Math.min(currentPage * itemsPerPage, sortedAndFilteredOrders.length)} of {sortedAndFilteredOrders.length} orders
            </p>
            <div className="flex items-center space-x-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`text-sm rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} focus:ring-pink-500 focus:border-pink-500`}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
              {renderPagination()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTab;