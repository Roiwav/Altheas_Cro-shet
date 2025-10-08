import React, { useState, useEffect, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { Plus, ImageIcon, UploadCloud, Search, Star, Loader2, X as XIcon, Settings, Trash2, AlertTriangle, Edit, Check, X, ArrowLeft, ArrowRight, MoreHorizontal } from 'lucide-react';

const ProductsTab = ({ isDarkMode }) => {
  const baseCategories = ["Bouquet", "Single Stem", "Arrangement", "Custom"];
  const [categories, setCategories] = useState(baseCategories);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [addProductFormData, setAddProductFormData] = useState({});
  const [editFormData, setEditFormData] = useState({});
  const [newImage, setNewImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  // State for category editing
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  // State for bulk-edit modal
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [productsToMove, setProductsToMove] = useState([]);
  const [newCategoryForMove, setNewCategoryForMove] = useState('');

  // Delete confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Sorting state
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc"); 

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/v1/products');
      const data = await res.json();
      if (Array.isArray(data.products)) {
        setProducts(data.products);
        // Dynamically update categories from fetched products
        const fetchedCategories = new Set(data.products.map(p => p.category).filter(Boolean));
        setCategories(prev => Array.from(new Set([...baseCategories, ...fetchedCategories])).sort());
      }
    } catch (err) {
      toast.error('Failed to fetch products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  // Sorting logic
  const sortedProducts = React.useMemo(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    let sorted = [...filtered];

    if (sortBy === "name") {
      sorted.sort((a, b) =>
        sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
    } else if (sortBy === "price") {
      sorted.sort((a, b) =>
        sortOrder === "asc"
          ? a.price - b.price
          : b.price - a.price
      );
    }
    return sorted;
  }, [products, sortBy, sortOrder, searchQuery]);

  // When paginated products change, clear selection that is not on the current page
  useEffect(() => {
    const paginatedIds = new Set(paginatedProducts.map(p => p._id));
    setSelectedProducts(prev => prev.filter(id => paginatedIds.has(id)));
  }, [currentPage, itemsPerPage, sortedProducts]);

  // Pagination logic
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  // Checkbox logic
  const selectAllRef = useRef(null);

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
      const allProductIdsOnPage = paginatedProducts.map(p => p._id);
      setSelectedProducts(allProductIdsOnPage);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectOne = (e, productId) => {
    if (e.target.checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
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
    if (!addProductFormData.productName || !addProductFormData.description || !newImage || !addProductFormData.price || !addProductFormData.quantity || !addProductFormData.category) {
      toast.error("All fields and image required.");
      return;
    }
    const formData = new FormData();
    formData.append("name", addProductFormData.productName);
    formData.append("description", addProductFormData.description);
    formData.append("price", addProductFormData.price);
    formData.append("quantity", addProductFormData.quantity);
    formData.append("category", addProductFormData.category);
    formData.append("isFeatured", addProductFormData.isFeatured || false);
    formData.append("image", newImage);

    try {
      const res = await fetch("http://localhost:5001/api/v1/products", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        if (data.product) {
          toast.success("Product added!");
          setProducts((prev) => [data.product, ...prev]);
          // If a new category was added, update the categories list
          if (!categories.includes(data.product.category)) {
            setCategories(prev => [...prev, data.product.category].sort());
          }
          setIsAddingNewCategory(false);
        }
        setShowAddProductForm(false);
        setAddProductFormData({});
        setNewImage(null);
        setNewImagePreview(null);
      } else {
        toast.error(data.message || "Failed to add product.");
      }
    } catch {
      toast.error("Server error.");
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditFormData({
      productName: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      category: product.category || categories[0],
      isFeatured: product.isFeatured || false,
    });
    setNewImagePreview(null); // Reset previous preview
    // Use a more robust way to set the image preview URL, similar to ShopPage
    if (product.image) {
      setIsImageLoading(true); // Start loading
      const imageUrl = product.image.startsWith("/uploads")
        ? `http://localhost:5001${product.image}`
        : product.image;
      setNewImagePreview(imageUrl);
    } else {
      setIsImageLoading(false); // No image to load
    }
    setShowAddProductForm(false);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.productName?.trim() || !editFormData.description?.trim() || !editFormData.price || !editFormData.quantity || !editFormData.category) {
      toast.error("All fields required.");
      return;
    }
    const formData = new FormData();
    formData.append("name", editFormData.productName);
    formData.append("description", editFormData.description);
    formData.append("price", editFormData.price);
    formData.append("quantity", editFormData.quantity);
    formData.append("category", editFormData.category);
    formData.append("isFeatured", editFormData.isFeatured || false);
    if (newImage) {
      formData.append("image", newImage);
    }

    try {
      const res = await fetch(
        `http://localhost:5001/api/v1/products/${editingProduct._id}`,
        {
          method: "PUT",
          body: formData,
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Product updated!");
        setProducts(prev => prev.map(p => p._id === editingProduct._id ? data.product : p));
        setEditingProduct(null);
        setEditFormData({});
        setNewImage(null);
        setNewImagePreview(null);
      } else {
        toast.error(data.message || "Failed.");
      }
    } catch {
      toast.error("Error updating product.");
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditFormData({});
    setNewImage(null);
    setIsImageLoading(false);
    setNewImagePreview(null);
  };

  const handleDeleteClick = (productId, productName) => {
    setItemToDelete({ type: 'single', id: productId, name: productName });
    setIsDeleteConfirmOpen(true);
  };

  const handleToggleFeatured = async (productId) => {
    try {
      const res = await fetch(`http://localhost:5001/api/v1/products/${productId}/toggle-featured`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Product ${data.product.isFeatured ? 'is now featured' : 'is no longer featured'}.`);
        setProducts(prev => prev.map(p => p._id === productId ? data.product : p));
      } else {
        toast.error(data.message || 'Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error while toggling featured status.');
    }
  };

  const handleDeleteCategory = (categoryToDelete) => {
    // Check if any product is using this category
    const productsInCategory = products.filter(p => p.category === categoryToDelete);
    const isCategoryInUse = productsInCategory.length > 0;

    if (isCategoryInUse) {
      setCategoryToDelete(categoryToDelete);
      setProductsToMove(productsInCategory);
      setNewCategoryForMove(''); // Reset selection
      setIsManageCategoriesOpen(false); // Close the manage modal
      setShowBulkEditModal(true); // Open the bulk-edit modal
    } else {
      if (window.confirm(`Are you sure you want to delete the category "${categoryToDelete}"? This cannot be undone.`)) {
        setCategories(prev => prev.filter(cat => cat !== categoryToDelete));
        toast.success(`Category "${categoryToDelete}" has been deleted.`);
      }
    }
  };

  const handleBulkMoveAndDelete = async () => {
    if (!newCategoryForMove) {
      toast.error('Please select a new category to move the products to.');
      return;
    }

    const productIds = productsToMove.map(p => p._id);

    try {
      const res = await fetch('http://localhost:5001/api/v1/products/bulk-update-category', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds, newCategory: newCategoryForMove }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.modifiedCount} products moved to "${newCategoryForMove}".`);
        // Now delete the old category from state
        setCategories(prev => prev.filter(cat => cat !== categoryToDelete));
        // Refetch products to get the latest data
        fetchProducts();
        setShowBulkEditModal(false);
      } else {
        toast.error(data.message || 'Failed to move products.');
      }
    } catch (err) {
      toast.error('A server error occurred while moving products.');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category);
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setNewCategoryName("");
  };

  const handleSaveCategoryEdit = async () => {
    if (!newCategoryName.trim() || newCategoryName === editingCategory) {
      handleCancelCategoryEdit();
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/v1/products/update-category-name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldCategory: editingCategory, newCategory: newCategoryName }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Category updated to "${newCategoryName}".`);
        fetchProducts(); // Refetch all data to ensure consistency
        handleCancelCategoryEdit();
      } else {
        toast.error(data.message || 'Failed to update category.');
      }
    } catch (err) {
      toast.error('A server error occurred while updating the category.');
    }
  };

  // Prevents typing 'e', '+', '-' in number inputs
  const blockInvalidNumberInput = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleBulkDelete = () => {
    setItemToDelete({ type: 'bulk', count: selectedProducts.length, ids: selectedProducts });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'single') {
      try {
        const res = await fetch(`http://localhost:5001/api/v1/products/${itemToDelete.id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success(`Product "${itemToDelete.name}" deleted.`);
          fetchProducts(); // Refetch to update list
        } else {
          const data = await res.json();
          toast.error(data.message || "Failed to delete.");
        }
      } catch {
        toast.error("Server error.");
      }
    } else if (itemToDelete.type === 'bulk') {
      try {
        const res = await fetch('http://localhost:5001/api/v1/products/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: itemToDelete.ids }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(data.message || `${itemToDelete.count} products deleted.`);
        } else {
          throw new Error(data.message || 'Bulk delete failed.');
        }
      } catch (err) {
        toast.error(err.message || 'A server error occurred during bulk deletion.');
      }
      fetchProducts(); // Refetch products
    }

    setIsDeleteConfirmOpen(false);
    setItemToDelete(null);
    setSelectedProducts([]);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Manage Products</h2>
        <div className="flex items-stretch flex-grow gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
            <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full py-2 pl-10 pr-3 border rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'}`}
            />
          </div>
          <button onClick={() => setIsManageCategoriesOpen(true)} className={`p-2 border rounded-md shadow-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddProductForm(!showAddProductForm)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            {showAddProductForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {showAddProductForm && (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6 mb-8`}>
          <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add New Product</h3>
          <form onSubmit={handleNewProductSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Image Uploader */}
            <div className="space-y-4 lg:col-span-1">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Image</label>
              <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} border-dashed rounded-md`}>
                <div className="space-y-1 text-center">
                  {newImagePreview ? (
                    <div>
                      <img src={newImagePreview} alt="Product preview" className="object-contain w-auto h-48 mx-auto rounded-md" />
                      <button type="button" onClick={handleNewRemoveImage} className="mt-2 text-sm text-red-600 hover:text-red-500">Remove Image</button>
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
            <div className="space-y-6 lg:col-span-2">
              <div>
                <label htmlFor="productName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Name</label>
                <input type="text" id="productName" name="productName" value={addProductFormData.productName || ''} onChange={handleAddFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
              </div>
              <div>
                <label htmlFor="description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                <textarea id="description" name="description" rows="4" value={addProductFormData.description || ''} onChange={handleAddFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}></textarea>
              </div>
              <div>
                <label htmlFor="category" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                {isAddingNewCategory ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="New category name"
                      value={addProductFormData.category || ''}
                      onChange={(e) => handleAddFormChange({ target: { name: 'category', value: e.target.value } })}
                      className={`block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                      autoFocus
                    />
                    <button type="button" onClick={() => setIsAddingNewCategory(false)} className={`p-2 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'}`}>
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <select
                    id="category"
                    name="category"
                    value={addProductFormData.category || ''}
                    onChange={handleCategoryChange}
                    required
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="__add_new__" className="font-bold text-pink-600">＋ Add New Category</option>
                  </select>
                )}
              </div>
              <div>
                <label htmlFor="isFeatured" className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={addProductFormData.isFeatured || false}
                    onChange={(e) => handleAddFormChange({ target: { name: 'isFeatured', value: e.target.checked }})}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mark as Featured Product</span>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="price" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price (₱)</label>
                  <input type="number" id="price" name="price" value={addProductFormData.price || ''} onChange={handleAddFormChange} onKeyDown={blockInvalidNumberInput} required min="0" step="0.01" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                </div>
                <div>
                  <label htmlFor="quantity" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantity Available</label>
                  <input type="number" id="quantity" name="quantity" value={addProductFormData.quantity || ''} onChange={handleAddFormChange} onKeyDown={blockInvalidNumberInput} required min="0" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end lg:col-span-3">
              <button type="submit" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
                <UploadCloud className="w-5 h-5 mr-2" />
                Add Product
              </button>
            </div>
          </form>
        </div>
      )}

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
                <Dialog.Panel className={`w-full max-w-2xl transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <Dialog.Title as="h3" className={`text-lg font-medium leading-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Edit Product
                  </Dialog.Title>
                  <form onSubmit={handleEditProductSubmit} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="edit-productName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Name</label>
                      <input type="text" id="edit-productName" name="productName" value={editFormData.productName || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="edit-price" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price (₱)</label>
                        <input type="number" id="edit-price" name="price" value={editFormData.price || ''} onChange={handleEditFormChange} onKeyDown={blockInvalidNumberInput} required min="0" step="0.01" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                      </div>
                      <div>
                        <label htmlFor="edit-quantity" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantity</label>
                        <input type="number" id="edit-quantity" name="quantity" value={editFormData.quantity || ''} onChange={handleEditFormChange} onKeyDown={blockInvalidNumberInput} required min="0" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
                      </div>
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
                              src={newImagePreview} 
                              alt="Preview" 
                              className={`object-contain w-auto h-32 rounded-md transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                              onLoad={() => setIsImageLoading(false)}
                              onError={() => setIsImageLoading(false)} // Also stop loading on error
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
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
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

      {/* Bulk Edit/Delete Category Modal */}
      <Transition appear show={showBulkEditModal} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={() => setShowBulkEditModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-40" />
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
                <Dialog.Panel className={`w-full max-w-lg transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <Dialog.Title as="h3" className={`text-lg font-medium leading-6 flex items-center ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    Category In Use
                  </Dialog.Title>
                  <div className="mt-4">
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      The category "<strong>{categoryToDelete}</strong>" is currently assigned to <strong>{productsToMove.length}</strong> product(s).
                      To delete it, please move these products to another category first.
                    </p>
                    <div className="mt-4">
                      <label htmlFor="new-category-select" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Move products to:
                      </label>
                      <select
                        id="new-category-select"
                        value={newCategoryForMove}
                        onChange={(e) => setNewCategoryForMove(e.target.value)}
                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                      >
                        <option value="" disabled>Select a new category</option>
                        {categories.filter(c => c !== categoryToDelete).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 space-x-2">
                    <button type="button" onClick={() => setShowBulkEditModal(false)} className={`px-4 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                      Cancel
                    </button>
                    <button type="button" onClick={handleBulkMoveAndDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50" disabled={!newCategoryForMove}>
                      Move and Delete
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Manage Categories Modal */}
      <Transition appear show={isManageCategoriesOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => setIsManageCategoriesOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
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
                <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <Dialog.Title as="h3" className={`text-lg font-medium leading-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Manage Categories
                  </Dialog.Title>
                  <div className="mt-4 space-y-2">
                    {categories.map(cat => (
                      <div key={cat} className="flex items-center justify-between p-2 rounded-md group hover:bg-gray-100 dark:hover:bg-gray-700">
                        {editingCategory === cat ? (
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveCategoryEdit()}
                            className={`flex-grow text-sm rounded-md ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                            autoFocus
                          />
                        ) : (
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{cat}</span>
                        )}
                        {!baseCategories.includes(cat) && !editingCategory && (
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
                            <button onClick={() => handleEditCategory(cat)} title={`Edit "${cat}"`} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteCategory(cat)} title={`Delete "${cat}"`} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )}
                        {editingCategory === cat && (
                          <div className="flex items-center space-x-2">
                            <button onClick={handleSaveCategoryEdit} className="text-green-500 hover:text-green-700"><Check className="w-5 h-5" /></button>
                            <button onClick={handleCancelCategoryEdit} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <button type="button" onClick={() => setIsManageCategoriesOpen(false)} className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 focus-visible:ring-gray-500' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-blue-500'}`}>
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Manage Categories Modal */}
      <Transition appear show={isManageCategoriesOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => setIsManageCategoriesOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
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
                <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <Dialog.Title as="h3" className={`text-lg font-medium leading-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Manage Categories
                  </Dialog.Title>
                  <div className="mt-4 space-y-2">
                    {categories.map(cat => (
                      <div key={cat} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{cat}</span>
                        {!baseCategories.includes(cat) && (
                          <button onClick={() => handleDeleteCategory(cat)} title={`Delete "${cat}"`} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <button type="button" onClick={() => setIsManageCategoriesOpen(false)} className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 focus-visible:ring-gray-500' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-blue-500'}`}>
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isDeleteConfirmOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={() => setIsDeleteConfirmOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-40" />
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
                <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <Dialog.Title as="h3" className={`text-lg font-medium leading-6 flex items-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    Confirm Deletion
                  </Dialog.Title>
                  <div className="mt-4">
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Are you sure you want to delete {itemToDelete?.type === 'bulk' ? `${itemToDelete.count} products` : `"${itemToDelete?.name}"`}? This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex justify-end mt-6 space-x-2">
                    <button type="button" onClick={() => setIsDeleteConfirmOpen(false)} className={`px-4 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>Cancel</button>
                    <button type="button" onClick={confirmDeletion} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {loading ? (
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading products...</p>
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
          <table className="w-full text-left">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-6 py-3">
                  <input type="checkbox" ref={selectAllRef} onChange={handleSelectAll} className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-600" />
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium cursor-pointer select-none ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}
                  onClick={() => {
                    if (sortBy === "name") setSortOrder(o => o === "asc" ? "desc" : "asc");
                    else { setSortBy("name"); setSortOrder("asc"); }
                  }}
                  title="Sort by Product Name"
                >
                  Name{sortBy === "name" && (sortOrder === "asc" ? " ↑" : " ↓")}
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium cursor-pointer select-none ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}
                  onClick={() => {
                    if (sortBy === "price") {
                      setSortOrder(o => o === "asc" ? "desc" : "asc");
                    } else { setSortBy("price"); setSortOrder("asc"); }
                  }}
                  title="Sort by Price"
                >
                  Price{sortBy === "price" && (sortOrder === "asc" ? " ↑" : " ↓")}
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Category
                </th>
                <th className={`px-6 py-3 text-center text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Featured
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
              {paginatedProducts.map(product => (
                <tr key={product._id} className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} ${selectedProducts.includes(product._id) ? (isDarkMode ? 'bg-pink-900/20' : 'bg-pink-50') : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedProducts.includes(product._id)}
                      onChange={(e) => handleSelectOne(e, product._id)}
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-600" />
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {product.name}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    ₱{parseFloat(product.price).toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {product.category}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button onClick={() => handleToggleFeatured(product._id)} title="Toggle Featured">
                      <Star 
                        className={`w-5 h-5 transition-colors ${
                          product.isFeatured ? 'text-yellow-400 fill-current' : 'text-gray-400 hover:text-yellow-300'
                        }`} 
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="mr-2 text-pink-600 hover:text-pink-800"
                      title="Edit Product"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product._id, product.name)}
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
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2 text-sm">
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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className={`text-sm px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
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
