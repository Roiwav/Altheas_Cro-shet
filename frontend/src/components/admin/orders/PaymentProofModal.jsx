// src/components/admin/orders/PaymentProofModal.jsx
import React from 'react';
import { X } from 'lucide-react';

export default function PaymentProofModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-full">
        <button 
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
        >
          <X className="h-8 w-8" />
        </button>
        <img
          src={imageUrl}
          alt="Payment Proof"
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
