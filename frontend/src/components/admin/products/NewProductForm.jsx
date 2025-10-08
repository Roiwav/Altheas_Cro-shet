import React from 'react';
import { ImageIcon, UploadCloud, X as XIcon } from 'lucide-react';
import { getProductImageSrc } from '../../../utils/product';

export default function NewProductForm({
  isDarkMode,
  categories,
  addProductFormData,
  isAddingNewCategory,
  onAddFormChange,
  onCategoryChange,
  onImageChange,
  onImageRemove,
  newImagePreview,
  blockInvalidNumberInput,
  onSubmit,
  onToggleAddCategory,
}) {
  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6 mb-8`}>
      <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add New Product</h3>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Image Uploader */}
        <div className="space-y-4 lg:col-span-1">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Image</label>
          <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} border-dashed rounded-md`}>
            <div className="space-y-1 text-center">
              {newImagePreview ? (
                <div>
                  <img
                    src={getProductImageSrc(newImagePreview)}
                    alt="Preview" className="object-contain w-auto h-48 mx-auto rounded-md" />
                  <button type="button" onClick={onImageRemove} className="mt-2 text-sm text-red-600 hover:text-red-500">Remove Image</button>
                </div>
              ) : (
                <>
                  <ImageIcon className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className={`relative cursor-pointer rounded-md font-medium ${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-500'} focus-within:outline-none`}>
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={onImageChange} />
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
            <input type="text" id="productName" name="productName" value={addProductFormData.productName || ''} onChange={onAddFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
          </div>
          <div>
            <label htmlFor="description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
            <textarea id="description" name="description" rows="4" value={addProductFormData.description || ''} onChange={onAddFormChange} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}></textarea>
          </div>
          <div>
            <label htmlFor="category" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
            {isAddingNewCategory ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New category name"
                  value={addProductFormData.category || ''}
                  onChange={(e) => onAddFormChange({ target: { name: 'category', value: e.target.value } })}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                  autoFocus
                />
                <button type="button" onClick={() => onToggleAddCategory(false)} className={`p-2 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'}`}>
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <select
                id="category"
                name="category"
                value={addProductFormData.category || ''}
                onChange={onCategoryChange}
                required
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
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
                onChange={(e) => onAddFormChange({ target: { name: 'isFeatured', value: e.target.checked }})}
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mark as Featured Product</span>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price (₱)</label>
              <input type="number" id="price" name="price" value={addProductFormData.price || ''} onChange={onAddFormChange} onKeyDown={blockInvalidNumberInput} required min="0" step="0.01" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label htmlFor="quantity" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantity Available</label>
              <input type="number" id="quantity" name="quantity" value={addProductFormData.quantity || ''} onChange={onAddFormChange} onKeyDown={blockInvalidNumberInput} required min="0" className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
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
  );
}
