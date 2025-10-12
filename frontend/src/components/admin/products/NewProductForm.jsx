import React from 'react';
import { ImageIcon, UploadCloud, X as XIcon, Loader2 } from 'lucide-react';
import { getProductImageSrc } from '../../../utils/product';

/**
 * A form for adding a new product to the store.
 * It can be rendered as a standalone component or as a modal.
 * @param {object} props - The component props.
 * @param {boolean} [props.isOpen] - If provided, controls the visibility of the form.
 * @param {function} [props.onClose] - If provided, renders a close button and calls this on click.
 * @param {boolean} props.isDarkMode - Flag to enable dark mode styling.
 * @param {string[]} props.categories - List of available product categories.
 * @param {object} props.addProductFormData - The state object for the new product's data.
 * @param {boolean} props.isAddingNewCategory - Flag to show the "new category" input field.
 * @param {function} props.onAddFormChange - Handler for form input changes.
 * @param {function} props.onCategoryChange - Special handler for the category dropdown.
 * @param {function} props.onImageChange - Handler for the file input change event.
 * @param {function} props.onImageRemove - Handler to remove the selected image.
 * @param {string|null} props.newImagePreview - Data URL for the new image preview.
 * @param {function} props.blockInvalidNumberInput - Event handler to prevent invalid characters in number inputs.
 * @param {function} props.onSubmit - The form submission handler.
 * @param {function} props.onToggleAddCategory - Callback to toggle the "new category" input.
 * @param {boolean} props.submitting - Flag to indicate if the form is currently submitting.
 */
export default function NewProductForm({
  isOpen,
  onClose,
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
  submitting,
}) {
  // If parent passes isOpen, respect it; otherwise render by default
  if (typeof isOpen !== 'undefined' && !isOpen) return null;
  return (
    <div className={`relative p-6 mb-8 rounded-xl shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {submitting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 rounded-xl">
          <div className="flex items-center px-4 py-2 text-white bg-gray-900/80 rounded-md shadow">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Saving...
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add New Product</h3>
        {typeof onClose === 'function' && (
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={`p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Image Uploader */}
        <div className="space-y-4 lg:col-span-1">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Product Image
          </label>
          <div
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
              isDarkMode ? 'border-gray-600' : 'border-gray-300'
            } border-dashed rounded-md`}
          >
            <div className="space-y-1 text-center">
              {newImagePreview ? (
                <div>
                  <img src={getProductImageSrc(newImagePreview)} alt="Preview" className="object-contain w-auto h-48 mx-auto rounded-md" />
                  <button type="button" onClick={onImageRemove} className="mt-2 text-sm text-red-600 hover:text-red-500">
                    Remove Image
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="image"
                      className={`relative cursor-pointer rounded-md font-medium ${
                        isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-500'
                      } focus-within:outline-none`}
                    >
                      <span>Upload a file</span>
                      {/* Name must be 'image' to match backend multer.single("image") */}
                      <input
                        id="image"
                        name="image"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={onImageChange}
                        disabled={submitting}
                      />
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
            <label htmlFor="name" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Product Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={addProductFormData.name || ''}
              onChange={onAddFormChange}
              required
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
          </div>
          <div>
            <label htmlFor="description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={addProductFormData.description || ''}
              onChange={onAddFormChange}
              required
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            ></textarea>
          </div>
          <div>
            <label htmlFor="category" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Category
            </label>
            {isAddingNewCategory ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New category name"
                  value={addProductFormData.category || ''}
                  onChange={(e) => onAddFormChange({ target: { name: 'category', value: e.target.value } })}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => onToggleAddCategory(false)}
                  className={`p-2 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'}`}
                >
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
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                }`}
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
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
                onChange={(e) => onAddFormChange({ target: { name: 'isFeatured', value: e.target.checked } })}
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
                  checked={(addProductFormData.badges || []).includes('bestSeller')}
                  onChange={(e) => {
                    const current = addProductFormData.badges || [];
                    const next = e.target.checked ? Array.from(new Set([...current, 'bestSeller'])) : current.filter((b) => b !== 'bestSeller');
                    onAddFormChange({ target: { name: 'badges', value: next } });
                  }}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Best Seller</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(addProductFormData.badges || []).includes('bestChoice')}
                  onChange={(e) => {
                    const current = addProductFormData.badges || [];
                    const next = e.target.checked ? Array.from(new Set([...current, 'bestChoice'])) : current.filter((b) => b !== 'bestChoice');
                    onAddFormChange({ target: { name: 'badges', value: next } });
                  }}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Best Choice</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(addProductFormData.badges || []).includes('new')}
                  onChange={(e) => {
                    const current = addProductFormData.badges || [];
                    const next = e.target.checked ? Array.from(new Set([...current, 'new'])) : current.filter((b) => b !== 'new');
                    onAddFormChange({ target: { name: 'badges', value: next } });
                  }}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>New</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="price" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Price (₱)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={addProductFormData.price || ''}
                onChange={onAddFormChange}
                onKeyDown={blockInvalidNumberInput}
                required
                min="0"
                step="0.01"
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label htmlFor="quantity" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Quantity Available
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={addProductFormData.quantity || ''}
                onChange={onAddFormChange}
                onKeyDown={blockInvalidNumberInput}
                required
                min="0"
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end lg:col-span-3">
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center px-6 py-3 text-base font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
              submitting ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'
            }`}
          >
            {submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving...</> : <><UploadCloud className="w-5 h-5 mr-2" />Add Product</>}
          </button>
        </div>
      </form>
    </div>
  );
}
