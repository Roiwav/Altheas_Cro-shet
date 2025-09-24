import React, { useEffect, useState, useMemo, Fragment } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../../context/useUser";
import AdminNavbar from "../../components/admin/AdminNavbar.jsx"
import { useDarkMode } from "../../context/DarkModeContext.jsx";
import { Search, ArrowUp, ArrowDown, X, ChevronDown, Package, Truck, CheckCircle, XCircle, Trash2, LayoutDashboard, ShoppingCart, Box, Users, MessageSquare, Mail, Settings as SettingsIcon, UploadCloud, Image as ImageIcon, Plus } from "lucide-react";
import logoSrc from '../../assets/images/icons/logo althea.jpg'; // Import the logo
import { Dialog, Transition, Menu } from '@headlessui/react';
import { toast } from 'react-toastify';

export default function AdminPage() {
  const { isDarkMode } = useDarkMode();
  const { user } = useUser();
  const [metrics, setMetrics] = useState({
    revenue: 0,
    incomingOrders: 0,
    shippedProducts: 0,
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items per page
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [feedbacks, setFeedbacks] = useState([
    { id: 1, name: 'Jane Doe', email: 'jane.d@example.com', message: 'Absolutely love the crochet flowers! The quality is amazing and they look beautiful in my living room.', created_at: '2023-10-26T10:00:00Z' },
    { id: 2, name: 'John Smith', email: 'john.s@example.com', message: 'Great customer service and fast shipping. The packaging was also very lovely. Will definitely buy again!', created_at: '2023-10-25T14:30:00Z' },
    { id: 3, name: 'Emily White', email: 'emily.w@example.com', message: 'The sunflower is so cheerful and well-made. It brightens up my desk.', created_at: '2023-10-25T11:20:00Z' },
  ]);
  const [subscribers, setSubscribers] = useState([
    { id: 1, email: 'subscriber1@example.com', subscribed_at: '2023-10-24T09:00:00Z' },
    { id: 2, email: 'subscriber2@example.com', subscribed_at: '2023-10-23T18:45:00Z' },
    { id: 3, email: 'another.fan@example.com', subscribed_at: '2023-10-22T12:00:00Z' },
  ]);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'dashboard';
  });
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "products", label: "Products", icon: Box },
    { id: "users", label: "Users", icon: Users },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "subscribers", label: "Subscribers", icon: Mail },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  // Fetch orders from backend
  const fetchOrders = () => {
    setLoading(true);
    fetch("/croshet_db/get-order.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.orders) {
          setOrders(data.orders);
        } else {
          console.error("Invalid response structure:", data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    // Calculate metrics from orders
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

    const incoming = orders.filter(o => o.status === 'pending').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;

    setMetrics({
      revenue: totalRevenue,
      incomingOrders: incoming,
      shippedProducts: shipped,
    });
  }, [orders]);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  // Reset to first page when sorting or filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig]);

  if (user?.role !== "admin") {
    return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  }

  // Update order status via backend API
  const updateOrderStatus = (orderId, newStatus) => {
    const formData = new FormData();
    formData.append("order_id", orderId);
    formData.append("status", newStatus);

    fetch("/croshet_db/update-order.php", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          fetchOrders(); // Refresh after update
        } else {
          alert("Failed to update order: " + data.message);
        }
      })
      .catch(() => {
        alert("Error updating order status.");
      });
  };

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      order.fullname.toLowerCase().includes(query) ||
      order.product_name.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  });

  // Sort orders based on sortConfig
  const sortedAndFilteredOrders = useMemo(() => {
    let sortableItems = [...filteredOrders];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        const numericKeys = ['id', 'quantity', 'shipping_fee', 'total_price'];
        const dateKeys = ['created_at'];

        let valA, valB;

        if (numericKeys.includes(sortConfig.key)) {
          valA = parseFloat(aValue) || 0;
          valB = parseFloat(bValue) || 0;
        } else if (dateKeys.includes(sortConfig.key)) {
          valA = new Date(aValue).getTime() || 0;
          valB = new Date(bValue).getTime() || 0;
        } else { // String sorting
          valA = String(aValue).toLowerCase();
          valB = String(bValue).toLowerCase();
        }

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredOrders, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Paginate orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAndFilteredOrders.length / itemsPerPage);

  // Determine if search bar should be visible
  const showSearch = activeTab === 'dashboard' || activeTab === 'orders';

  const StatusBadge = ({ status }) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800',
      shipped: isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-800',
      delivered: isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800',
      out_for_delivery: isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800',
      rejected: isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800',
      cancelled: isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          statusClasses[status.toLowerCase()] || (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')
        }`}
      >
        {status}
      </span>
    );
  };

  const renderActions = (order) => {
    const statuses = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'rejected', 'cancelled'];
    return (
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className={`inline-flex justify-center w-full rounded-md border shadow-sm px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            Actions
            <ChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className={`origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="py-1">
              {statuses.map((status) => (
                <Menu.Item key={status}>
                  {({ active }) => (
                    <button
                      onClick={() => updateOrderStatus(order.id, status)}
                      className={`${active ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : (isDarkMode ? 'text-gray-300' : 'text-gray-700')} group flex items-center w-full px-4 py-2 text-sm capitalize`}
                    >
                      {status}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    );
  };

  const OrderTable = ({
    orders,
    isDarkMode,
    sortConfig,
    requestSort,
    renderActions,
    searchQuery,
    StatusBadge,
    totalPages,
    renderPagination,
  }) => {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} mt-12 rounded-xl shadow overflow-x-auto`}>
        <table className="w-full text-left">
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>{[
                { key: 'id', label: 'Order ID' },
                { key: 'fullname', label: 'Customer' },
                { key: 'product_name', label: 'Product' },
                { key: 'variation', label: 'Variation' },
                { key: 'quantity', label: 'Quantity' },
                { key: 'region', label: 'Region' },
                { key: 'city', label: 'City' },
                { key: 'shipping_fee', label: 'Shipping Fee' },
                { key: 'total_price', label: 'Total' },
                { key: 'created_at', label: 'Order Date' },
                { key: 'status', label: 'Status' },
                { key: null, label: 'Actions' },
              ].map(col => (
                <th key={col.key} className="px-6 py-3 text-sm font-medium">
                  {col.key ? (
                    <button onClick={() => requestSort(col.key)} className={`flex items-center space-x-1 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                      <span className="whitespace-nowrap">{col.label}</span>
                      {sortConfig.key === col.key && (
                        sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                  ) : (
                    <span>{col.label}</span>
                  )}
                </th>
              ))}</tr>
          </thead>
          <tbody className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {orders.length === 0 && (
              <tr>
                <td colSpan={12} className={`px-6 py-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchQuery ? 'No orders match your search.' : 'No orders found.'}
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.id}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.fullname}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.product_name}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.variation}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.quantity}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.region}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{o.city}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>₱{parseFloat(o.shipping_fee).toLocaleString()}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>₱{parseFloat(o.total_price).toLocaleString()}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{new Date(o.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize"><StatusBadge status={o.status} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{renderActions(o)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && renderPagination()}
      </div>
    );
  };

  const renderDashboard = () => {
    return (
      <div className="space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenue</h3>
            <p className={`mt-2 text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              ₱{metrics.revenue.toLocaleString()}
            </p>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Incoming Orders</h3>
            <p className={`mt-2 text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{metrics.incomingOrders}</p>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Products Shipped</h3>
            <p className={`mt-2 text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{metrics.shippedProducts}</p>
          </div>
        </div>

        {/* Orders Table */}
        <OrderTable
          orders={paginatedOrders}
          isDarkMode={isDarkMode}
          sortConfig={sortConfig}
          requestSort={requestSort}
          renderActions={renderActions}
          searchQuery={searchQuery}
          StatusBadge={StatusBadge}
          totalPages={totalPages}
          renderPagination={renderPagination}
        />
      </div>
    );
  };

  const renderOrders = () => {
    return (
      <div className="space-y-8">
        <OrderTable
          orders={paginatedOrders}
          isDarkMode={isDarkMode}
          sortConfig={sortConfig}
          requestSort={requestSort}
          renderActions={renderActions}
          searchQuery={searchQuery}
          StatusBadge={StatusBadge}
          totalPages={totalPages}
          renderPagination={renderPagination}
        />
      </div>
    );
  };

  // Component for displaying products
  const ProductsTab = ({ isDarkMode, Plus }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddProductForm, setShowAddProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null); // State to hold product being edited
    const [editFormData, setEditFormData] = useState({}); // Form data for editing
  
    useEffect(() => {
      const fetchProducts = async () => {
        setLoading(true);
        // Replace with your actual backend endpoint to fetch products
        fetch('/croshet_db/get-products.php')
          .then(response => response.json())
          .then(data => {
            if (data.status === 'success' && data.products) {
              setProducts(data.products);
            } else {
              console.error('Failed to fetch products:', data.message);
            }
            setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching products:', error);
            setLoading(false);
          });
      };

      fetchProducts();
    }, []);

    const [newImage, setNewImage] = useState(null);
    const [newImagePreview, setNewImagePreview] = useState(null);
  
    const handleNewImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setNewImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    };
  
    const handleNewRemoveImage = () => {
      setNewImage(null);
      setNewImagePreview(null);
    };
  
    const handleNewProductSubmit = (e) => {
      e.preventDefault();

      // --- Validation ---
      if (!editFormData.productName?.trim()) {
        toast.error('Product name is required.');
        return;
      }
      if (!editFormData.description?.trim()) {
        toast.error('Product description is required.');
        return;
      }
      const priceValue = parseFloat(editFormData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        toast.error('Please enter a valid positive price.');
        return;
      }
      const quantityValue = parseInt(editFormData.quantity, 10);
      if (isNaN(quantityValue) || quantityValue < 0) {
        toast.error('Please enter a valid non-negative quantity.');
        return;
      }
      if (!newImage) {
        toast.error('Product image is required.');
        return;
      }

      // Backend logic will be added here later
      console.log({
        productName: editFormData.productName,
        description: editFormData.description,
        price: editFormData.price,
        quantity: editFormData.quantity,
        newImage,
      });
      toast.success(`Product "${editFormData.productName}" has been staged for creation.`);
      // Reset form
      setEditFormData({});
      handleNewRemoveImage();
      setShowAddProductForm(false); // Hide form after submission
    };

    const handleEditClick = (product) => {
      setEditingProduct(product);
      setEditFormData({
        id: product.id,
        productName: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
      });
      setNewImagePreview(product.image); // Assuming product.image holds the URL
      setShowAddProductForm(false); // Hide add form if editing
    };

    const handleEditFormChange = (e) => {
      const { name, value } = e.target;
      setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditProductSubmit = (e) => {
      e.preventDefault();

      // --- Validation ---
      if (!editFormData.productName?.trim()) {
        toast.error('Product name is required.');
        return;
      }
      if (!editFormData.description?.trim()) {
        toast.error('Product description is required.');
        return;
      }
      const priceValue = parseFloat(editFormData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        toast.error('Please enter a valid positive price.');
        return;
      }
      const quantityValue = parseInt(editFormData.quantity, 10);
      if (isNaN(quantityValue) || quantityValue < 0) {
        toast.error('Please enter a valid non-negative quantity.');
        return;
      }
      if (!newImage && !newImagePreview) { // Check if no new image and no existing preview
        toast.error('Product image is required.');
        return;
      }

      // Backend logic will be added here later
      console.log('Updating product:', editFormData.id, {
        productName: editFormData.productName,
        description: editFormData.description,
        price: editFormData.price,
        quantity: editFormData.quantity,
        image: newImage || newImagePreview, // Use new image if uploaded, else existing preview
      });
      toast.success(`Product "${editFormData.productName}" updated.`);

      // Update products list in state (frontend only)
      setProducts(prevProducts => prevProducts.map(p =>
        p.id === editFormData.id ? { ...p, ...editFormData, image: newImagePreview } : p
      ));

      setEditingProduct(null); // Close modal
      setEditFormData({});
      setNewImage(null);
      setNewImagePreview(null);
    };

    const handleCancelEdit = () => {
      setEditingProduct(null);
      setEditFormData({});
      setNewImage(null);
      setNewImagePreview(null);
    };

    const handleDeleteClick = (productId) => {
      if (window.confirm('Are you sure you want to delete this product?')) {
        // Backend logic will be added here later
        console.log('Deleting product with ID:', productId);
        toast.success('Product deleted.');
        // Update products list in state (frontend only)
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      }
    };
  
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Products</h2>
          <button
            onClick={() => setShowAddProductForm(!showAddProductForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            {showAddProductForm ? 'Cancel Add Product' : 'Add New Product'}
          </button>
        </div>
  
        {showAddProductForm && (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6 mb-8`}>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add New Product</h3>
            <form onSubmit={handleNewProductSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image Uploader */}
              <div className="lg:col-span-1 space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Image</label>
                <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} border-dashed rounded-md`}>
                  <div className="space-y-1 text-center">
                    {newImagePreview ? (
                      <div>
                        <img src={newImagePreview} alt="Product preview" className="mx-auto h-48 w-auto rounded-md object-contain" />
                        <button type="button" onClick={handleNewRemoveImage} className="mt-2 text-sm text-red-600 hover:text-red-500">
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="file-upload" className={`relative cursor-pointer rounded-md font-medium ${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-500'} focus-within:outline-none`}>
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleNewImageChange} />
                          </label>
                          <p className={`pl-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>or drag and drop</p>
                        </div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
  
              {/* Product Details */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label htmlFor="productName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Name</label>
                  <input type="text" id="productName" name="productName" value={editFormData.productName || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                </div>
                <div>
                  <label htmlFor="description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                  <textarea id="description" name="description" rows="4" value={editFormData.description || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="price" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price (₱)</label>
                    <input type="number" id="price" name="price" value={editFormData.price || ''} onChange={handleEditFormChange} required min="0" step="0.01" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                  </div>
                  <div>
                    <label htmlFor="quantity" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantity Available</label>
                    <input type="number" id="quantity" name="quantity" value={editFormData.quantity || ''} onChange={handleEditFormChange} required min="0" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                  </div>
                </div>
              </div>
  
              {/* Form Actions */}
              <div className="lg:col-span-3 flex justify-end">
                <button type="submit" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
                  <UploadCloud className="w-5 h-5 mr-2" />
                  Add Product
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Product Modal */}
        <Transition appear show={editingProduct !== null} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={handleCancelEdit}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-75" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className={`w-full max-w-3xl transform overflow-hidden rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 text-left align-middle shadow-xl transition-all`}>
                    <Dialog.Title as="h3" className={`text-lg font-medium leading-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Edit Product: {editingProduct?.name}
                    </Dialog.Title>
                    <form onSubmit={handleEditProductSubmit} className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Image Uploader for Edit */}
                      <div className="space-y-4">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Image</label>
                        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} border-dashed rounded-md`}>
                          <div className="space-y-1 text-center">
                            {newImagePreview ? (
                              <div>
                                <img src={newImagePreview} alt="Product preview" className="mx-auto h-48 w-auto rounded-md object-contain" />
                                <button type="button" onClick={handleNewRemoveImage} className="mt-2 text-sm text-red-600 hover:text-red-500">
                                  Remove Image
                                </button>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                <div className="flex text-sm text-gray-600">
                                  <label htmlFor="edit-file-upload" className={`relative cursor-pointer rounded-md font-medium ${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-500'} focus-within:outline-none`}>
                                    <span>Upload a file</span>
                                    <input id="edit-file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleNewImageChange} />
                                  </label>
                                  <p className={`pl-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>or drag and drop</p>
                                </div>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>PNG, JPG, GIF up to 10MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Product Details for Edit */}
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="productName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Name</label>
                          <input type="text" id="productName" name="productName" value={editFormData.productName || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                        </div>
                        <div>
                          <label htmlFor="description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                          <textarea id="description" name="description" rows="3" value={editFormData.description || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="price" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price (₱)</label>
                            <input type="number" id="price" name="price" value={editFormData.price || ''} onChange={handleEditFormChange} required min="0" step="0.01" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                          </div>
                          <div>
                            <label htmlFor="quantity" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantity Available</label>
                            <input type="number" id="quantity" name="quantity" value={editFormData.quantity || ''} onChange={handleEditFormChange} required min="0" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                          </div>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="mt-4 lg:col-span-2 flex justify-end space-x-3">
                        <button
                          type="button"
                          className={`inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 focus-visible:ring-blue-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-blue-500'}`}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-md border border-transparent bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
  
        {/* Existing Products List */}
        {loading ? (
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading products...</p>
        ) : (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-x-auto`}>
            <table className="w-full text-left">
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Name</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Price</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                {products.map(product => (
                  <tr key={product.id} className={isDarkMode ? 'hover:bg-gray-700/50' : ''}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {product.name}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      ₱{parseFloat(product.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="text-pink-600 hover:text-pink-800 mr-2"
                        title="Edit Product"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Product"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Users</h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Coming soon...</p>
      </div>
    );
  };

  // Component for displaying settings
  const SettingsTab = ({ isDarkMode }) => {
    const ToggleSwitch = ({ enabled, onChange }) => (
      <button
        type="button"
        className={`${enabled ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
        onClick={onChange}
      >
        <span aria-hidden="true" className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
      </button>
    );

    const [settings, setSettings] = useState({
      maintenanceMode: false,
      registration: true,
      cod: true,
      onlinePayment: false,
      shipping: [
        { id: 1, region: 'Metro Manila', city: 'Manila', fee: 25 },
        { id: 2, region: 'Metro Manila', city: 'Quezon City', fee: 20 },
        { id: 3, region: 'South Luzon', city: 'Calamba City', fee: 36 },
        { id: 4, region: 'South Luzon', city: 'Batangas City', fee: 30 },
      ],
    });

    const handleToggle = (key) => {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
      toast.info(`Setting "${key}" changed. Save to apply.`);
    };

    const handleShippingChange = (id, field, value) => {
      setSettings(prev => ({
        ...prev,
        shipping: prev.shipping.map(item =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      }));
    };

    const handleAddShipping = () => {
      setSettings(prev => ({
        ...prev,
        shipping: [...prev.shipping, { id: Date.now(), region: '', city: '', fee: 0 }],
      }));
    };

    const handleRemoveShipping = (id) => {
      setSettings(prev => ({
        ...prev,
        shipping: prev.shipping.filter(item => item.id !== id),
      }));
    };

    const handleSaveChanges = () => {
      // This is where you would make an API call to save the settings to the backend.
      console.log('Saving settings:', settings);
      toast.success('Settings saved successfully!');
    };

    return (
      <div className="space-y-8">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Settings</h3>
          <div className="space-y-6">
            {/* Site Configuration */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Site Configuration</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Maintenance Mode</span>
                  <ToggleSwitch enabled={settings.maintenanceMode} onChange={() => handleToggle('maintenanceMode')} />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Registration</span>
                  <ToggleSwitch enabled={settings.registration} onChange={() => handleToggle('registration')} />
                </div>
              </div>
            </div>
            
            {/* Payment Settings */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Payment Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cash on Delivery</span>
                  <ToggleSwitch enabled={settings.cod} onChange={() => handleToggle('cod')} />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Online Payment</span>
                  <ToggleSwitch enabled={settings.onlinePayment} onChange={() => handleToggle('onlinePayment')} />
                </div>
              </div>
            </div>

            {/* Shipping Settings */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Shipping Fees</h4>
                <button onClick={handleAddShipping} className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </button>
              </div>
              <div className="space-y-2 mt-4">
                {settings.shipping.map(item => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <input type="text" placeholder="Region" value={item.region} onChange={(e) => handleShippingChange(item.id, 'region', e.target.value)} className={`col-span-1 sm:col-span-1 text-sm rounded-md ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'border-gray-300'}`} />
                    <input type="text" placeholder="City" value={item.city} onChange={(e) => handleShippingChange(item.id, 'city', e.target.value)} className={`col-span-1 sm:col-span-1 text-sm rounded-md ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'border-gray-300'}`} />
                    <input type="number" placeholder="Fee" value={item.fee} onChange={(e) => handleShippingChange(item.id, 'fee', parseFloat(e.target.value) || 0)} className={`col-span-1 sm:col-span-1 text-sm rounded-md ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'border-gray-300'}`} />
                    <button onClick={() => handleRemoveShipping(item.id)} className="text-red-500 hover:text-red-700 text-sm justify-self-start sm:justify-self-end">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveChanges}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Save All Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return <SettingsTab isDarkMode={isDarkMode} />;
  };

  const renderFeedback = () => {
    const handleDeleteFeedback = (feedbackId) => {
      // This will be a backend call later. For now, it just updates the UI state.
      setFeedbacks(currentFeedbacks => currentFeedbacks.filter(f => f.id !== feedbackId));
      // You can add a toast notification here for better UX, e.g., toast.success("Feedback deleted!");
    };

    return (
      <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Customer Feedback</h2>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-x-auto`}>
          <table className="w-full text-left">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Customer</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Message</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Received On</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="4" className={`px-6 py-10 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No feedback received yet.
                  </td>
                </tr>
              ) : (
                feedbacks.map((feedback) => (
                  <tr key={feedback.id} className={isDarkMode ? 'hover:bg-gray-700/50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{feedback.name}</div>
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{feedback.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-md whitespace-normal`}>{feedback.message}</p>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(feedback.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteFeedback(feedback.id)}
                        className="text-red-600 hover:text-red-800 transition-colors flex items-center"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSubscribers = () => (
    <div className="space-y-8">
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Newsletter Subscribers</h2>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-hidden`}>
        <ul className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {subscribers.length === 0 ? (
            <li className={`px-6 py-10 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No subscribers yet.</li>
          ) : (
            subscribers.map(subscriber => (
              <li key={subscriber.id} className={`px-6 py-4 flex items-center justify-between ${isDarkMode ? 'hover:bg-gray-700/50' : ''}`}>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{subscriber.email}</span>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Subscribed on: {new Date(subscriber.subscribed_at).toLocaleDateString()}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );

  const renderPagination = () => (
    <div className={`flex items-center justify-between mt-4 px-6 pb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 text-sm font-medium border rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 text-sm font-medium border rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
        >
          Next
        </button>
      </div>
    </div>
  );

  const isSidebarCollapsed = !isSidebarHovered;
  
  const SidebarContent = () => (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
           <div className="flex items-center h-16 flex-shrink-0 px-4 space-x-2">
            <img
              className="h-8 w-auto"
              src={logoSrc}
              alt="Althea's Cro-shet Logo"
            />
            {(!isSidebarCollapsed || sidebarOpen) && (
              <span className={`text-lg font-bold whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Althea's Cro-shet
              </span>
            )}
          </div>
          <div className={`flex-1 flex flex-col overflow-y-auto border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="flex-1 px-2 py-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                // Determine text color classes for icon and label
                const textColorClasses = activeTab === tab.id
                    ? isDarkMode ? 'text-pink-400' : 'text-pink-700'
                    : isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900';

                return (
                  <div key={tab.id} className="relative group"> {/* Added group for hover effects */}
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isSidebarCollapsed && !sidebarOpen ? 'justify-center' : ''
                      } ${
                        activeTab === tab.id
                          ? isDarkMode ? 'bg-gray-900' : 'bg-pink-100' // Background color only
                          : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50' // Background color only
                      }`}
                      title={isSidebarCollapsed ? tab.label : ''}
                    >
                      <Icon className={`h-5 w-5 ${textColorClasses} ${isSidebarCollapsed && !sidebarOpen ? '' : 'mr-3'}`} aria-hidden="true" />
                      {(!isSidebarCollapsed || sidebarOpen) && <span className={textColorClasses}>{tab.label}</span>}
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Mobile Sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className={`relative flex-1 flex flex-col max-w-xs w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out overflow-x-hidden ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <SidebarContent />
      </aside>

      <div className="flex flex-col flex-1 w-0 overflow-y-auto">
        <AdminNavbar 
          showSearch={showSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 relative z-0 focus:outline-none">
          {/* Header */}
          <div className="p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className={`text-2xl font-bold capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activeTab}</h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Welcome back, {user?.name || 'Admin'}!
              </p>
            </div>
            {loading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</span>
              </div>
            )}
            </div>

            {/* Search Bar for Mobile */}
            {showSearch && (
              <div className="relative mb-4 md:hidden">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'}`}
                />
              </div>
            )}

            {/* Tab Content */}
            <div className="transition-all duration-300 ease-in-out">
              {activeTab === "dashboard" && renderDashboard()}
              {activeTab === "orders" && renderOrders()}
              {activeTab === "products" && <ProductsTab isDarkMode={isDarkMode} Plus={Plus} />}
              {activeTab === "users" && renderUsers()}
              {activeTab === "feedback" && renderFeedback()}
              {activeTab === "subscribers" && renderSubscribers()}
              {activeTab === "settings" && renderSettings()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
