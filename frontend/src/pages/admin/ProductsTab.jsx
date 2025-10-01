import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { Plus, ImageIcon, UploadCloud, Trash2 } from 'lucide-react';

const ProductsTab = ({ isDarkMode }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // State to hold product being edited
  const [editFormData, setEditFormData] = useState({}); // Form data for editing

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      // Replace with your actual backend endpoint to fetch products
      fetch('/api/v1/products')
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data.products)) {
            setProducts(data.products);
          } else {
            console.error('Failed to fetch products:', data.message || 'Invalid data structure');
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
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Products</h2>
        <button
          onClick={() => setShowAddProductForm(!showAddProductForm)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <Plus className="w-5 h-5 mr-2" />
          {showAddProductForm ? 'Cancel Add Product' : 'Add New Product'}
        </button>
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
            <div className="space-y-6 lg:col-span-2">
              <div>
                <label htmlFor="productName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Name</label>
                <input type="text" id="productName" name="productName" value={editFormData.productName || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
              </div>
              <div>
                <label htmlFor="description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                <textarea id="description" name="description" rows="4" value={editFormData.description || ''} onChange={handleEditFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}></textarea>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
            <div className="flex justify-end lg:col-span-3">
              <button type="submit" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
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
                <Dialog.Panel className={`w-full max-w-3xl transform overflow-hidden rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 text-left align-middle shadow-xl transition-all`}>
                  <Dialog.Title as="h3" className={`text-lg font-medium leading-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Edit Product: {editingProduct?.name}
                  </Dialog.Title>
                  <form onSubmit={handleEditProductSubmit} className="grid grid-cols-1 gap-6 mt-4 lg:grid-cols-2">
                    {/* Image Uploader for Edit */}
                    <div className="space-y-4">
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Image</label>
                      <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} border-dashed rounded-md`}>
                        <div className="space-y-1 text-center">
                          {newImagePreview ? (
                            <div>
                              <img src={newImagePreview} alt="Product preview" className="object-contain w-auto h-48 mx-auto rounded-md" />
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
                    <div className="flex justify-end mt-4 space-x-3 lg:col-span-2">
                      <button
                        type="button"
                        className={`inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 focus-visible:ring-blue-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-blue-500'}`}
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
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="mr-2 text-pink-600 hover:text-pink-800"
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

export default ProductsTab;