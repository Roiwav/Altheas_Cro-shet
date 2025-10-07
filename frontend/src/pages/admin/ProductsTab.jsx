import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { Plus, ImageIcon, UploadCloud } from 'lucide-react';

const ProductsTab = ({ isDarkMode }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

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
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      toast.error('Failed to fetch products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Sorting logic
  const sortedProducts = React.useMemo(() => {
    let sorted = [...products];
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
  }, [products, sortBy, sortOrder]);

  const handleNewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleNewRemoveImage = () => {
    setNewImage(null);
    setNewImagePreview(null);
  };

  const handleNewProductSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.productName || !editFormData.description || !newImage || !editFormData.price || !editFormData.quantity) {
      toast.error("All fields and image required.");
      return;
    }
    const formData = new FormData();
    formData.append("name", editFormData.productName);
    formData.append("description", editFormData.description);
    formData.append("price", editFormData.price);
    formData.append("quantity", editFormData.quantity);
    formData.append("image", newImage);

    try {
      const res = await fetch("http://localhost:5001/api/v1/products", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Product added!");
        setProducts((prev) => [data.product, ...prev]);
        setShowAddProductForm(false);
        setEditFormData({});
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
    });
    setNewImagePreview(product.image?.startsWith("/uploads") ? `http://localhost:5001${product.image}` : product.image);
    setShowAddProductForm(false);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.productName?.trim() || !editFormData.description?.trim() || !editFormData.price || !editFormData.quantity) {
      toast.error("All fields required.");
      return;
    }
    const formData = new FormData();
    formData.append("name", editFormData.productName);
    formData.append("description", editFormData.description);
    formData.append("price", editFormData.price);
    formData.append("quantity", editFormData.quantity);
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
    setNewImagePreview(null);
  };

  const handleDeleteClick = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        const res = await fetch(`http://localhost:5001/api/v1/products/${productId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("Product deleted.");
          setProducts(prev => prev.filter(p => p._id !== productId));
        } else {
          const data = await res.json();
          toast.error(data.message || "Failed to delete.");
        }
      } catch {
        toast.error("Server error.");
      }
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

      {/* Edit Modal */}
      <Transition appear show={editingProduct !== null} as={Fragment}>
        {/* ...edit dialog unchanged, same as the previous version I sent ... */}
      </Transition>

      {loading ? (
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading products...</p>
      ) : (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-x-auto`}>
          <table className="w-full text-left">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
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
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
              {sortedProducts.map(product => (
                <tr key={product._id} className={isDarkMode ? 'hover:bg-gray-700/50' : ''}>
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
      )}
    </div>
  );
};

export default ProductsTab;
