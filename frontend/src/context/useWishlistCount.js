// src/context/useWishlistCount.js
import { useContext } from 'react';
import { WishlistCountContext } from './WishlistCountContextCore.js';

export function useWishlistCount() {
  const ctx = useContext(WishlistCountContext);
  if (ctx === undefined) {
    throw new Error('useWishlistCount must be used within a WishlistCountProvider');
  }
  return ctx;
}
