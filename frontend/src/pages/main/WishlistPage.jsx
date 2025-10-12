// src/pages/main/WishlistPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaTrash, FaShoppingCart } from "react-icons/fa";
import { toast } from "react-toastify";
import { useUser } from "../../context/useUser";
import { getWishlist, toggleWishlist } from "../../utils/wishlist";
import { useWishlistCount } from "../../context/useWishlistCount.js";
import { getProductImageSrc } from "../../utils/product.js";

/**
 * Renders the user's wishlist page.
 * It retrieves wishlist items from localStorage based on the current user's identity
 * and allows users to remove items or proceed to buy them.
 */
export default function WishlistPage() {
  const { user } = useUser();
  // Create a unique username key for localStorage, falling back to "guest".
  const username = (user?.username || user?.email || user?.fullName || "guest");
  const { syncWishlistCount } = useWishlistCount();

  const [items, setItems] = useState([]);

  /**
   * Effect to load the wishlist from localStorage when the component mounts or the user changes.
   */
  useEffect(() => {
    const items = getWishlist(username);
    setItems(items);
    syncWishlistCount(username);
  }, [username, syncWishlistCount]);

  /**
   * Handles adding or removing a product from the wishlist.
   */
  const handleToggle = (product) => {
    if (!user) {
      toast.warn("Please log in to modify your wishlist.");
      return;
    }
    const { added, items: next } = toggleWishlist(username, product);
    setItems(next);
    toast[added ? "success" : "info"](added ? "Added to wishlist" : "Removed from wishlist");
    syncWishlistCount(username);
  };

  if (!items.length) {
    return (
      <main className={`relative z-10 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen pt-16 pb-16 px-6 md:px-20 transition-all duration-300 ease-in-out ${user ? 'md:ml-[var(--sidebar-width,5rem)]' : ''}`}>
        <div className="max-w-5xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">Your Wishlist is Empty</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Browse the shop and add items you love.</p>
          <Link to="/shop" className="inline-flex items-center px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg">
            <FaShoppingCart className="mr-2" /> Go to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`relative z-10 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen pt-16 pb-16 px-6 md:px-20 transition-all duration-300 ease-in-out ${user ? 'md:ml-[var(--sidebar-width,5rem)]' : ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Wishlist</h1>
          <p className="text-gray-600 dark:text-gray-300">Saved items for {username}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <div key={it.id} className="relative border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col">
              <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden rounded-lg">
                {it.image ? (
                  <img src={getProductImageSrc(it.image)} alt={it.name} className="object-contain w-full h-full" />
                ) : (
                  <div className="text-gray-400">No image</div>
                )}
              </div>

              <div className="mt-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{it.name}</h3>
                <p className="text-pink-600 dark:text-pink-400 font-bold mt-1">
                  {typeof it.price === "number" ? `₱${it.price.toFixed(2)}` : it.price}
                </p>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleToggle(it)}
                  className="inline-flex items-center px-4 py-2 border rounded-lg text-pink-600 border-pink-600 hover:bg-pink-600 hover:text-white"
                >
                  <FaTrash className="mr-2" /> Remove
                </button>
                <Link
                  to="/shop"
                  state={{ openProductModal: true, selectedProduct: it }}
                  className="inline-flex items-center px-4 py-2 bg-pink-500 hover:bg-pink-900 text-white rounded-lg"
                >
                  <FaShoppingCart className="mr-2" /> Buy Now!
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
