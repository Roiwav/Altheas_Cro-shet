import React, { useState } from 'react';

const CANCEL_REASONS = [
  'Changed my mind',
  'Found a better price',
  'Item no longer needed',
  'Ordered by mistake',
  'Shipping takes too long',
  'Other (please specify)'
];

export default function CancelItemModal({ isOpen, onClose, onConfirm }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const reason = selectedReason === 'Other (please specify)' 
      ? customReason 
      : selectedReason;
      
    try {
      await onConfirm(reason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Cancel Item
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Please let us know why you're canceling this item. This information will help us improve our service.
                </p>
                
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="space-y-2">
                    {CANCEL_REASONS.map((reason) => (
                      <div key={reason} className="flex items-center">
                        <input
                          id={`reason-${reason}`}
                          name="cancel-reason"
                          type="radio"
                          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                          checked={selectedReason === reason}
                          onChange={() => setSelectedReason(reason)}
                          required
                        />
                        <label htmlFor={`reason-${reason}`} className="ml-3 block text-sm font-medium text-gray-700">
                          {reason}
                        </label>
                      </div>
                    ))}
                    
                    {selectedReason === 'Other (please specify)' && (
                      <div className="mt-2">
                        <label htmlFor="custom-reason" className="block text-sm font-medium text-gray-700 mb-1">
                          Please specify the reason
                        </label>
                        <input
                          type="text"
                          id="custom-reason"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Processing...' : 'Confirm Cancellation'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                    >
                      Go Back
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
