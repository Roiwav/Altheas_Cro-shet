import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Edit, Trash2, Check, X } from 'lucide-react';

export default function ManageCategoriesModal({
  isOpen,
  isDarkMode,
  categories,
  baseCategories = [],
  editingCategory,
  newCategoryName,
  onStartEditCategory,
  onChangeNewCategory,
  onDeleteCategory,
  onSaveCategoryEdit,
  onCancelCategoryEdit,
  onClose,
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
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
                  {categories.map((cat) => (
                    <div key={cat} className="flex items-center justify-between p-2 rounded-md group hover:bg-gray-100 dark:hover:bg-gray-700">
                      {editingCategory === cat ? (
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => onChangeNewCategory(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && onSaveCategoryEdit()}
                          className={`flex-grow text-sm rounded-md ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                          autoFocus
                        />
                      ) : (
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{cat}</span>
                      )}
                      {editingCategory === cat ? (
                        <div className="flex items-center space-x-2">
                          <button onClick={onSaveCategoryEdit} className="text-green-500 hover:text-green-700"><Check className="w-5 h-5" /></button>
                          <button onClick={onCancelCategoryEdit} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
                        </div>
                      ) : (
                        !baseCategories.includes(cat) && (
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
                            <button onClick={() => onStartEditCategory(cat)} title={`Edit "${cat}"`} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => onDeleteCategory(cat)} title={`Delete "${cat}"`} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <button type="button" onClick={onClose} className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 focus-visible:ring-gray-500' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-blue-500'}`}>
                    Close
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
