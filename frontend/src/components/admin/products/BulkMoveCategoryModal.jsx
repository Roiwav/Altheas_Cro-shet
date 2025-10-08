import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';

export default function BulkMoveCategoryModal({
  isOpen,
  isDarkMode,
  categoryToDelete,
  productsCount,
  categories,
  newCategoryForMove,
  onChangeNewCategoryForMove,
  onCancel,
  onConfirm,
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onCancel}>
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
                    The category <strong>{categoryToDelete}</strong> is currently assigned to <strong>{productsCount}</strong> product(s). To delete it, please move these products to another category first.
                  </p>
                  <div className="mt-4">
                    <label htmlFor="new-category-select" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Move products to:
                    </label>
                    <select
                      id="new-category-select"
                      value={newCategoryForMove}
                      onChange={(e) => onChangeNewCategoryForMove(e.target.value)}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                    >
                      <option value="" disabled>Select a new category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-6 space-x-2">
                  <button type="button" onClick={onCancel} className={`px-4 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                    Cancel
                  </button>
                  <button type="button" onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50" disabled={!newCategoryForMove}>
                    Move and Delete
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
