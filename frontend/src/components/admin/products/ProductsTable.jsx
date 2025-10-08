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
}) {
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
            <HeaderCell isDarkMode={isDarkMode}>Stock</HeaderCell>
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
                    src={getProductImageSrc(product.image)}
                    alt={product.name}
                    className="h-10 w-10 rounded object-cover border border-gray-200 dark:border-gray-700"
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
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {(() => {
                  const qty = Number(product.quantity || 0);
                  const badgeBase = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
                  let cls = isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700';
                  if (qty > 10) cls = 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
                  else if (qty > 0) cls = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
                  else cls = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
                  return <span className={`${badgeBase} ${cls}`}>{qty}</span>;
                })()}
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
