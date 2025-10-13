import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { Plus, Search, Loader2, Trash2, ArrowLeft, ArrowRight, ImageIcon } from 'lucide-react';
import { SERVER_BASE_URL, getProductImageSrc } from '../../utils/product';
import ProductsTable from '../../components/admin/products/ProductsTable';
import NewProductForm from '../../components/admin/products/NewProductForm';
import ProductsTableSkeleton from '../../components/admin/products/ProductsTableSkeleton';
import DeleteConfirmModal from '../../components/admin/products/DeleteConfirmModal';
import useAdminProductsList from '../../hooks/useAdminProductsList';

const ProductsTab = ({ isDarkMode, onViewDeleted }) => {
  const baseCategories = React.useMemo(() => ["Bouquet", "Single Stem", "Arrangement", "Custom"], []);
  const [categories, setCategories] = useState(baseCategories);
  const {
    products, setProducts, loading,
    searchQuery, setSearchQuery,
    sortBy, setSortBy, sortOrder, setSortOrder, // Note: sorting is now applied after filtering
    currentPage, setCurrentPage, itemsPerPage, setItemsPerPage,
    selectedProducts, selectAllRef, handleSelectAll, handleSelectOne,
    isDeleteConfirmOpen, setIsDeleteConfirmOpen, itemToDelete, handleDeleteClick, handleBulkDelete,
    handleToggleFeatured,
    fetchProducts,
  } = useAdminProductsList();

  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [addProductFormData, setAddProductFormData] = useState({ isFeatured: false });
  const [editFormData, setEditFormData] = useState({});
  const [newImage, setNewImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [isAddingSubmitting, setIsAddingSubmitting] = useState(false);
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  // Categories derived from products
  useEffect(() => {
    const fetchedCategories = new Set(products.map(p => p.category).filter(Boolean));
    setCategories(Array.from(new Set([...baseCategories, ...fetchedCategories])).sort());
  }, [products, baseCategories]);

  // Combined filtering and sorting logic
  const filteredProducts = React.useMemo(() => {
    let tempProducts = [...products];
    // 1. Filter by search query
    if (searchQuery) {
      tempProducts = tempProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    // 2. Filter by category
    if (categoryFilter !== 'all') {
      tempProducts = tempProducts.filter(p => p.category === categoryFilter);
    }
    return tempProducts;
  }, [products, searchQuery, categoryFilter]);

  const finalSortedProducts = React.useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const valA = sortBy === 'name' ? a.name.toLowerCase() : sortBy === 'price' ? a.price : new Date(a.createdAt);
      const valB = sortBy === 'name' ? b.name.toLowerCase() : sortBy === 'price' ? b.price : new Date(b.createdAt);
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortBy, sortOrder]);

  const finalTotalPages = Math.ceil(finalSortedProducts.length / itemsPerPage);
  const finalPaginatedProducts = finalSortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page to 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, categoryFilter, itemsPerPage, setCurrentPage]);

  // Quick stats for header badges
  const totalCount = products.length;
  const featuredCount = products.filter(p => p.isFeatured).length;

  // Helper function to assign colors to categories
  const getCategoryColorClass = (category, isDarkMode) => {
    if (category === 'all') {
      return isDarkMode ? 'text-white' : 'text-gray-900';
    }
    switch (category) {
      case 'Single Stem': return isDarkMode ? 'text-green-400' : 'text-green-700';
      case 'Bouquet': return isDarkMode ? 'text-pink-400' : 'text-pink-600';
      case 'Arrangement': return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      case 'Custom': return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      default: return isDarkMode ? 'text-gray-300' : 'text-gray-500';
    }
  };

  const categoryColorClass = getCategoryColorClass(categoryFilter, isDarkMode);

  // Selection handlers provided by hook

  const resolveImageForProduct = (product) => {
    const PLACEHOLDER_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>Image not available</text></svg>";
    if (!product) return PLACEHOLDER_SVG;
    // Prefer Cloudinary public_id when present
    if (typeof product.imagePublicId === 'string' && product.imagePublicId.trim()) {
      return getProductImageSrc(product.imagePublicId);
    }
    const candidate = product.image;
    if (typeof candidate === 'string' && candidate.trim()) {
      // Route any string through the shared resolver. It handles http(s), data/blob, /uploads, and Cloudinary public_id.
      return getProductImageSrc(candidate);
    }
    return PLACEHOLDER_SVG;
  };

  const handleNewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setIsImageLoading(false); // Local files load instantly, no spinner needed
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleNewRemoveImage = () => {
    setNewImage(null);
    setNewImagePreview(null);
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddProductFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    if (value === '__add_new__') {
      setIsAddingNewCategory(true);
      setAddProductFormData(prev => ({ ...prev, category: '' }));
    } else {
      setIsAddingNewCategory(false);
      setAddProductFormData(prev => ({ ...prev, category: value }));
    }
  };

  const handleNewProductSubmit = async (e) => {
    e.preventDefault();
    if (!addProductFormData.name || !addProductFormData.description || !newImage || !addProductFormData.price || !addProductFormData.category) {
      toast.error("All fields and image required.");
      return;
    }
    setIsAddingSubmitting(true);
    const formData = new FormData();
    formData.append("name", addProductFormData.name);
    formData.append("description", addProductFormData.description);
    formData.append("price", addProductFormData.price);
    formData.append("category", addProductFormData.category);
    formData.append("isFeatured", addProductFormData.isFeatured || false);
    if (Array.isArray(addProductFormData.badges)) {
      formData.append("badges", addProductFormData.badges.join(","));
    }
    formData.append("image", newImage);

    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/products`, {
    method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setProducts(prev => [data.product, ...prev]);
        setShowAddProductForm(false);
        setAddProductFormData({ isFeatured: false });
        setNewImage(null);
        setNewImagePreview(null);
        toast.success("Product added!");
      } else {
        toast.error(data.message || "Failed to add product.");
      }
    } catch {
      toast.error("Server error.");
    } finally {
      setIsAddingSubmitting(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category || categories[0],
      isFeatured: product.isFeatured || false,
      badges: Array.isArray(product.badges) ? product.badges : [],
    });
    setNewImagePreview(null); // Reset previous preview
    // Use a robust resolver that falls back to static assets by name (Option A)
    setIsImageLoading(true);
    const imageUrl = resolveImageForProduct(product);
    setNewImagePreview(imageUrl);
    setShowAddProductForm(false);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.name?.trim() || !editFormData.description?.trim() || !editFormData.price || !editFormData.category) {
      toast.error("All fields required.");
      return;
    }
    setIsEditingSubmitting(true);
    const formData = new FormData();
    formData.append("name", editFormData.name);
    formData.append("description", editFormData.description);
    formData.append("price", editFormData.price);
    formData.append("category", editFormData.category);
    formData.append("isFeatured", editFormData.isFeatured || false);
    if (Array.isArray(editFormData.badges)) {
      formData.append("badges", editFormData.badges.join(","));
    }
    if (newImage) {
      formData.append("image", newImage);
    }

    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/products/${editingProduct._id}`, {
        method: 'PUT',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setProducts(prev => prev.map(p => p._id === editingProduct._id ? data.product : p));
        setEditingProduct(null);
        setEditFormData({});
        setNewImage(null);
        setNewImagePreview(null);
        toast.success("Product updated!");
      } else {
        toast.error(data.message || "Failed to update.");
      }
    } catch {
      toast.error("Error updating product.");
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditFormData({});
    setNewImage(null);
    setIsImageLoading(false);
    setNewImagePreview(null);
  };

  // OVERRIDE: This logic should ideally be in the useAdminProductsList hook
  // For this example, we'll override the confirmDeletion from the hook.
  const handleSoftDelete = async () => {
    if (!itemToDelete) return;

    const isBulk = itemToDelete?.type === 'bulk';
    const url = isBulk
      ? `${SERVER_BASE_URL}/api/v1/products/bulk-soft-delete`
      : `${SERVER_BASE_URL}/api/v1/products/${itemToDelete.id}/soft-delete`;
    const method = isBulk ? 'POST' : 'PATCH';
    const body = isBulk ? JSON.stringify({ productIds: itemToDelete.ids }) : null;

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      if (res.ok) {
        toast.success(`Product(s) moved to trash.`);
        fetchProducts(); // Re-fetch the list
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to move product to trash.');
      }
    } catch {
      toast.error('Server error while moving product to trash.');
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };

  // Delete click and toggle featured provided by hook

  // Prevents typing 'e', '+', '-' in number inputs
  const blockInvalidNumberInput = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Manage Products</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>Total: {totalCount}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>Featured: {featuredCount}</span>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-grow">
            <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full py-2 pl-10 pr-3 border rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'}`}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`py-2 pl-3 pr-8 border rounded-md leading-5 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm font-medium ${isDarkMode ? 'bg-gray-700 border-gray-600 focus:border-pink-500' : 'bg-white border-gray-300 focus:border-pink-500'} ${categoryColorClass}`}
          >
            <option value="all" className={isDarkMode ? 'text-white' : 'text-gray-900'}>All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat} className={getCategoryColorClass(cat, isDarkMode)}>{cat}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddProductForm(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </button>
          <button
            onClick={() => { if (onViewDeleted) onViewDeleted(); }}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Deleted products
          </button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <NewProductForm
        isOpen={showAddProductForm}
        onClose={() => setShowAddProductForm(false)}
        isDarkMode={isDarkMode}
        categories={categories}
        addProductFormData={addProductFormData}
        isAddingNewCategory={isAddingNewCategory}
        onAddFormChange={handleAddFormChange}
        onCategoryChange={handleCategoryChange}
        onImageChange={handleNewImageChange}
        onImageRemove={handleNewRemoveImage}
        newImagePreview={newImagePreview}
        blockInvalidNumberInput={blockInvalidNumberInput}
        onSubmit={handleNewProductSubmit}
        onToggleAddCategory={setIsAddingNewCategory}
        getCategoryColorClass={getCategoryColorClass}
        submitting={isAddingSubmitting}
      />

      {/* Edit Modal */}
      <Transition appear show={editingProduct !== null} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleCancelEdit}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className={`relative w-full max-w-2xl transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  {isEditingSubmitting && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
                      <div className="flex items-center px-4 py-2 text-white bg-gray-900/80 rounded-md shadow">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </div>
                    </div>
                  )}
                  <Dialog.Title as="h3" className={`text-lg font-medium leading-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Edit Product
                  </Dialog.Title>
                  <form onSubmit={handleEditProductSubmit} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="edit-name" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Name</label>
                      <input type="text" id="edit-name" name="name" value={editFormData.name || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                    </div>
                    <div>
                      <label htmlFor="edit-description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                      <textarea id="edit-description" name="description" rows="3" value={editFormData.description || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}></textarea>
                    </div>
                    <div>
                      <label htmlFor="edit-category" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                      <select id="edit-category" name="category" value={editFormData.category || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}>
                        <option value="" disabled>Select a category</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-price" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price (₱)</label>
                      <input type="number" id="edit-price" name="price" value={editFormData.price || ''} onChange={handleEditFormChange} onKeyDown={blockInvalidNumberInput} required min="0" step="0.01" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                    </div>
                    <div>
                      <label htmlFor="edit-isFeatured" className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="edit-isFeatured" 
                          name="isFeatured" 
                          checked={editFormData.isFeatured || false} 
                          onChange={(e) => handleEditFormChange({ target: { name: 'isFeatured', value: e.target.checked }})}
                          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mark as Featured Product</span>
                      </label>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Badges</label>
                      <div className="mt-2 flex flex-wrap gap-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(editFormData.badges || []).includes('bestSeller')}
                            onChange={(e) => {
                              const current = editFormData.badges || [];
                              const next = e.target.checked ? Array.from(new Set([...current, 'bestSeller'])) : current.filter(b => b !== 'bestSeller');
                              handleEditFormChange({ target: { name: 'badges', value: next }});
                            }}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Best Seller</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(editFormData.badges || []).includes('bestChoice')}
                            onChange={(e) => {
                              const current = editFormData.badges || [];
                              const next = e.target.checked ? Array.from(new Set([...current, 'bestChoice'])) : current.filter(b => b !== 'bestChoice');
                              handleEditFormChange({ target: { name: 'badges', value: next }});
                            }}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Best Choice</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(editFormData.badges || []).includes('new')}
                            onChange={(e) => {
                              const current = editFormData.badges || [];
                              const next = e.target.checked ? Array.from(new Set([...current, 'new'])) : current.filter(b => b !== 'new');
                              handleEditFormChange({ target: { name: 'badges', value: next }});
                            }}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>New</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Change Image (Optional)</label>
                      <div className="flex items-center mt-2 space-x-4">
                        <div className={`relative flex items-center justify-center w-32 h-32 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          {isImageLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                            </div>
                          )}
                          {newImagePreview && (
                            <img
                              src={getProductImageSrc(newImagePreview || editingProduct?.imagePublicId || editingProduct?.image)}
                              alt="Preview" 
                              className={`object-contain w-auto h-32 rounded-md transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                              loading="lazy"
                              decoding="async"
                              onLoad={() => setIsImageLoading(false)}
                              onError={(e) => {
                                setIsImageLoading(false);
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>Image not available</text></svg>";
                              }}
                            />
                          )}
                          {!isImageLoading && !newImagePreview && <ImageIcon className={`w-8 h-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />}
                        </div>
                        <input type="file" accept="image/*" onChange={handleNewImageChange} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      </div>
                    </div>

                    <div className="flex justify-end mt-6 space-x-2">
                      <button
                        type="button"
                        className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 focus-visible:ring-gray-500' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-blue-500'}`}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isEditingSubmitting}
                        className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 ${isEditingSubmitting ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'}`}
                      >
                        {isEditingSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>) : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        isDarkMode={isDarkMode}
        itemToDelete={itemToDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleSoftDelete} // Use our new soft delete handler
      />

      {loading ? (
        <ProductsTableSkeleton isDarkMode={isDarkMode} />
      ) : finalSortedProducts.length === 0 ? (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-10 text-center`}>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>No products found.</p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <button
              onClick={() => setSearchQuery('')}
              className={`px-3 py-1.5 rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Clear search
            </button>
            <button
              onClick={() => setShowAddProductForm(true)}
              className="px-3 py-1.5 rounded-md bg-pink-600 text-white hover:bg-pink-700"
            >
              Add a product
            </button>
          </div>
        </div>
      ) : (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow`}>
          {/* Bulk Actions Bar */}
          {selectedProducts.length > 0 && (
            <div className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {selectedProducts.length} selected
              </span>
              <div>
                <button 
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <ProductsTable
              isDarkMode={isDarkMode}
              paginatedProducts={finalPaginatedProducts}
              selectedProducts={selectedProducts}
              selectAllRef={selectAllRef}
              handleSelectAll={handleSelectAll}
              handleSelectOne={handleSelectOne}
              sortBy={sortBy}
              sortOrder={sortOrder}
              setSortBy={setSortBy}
              setSortOrder={setSortOrder}
              handleEditClick={handleEditClick}
              handleDeleteClick={handleDeleteClick}
              handleToggleFeatured={handleToggleFeatured}
              getCategoryColorClass={getCategoryColorClass}
            />
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {finalTotalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 mt-4 md:flex-row">
          <div className="flex items-center self-start space-x-2 text-sm md:self-center">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`border-gray-300 rounded-md shadow-sm focus:border-pink-300 focus:ring focus:ring-pink-200 focus:ring-opacity-50 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center self-end space-x-2 md:self-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || finalTotalPages === 0}
              className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className={`text-sm px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Page {finalTotalPages > 0 ? currentPage : 0} of {finalTotalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, finalTotalPages))}
              disabled={currentPage === finalTotalPages || finalTotalPages === 0}
              className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
