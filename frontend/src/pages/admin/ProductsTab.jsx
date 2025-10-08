import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { Plus, Search, Loader2, Settings, Trash2, ArrowLeft, ArrowRight, ImageIcon } from 'lucide-react';
import { SERVER_BASE_URL, getProductImageSrc } from '../../utils/product';
import ProductsTable from '../../components/admin/products/ProductsTable';
import NewProductForm from '../../components/admin/products/NewProductForm';
import ProductsTableSkeleton from '../../components/admin/products/ProductsTableSkeleton';
import DeleteConfirmModal from '../../components/admin/products/DeleteConfirmModal';
import ManageCategoriesModal from '../../components/admin/products/ManageCategoriesModal';
import BulkMoveCategoryModal from '../../components/admin/products/BulkMoveCategoryModal';
import useAdminProductsList from '../../hooks/useAdminProductsList';

const ProductsTab = ({ isDarkMode }) => {
  const baseCategories = React.useMemo(() => ["Bouquet", "Single Stem", "Arrangement", "Custom"], []);
  const [categories, setCategories] = useState(baseCategories);
  const {
    products, setProducts, loading,
    searchQuery, setSearchQuery,
    sortBy, setSortBy, sortOrder, setSortOrder,
    currentPage, setCurrentPage, itemsPerPage, setItemsPerPage, totalPages,
    sortedProducts, paginatedProducts,
    selectedProducts, selectAllRef, handleSelectAll, handleSelectOne,
    isDeleteConfirmOpen, setIsDeleteConfirmOpen, itemToDelete, handleDeleteClick, handleBulkDelete, confirmDeletion,
    handleToggleFeatured,
    fetchProducts,
  } = useAdminProductsList();

  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [addProductFormData, setAddProductFormData] = useState({});
  const [editFormData, setEditFormData] = useState({});
  const [newImage, setNewImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [newImagePreview, setNewImagePreview] = useState(null);

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

  // Categories derived from products
  useEffect(() => {
    const fetchedCategories = new Set(products.map(p => p.category).filter(Boolean));
    setCategories(Array.from(new Set([...baseCategories, ...fetchedCategories])).sort());
  }, [products, baseCategories]);

  // fetchProducts is provided by useAdminProductsList()

  // Paging reset handled by hook

  // Sorting handled by hook

  // Selection syncing handled by hook

  // Pagination handled by hook

  // Checkbox selectAllRef handled by hook

  // Quick stats for header badges
  const totalCount = products.length;
  const featuredCount = products.filter(p => p.isFeatured).length;
  const outOfStockCount = products.filter(p => !p.quantity || Number(p.quantity) <= 0).length;

  // Selection handlers provided by hook

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
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/products`, {
    method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setProducts(prev => [data.product, ...prev]);
        setShowAddProductForm(false);
        setAddProductFormData({});
        setNewImage(null);
        setNewImagePreview(null);
        toast.success("Product added!");
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
      const imageUrl = getProductImageSrc(product.image);
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
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditFormData({});
    setNewImage(null);
    setIsImageLoading(false);
    setNewImagePreview(null);
  };

  // Delete click and toggle featured provided by hook

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
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/products/bulk-update-category`, {
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
    } catch {
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
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/products/update-category-name`, {
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
    } catch {
      toast.error('A server error occurred while updating the category.');
    }
  };

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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800'}`}>Out of stock: {outOfStockCount}</span>
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
          <div className="flex items-center gap-2">
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
      </div>

      {showAddProductForm && (
        <NewProductForm
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
        />
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
                              src={getProductImageSrc(newImagePreview || editingProduct?.image)}
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
      <BulkMoveCategoryModal
        isOpen={showBulkEditModal}
        isDarkMode={isDarkMode}
        categoryToDelete={categoryToDelete}
        productsCount={productsToMove.length}
        categories={categories.filter(c => c !== categoryToDelete)}
        newCategoryForMove={newCategoryForMove}
        onChangeNewCategoryForMove={setNewCategoryForMove}
        onCancel={() => setShowBulkEditModal(false)}
        onConfirm={handleBulkMoveAndDelete}
      />

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        isDarkMode={isDarkMode}
        categories={categories}
        baseCategories={baseCategories}
        editingCategory={editingCategory}
        newCategoryName={newCategoryName}
        onStartEditCategory={handleEditCategory}
        onChangeNewCategory={setNewCategoryName}
        onDeleteCategory={handleDeleteCategory}
        onSaveCategoryEdit={handleSaveCategoryEdit}
        onCancelCategoryEdit={handleCancelCategoryEdit}
        onClose={() => setIsManageCategoriesOpen(false)}
      />

      

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        isDarkMode={isDarkMode}
        itemToDelete={itemToDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeletion}
      />

      {loading ? (
        <ProductsTableSkeleton isDarkMode={isDarkMode} />
      ) : sortedProducts.length === 0 ? (
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
              paginatedProducts={paginatedProducts}
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
            />
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
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
