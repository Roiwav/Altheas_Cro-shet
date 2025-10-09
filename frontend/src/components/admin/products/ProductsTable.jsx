import React from 'react';
import { Star, Trash2, Edit } from 'lucide-react';
import { formatPHP } from '../../../utils/currency';
import { getProductImageSrc } from '../../../utils/product';

function HeaderCell({ children, isDarkMode, sortable, onClick, active, order, title }) {
  const className = `px-6 py-3 text-left text-xs font-medium ${
    sortable ? 'cursor-pointer select-none' : ''
  } ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`;
  return (
    <th className={className} onClick={onClick} title={title}>
      {children}
      {active ? (order === 'asc' ? ' ↑' : ' ↓') : null}
    </th>
  );
}

export default function ProductsTable({
  isDarkMode,
  paginatedProducts,
  selectedProducts,
  selectAllRef,
  handleSelectAll,
  handleSelectOne,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
  handleEditClick,
  handleDeleteClick,
  handleToggleFeatured,
  getCategoryColorClass,
}) {
  const PLACEHOLDER_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>Image not available</text></svg>";
  const isValidUrl = React.useCallback((u) => (
    typeof u === 'string' && (
      u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:') || u.startsWith('blob:')
    )
  ), []);
  const toCloudinaryThumb = React.useCallback((u) => {
    if (!isValidUrl(u)) return u;
    try {
      const url = new URL(u);
      if (!url.hostname.includes('res.cloudinary.com')) return u;
      const parts = url.pathname.split('/');
      const uploadIdx = parts.findIndex(p => p === 'upload');
      if (uploadIdx === -1) return u;
      // Use Cloudinary default image (d_<public_id>) to avoid 404/ORB when the source image is missing.
      // This public_id must exist in your Cloudinary account; using one from productImages mapping (10_z2bdkx).
      const transform = 'f_auto,q_auto,c_fill,w_80,h_80,d_10_z2bdkx';
      if (parts[uploadIdx + 1] && parts[uploadIdx + 1].includes(',')) {
        parts[uploadIdx + 1] = `${transform},${parts[uploadIdx + 1]}`;
      } else {
        parts.splice(uploadIdx + 1, 0, transform);
      }
      url.pathname = parts.join('/');
      return url.toString();
    } catch {
      return u;
    }
  }, [isValidUrl]);
  const resolveImage = (product) => {
    const candidate = product?.imagePublicId || product?.image;
    const resolved = getProductImageSrc(candidate);
    return resolved || PLACEHOLDER_SVG;
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <tr>
            <th className="px-6 py-3">
              <input
                type="checkbox"
                ref={selectAllRef}
                onChange={handleSelectAll}
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-600"
              />
            </th>
            <HeaderCell
              isDarkMode={isDarkMode}
              sortable
              active={sortBy === 'name'}
              order={sortOrder}
              onClick={() => {
                if (sortBy === 'name') setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                else {
                  setSortBy('name');
                  setSortOrder('asc');
                }
              }}
              title="Sort by Product Name"
            >
              Product
            </HeaderCell>
            <HeaderCell
              isDarkMode={isDarkMode}
              sortable
              active={sortBy === 'price'}
              order={sortOrder}
              onClick={() => {
                if (sortBy === 'price') setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                else {
                  setSortBy('price');
                  setSortOrder('asc');
                }
              }}
              title="Sort by Price"
            >
              Price
            </HeaderCell>
            <HeaderCell
              isDarkMode={isDarkMode}
              sortable
              active={sortBy === 'date'}
              order={sortOrder}
              onClick={() => {
                if (sortBy === 'date') setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                else {
                  setSortBy('date');
                  setSortOrder('desc');
                }
              }}
              title="Sort by Date Added"
            >
              Date Added
            </HeaderCell>
            <HeaderCell isDarkMode={isDarkMode}>Category</HeaderCell>
            <th className={`px-6 py-3 text-center text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
              Featured
            </th>
            <HeaderCell isDarkMode={isDarkMode}>Actions</HeaderCell>
          </tr>
        </thead>
        <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
          {paginatedProducts.map((product) => (
            <tr
              key={product._id}
              className={`${
                isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
              } ${selectedProducts.includes(product._id) ? (isDarkMode ? 'bg-pink-900/20' : 'bg-pink-50') : ''}`}
            >
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product._id)}
                  onChange={(e) => handleSelectOne(e, product._id)}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-600"
                />
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={toCloudinaryThumb(resolveImage(product))}
                    alt={product.name}
                    className="h-10 w-10 rounded object-cover border border-gray-200 dark:border-gray-700"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_SVG; }}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <span className="truncate">{product.name}</span>
                </div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                {formatPHP(product.price)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {new Date(product.createdAt).toLocaleDateString()}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className={`font-medium ${getCategoryColorClass(product.category, isDarkMode)}`}>
                  {product.category}
                </span>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="p-2 rounded-md hover:bg-pink-50 dark:hover:bg-gray-700"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-pink-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(product._id, product.name)}
                    className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-gray-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
