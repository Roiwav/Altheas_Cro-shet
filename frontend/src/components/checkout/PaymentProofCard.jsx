// src/components/checkout/PaymentProofCard.jsx
import React from 'react';
import { Camera, Upload, Shield, X } from 'lucide-react';

export default function PaymentProofCard({ paymentProofPreview, paymentProof, onUpload, onRemove }) {
  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
      <div className="px-6 py-4 border-b border-red-100 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/30">
            <Camera className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Proof of Payment <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload a screenshot of your GCash payment</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {!paymentProofPreview ? (
          <div className="p-8 text-center transition-colors border-2 border-gray-300 border-dashed dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500">
            <input
              id="payment-proof-upload"
              type="file"
              accept="image/*"
              onChange={onUpload}
              className="hidden"
            />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Upload Payment Proof
            </h4>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Take a screenshot of your GCash payment confirmation and upload it here
            </p>
            <button
              type="button"
              onClick={() => document.getElementById('payment-proof-upload').click()}
              className="inline-flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-700"
            >
              <Camera className="w-4 h-4" />
              Choose Image
            </button>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              PNG, JPG or JPEG (max 5MB)
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <div className="flex items-start gap-4">
                <img
                  src={paymentProofPreview}
                  alt="Payment proof"
                  className="object-cover w-24 h-24 border border-gray-200 rounded-lg dark:border-gray-600"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Payment Proof Uploaded
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {paymentProof?.name}
                  </p>
                  <p className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
                    <Shield className="w-3 h-3" />
                    Ready to place order
                  </p>
                </div>
                <button
                  onClick={onRemove}
                  className="p-1 text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Remove payment proof"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
