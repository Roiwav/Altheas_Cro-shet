import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { SERVER_BASE_URL } from '../utils/product';

export default function useAdminProductsList() {
  // Data
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name | price | date
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection
  const [selectedProducts, setSelectedProducts] = useState([]);
  const selectAllRef = useRef(null);

  // Deletion modal
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/products`);
      const data = await res.json();
      if (Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch {
      toast.error('Failed to fetch products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  // Derived lists
  const sortedProducts = useMemo(() => {
    const filtered = products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const sorted = [...filtered];
    if (sortBy === 'name') {
      sorted.sort((a, b) => (sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    } else if (sortBy === 'price') {
      sorted.sort((a, b) => (sortOrder === 'asc' ? a.price - b.price : b.price - a.price));
    } else if (sortBy === 'date') {
      sorted.sort((a, b) => (sortOrder === 'asc' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt)));
    }
    return sorted;
  }, [products, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  // Selection helpers
  useEffect(() => {
    const paginatedIds = new Set(paginatedProducts.map((p) => p._id));
    setSelectedProducts((prev) => prev.filter((id) => paginatedIds.has(id)));
  }, [paginatedProducts]);

  useEffect(() => {
    if (selectAllRef.current) {
      const isAllSelected = paginatedProducts.length > 0 && selectedProducts.length === paginatedProducts.length;
      const isSomeSelected = selectedProducts.length > 0 && selectedProducts.length < paginatedProducts.length;
      selectAllRef.current.checked = isAllSelected;
      selectAllRef.current.indeterminate = isSomeSelected;
    }
  }, [selectedProducts, paginatedProducts]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(paginatedProducts.map((p) => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectOne = (e, productId) => {
    if (e.target.checked) setSelectedProducts((prev) => [...prev, productId]);
    else setSelectedProducts((prev) => prev.filter((id) => id !== productId));
  };

  // Actions
  const handleToggleFeatured = async (productId) => {
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/products/${productId}/toggle-featured`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p._id === productId ? data.product : p)));
        toast.success(`Product ${data.product.isFeatured ? 'is now featured' : 'is no longer featured'}.`);
      } else {
        toast.error(data.message || 'Failed to update status.');
      }
    } catch {
      toast.error('Server error while toggling featured status.');
    }
  };

  const handleDeleteClick = (productId, productName) => {
    setItemToDelete({ type: 'single', id: productId, name: productName });
    setIsDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    setItemToDelete({ type: 'bulk', count: selectedProducts.length, ids: selectedProducts });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'single') {
        const res = await fetch(`${SERVER_BASE_URL}/api/v1/products/${itemToDelete.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to delete.');
        }
        toast.success(`Product "${itemToDelete.name}" deleted.`);
      } else if (itemToDelete.type === 'bulk') {
        const res = await fetch(`${SERVER_BASE_URL}/api/v1/products/bulk`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: itemToDelete.ids }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Bulk delete failed.');
        toast.success(data.message || `${itemToDelete.count} products deleted.`);
      }
      await fetchProducts();
    } catch (e) {
      toast.error(e.message || 'Server error.');
    } finally {
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
      setSelectedProducts([]);
    }
  };

  return {
    // data
    products,
    setProducts,
    loading,
    // search/sort
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    // pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    sortedProducts,
    paginatedProducts,
    // selection
    selectedProducts,
    setSelectedProducts,
    selectAllRef,
    handleSelectAll,
    handleSelectOne,
    // delete modal
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    itemToDelete,
    setItemToDelete,
    handleDeleteClick,
    handleBulkDelete,
    confirmDeletion,
    // actions
    handleToggleFeatured,
    // utilities
    fetchProducts,
  };
}
