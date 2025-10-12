import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RotateCcw, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { SERVER_BASE_URL } from '../../../utils/product';
import ProductsTableSkeleton from './ProductsTableSkeleton';

/**
 * A component tab for viewing and managing soft-deleted products.
 * Allows for bulk restoration or permanent deletion of items from the trash.
 * @param {object} props - The component props.
 * @param {boolean} props.isDarkMode - Flag to enable dark mode styling.
 */
const TrashTab = ({ isDarkMode }) => {
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /**
   * Fetches the list of soft-deleted products from the server.
   */
  const fetchDeletedProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/products/deleted`);
      const data = await res.json();
      if (res.ok) {
        // Sort by deletion date, newest first
        const sorted = data.products.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
        setDeletedProducts(sorted);
      } else {
        toast.error(data.message || 'Failed to fetch deleted products.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedProducts();
  }, []);

  /**
   * Toggles the selection state of a single product.
   * @param {string} productId - The ID of the product to select/deselect.
   */
  const handleSelectOne = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  /**
   * Selects or deselects all products on the current page.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the checkbox.
   */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(paginatedProducts.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  /**
   * Performs a bulk action (restore or permanent delete) on the selected products.
   * @param {'restore' | 'delete'} action - The action to perform.
   */
  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) {
      toast.info('No products selected.');
      return;
    }
    const endpoint = action === 'restore' ? 'restore' : 'permanent-delete';
    const successMessage = action === 'restore' ? 'restored' : 'permanently deleted';
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/products/bulk-${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedProducts }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.modifiedCount || selectedProducts.length} products have been ${successMessage}.`);
        fetchDeletedProducts();
        setSelectedProducts([]);
      } else {
        toast.error(data.message || `Failed to ${action} products.`);
      }
    } catch {
      toast.error(`Server error during bulk ${action}.`);
    }
  };

  const totalPages = Math.ceil(deletedProducts.length / itemsPerPage);
  const paginatedProducts = deletedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /**
   * Calculates the time remaining until a product is permanently deleted.
   * @param {string} deletedAt - The ISO date string of when the product was soft-deleted.
   */
  const getTimeLeft = (deletedAt) => {
    const deleteTime = new Date(deletedAt).getTime();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const timeLeft = deleteTime + threeDays - Date.now();
    if (timeLeft <= 0) return 'Deleting soon';
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Deleted Products</h2>
        <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Products here will be permanently deleted after 3 days.
        </p>
      </div>

      {loading ? (
        <ProductsTableSkeleton isDarkMode={isDarkMode} />
      ) : deletedProducts.length === 0 ? (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-10 text-center`}>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>The trash is empty.</p>
        </div>
      ) : (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow`}>
          {/* Bulk Actions Bar */}
          {selectedProducts.length > 0 && (
            <div className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {selectedProducts.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleBulkAction('restore')} className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-transparent rounded-md hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900">
                  <RotateCcw className="w-4 h-4 mr-2" /> Restore
                </button>
                <button onClick={() => handleBulkAction('delete')} className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Now
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`text-xs uppercase ${isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-700 bg-gray-50'}`}>
                <tr>
                  <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500" /></th>
                  <th scope="col" className="px-6 py-3">Product Name</th>
                  <th scope="col" className="px-6 py-3">Category</th>
                  <th scope="col" className="px-6 py-3">Date Deleted</th>
                  <th scope="col" className="px-6 py-3">Time until Deletion</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map(product => (
                  <tr key={product._id} className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'}`}>
                    <td className="w-4 p-4"><input type="checkbox" checked={selectedProducts.includes(product._id)} onChange={() => handleSelectOne(product._id)} className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500" /></td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap">{product.name}</td>
                    <td className="px-6 py-4">{product.category}</td>
                    <td className="px-6 py-4">{new Date(product.deletedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900/40 dark:text-yellow-300">
                        {getTimeLeft(product.deletedAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end mt-4 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm disabled:opacity-50 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className={`text-sm px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm disabled:opacity-50 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TrashTab;