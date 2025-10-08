// src/context/WishlistCountContext.jsx
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useUser } from './useUser';
import { getWishlist, getKey } from '../utils/wishlist';
import { WishlistCountContext } from './WishlistCountContextCore.js';


export const WishlistCountProvider = ({ children }) => {
  const { user } = useUser();
  const username = (user?.username || user?.email || user?.fullName || 'guest');

  const [wishlistCount, setWishlistCount] = useState(0);

  const computeCount = useCallback((name) => {
    try {
      const items = getWishlist(name);
      return Array.isArray(items) ? items.length : 0;
    } catch {
      return 0;
    }
  }, []);

  const syncWishlistCount = useCallback((name) => {
    const target = name || username;
    setWishlistCount(computeCount(target));
  }, [computeCount, username]);

  useEffect(() => {
    // Initial sync and whenever user changes
    syncWishlistCount(username);
  }, [username, syncWishlistCount]);

  useEffect(() => {
    // Keep in sync across tabs and when localStorage changes
    const handler = (e) => {
      try {
        if (!e?.key) return;
        if (!e.key.startsWith('wishlist_')) return;
        const currentKey = getKey(username);
        if (e.key === currentKey) {
          syncWishlistCount(username);
        }
      } catch (e) {
        void e; // ignore storage event errors
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [username, syncWishlistCount]);

  const value = useMemo(() => ({
    wishlistCount,
    setWishlistCount,
    syncWishlistCount,
  }), [wishlistCount, syncWishlistCount]);

  return (
    <WishlistCountContext.Provider value={value}>
      {children}
    </WishlistCountContext.Provider>
  );
};

// Hook moved to separate file to keep fast-refresh happy
