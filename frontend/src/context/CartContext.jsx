import { useState, useEffect } from "react";
import { CartContext } from "./cart-context";

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);  // State to store cart items
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));  // User information (from localStorage)

  const backendURL = "http://localhost/croshet_db";  // Backend URL for API calls

  // Fetch cart items when the user is logged in
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser?.id) {
      fetchCart(storedUser.id);  // Fetch cart data if user exists
    }
  }, []); // Runs only on initial load

  // Fetch the cart items from the backend
  const fetchCart = async (userId) => {
    try {
      const localUserId = userId || JSON.parse(localStorage.getItem('user'))?.id;
      const res = await fetch(`${backendURL}/get-cart.php?user_id=${localUserId}`); // API call to fetch cart
      const data = await res.json();
      if (data.status === 'success') {
        setCartItems(data.cart);  // Set the cart data from backend
      } else {
        console.error("Fetch cart failed:", data.message);  // Log error if fetch fails
      }
    } catch (err) {
      console.error("Fetch cart error:", err);  // Log network errors
    }
  };

  // Add product to the cart
  const addToCart = async (product, quantity = 1) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${backendURL}/add-to-cart.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,  // User ID for cart association
          product_id: product.id,  // Product ID
          quantity,  // Quantity to add to cart
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        await fetchCart(user.id);  // Refresh cart data after adding product
      } else {
        console.error(`Error: ${data.message}`);  // Log error if adding to cart fails
      }
    } catch (err) {
      console.error("Add to cart error:", err);  // Log errors if the fetch fails
    }
  };

  // Update the quantity of a cart item
  const updateQuantity = async (productId, qty) => {
    if (!user?.id || qty < 0) return;

    try {
      const response = await fetch(`${backendURL}/update-cart.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,  // User ID for cart association
          product_id: productId,  // Product ID
          quantity: qty,  // New quantity
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        await fetchCart(user.id);  // Refresh cart after updating quantity
      } else {
        console.error(`Error: ${data.message}`);  // Log error if quantity update fails
      }
    } catch (err) {
      console.error("Update cart error:", err);  // Log fetch errors
    }
  };

  // Remove an item from the cart
  const removeFromCart = async (productId) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${backendURL}/delete-from-cart.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,  // User ID for cart association
          product_ids: [productId],  // Product ID to remove
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        await fetchCart(user.id);  // Refresh cart after removal
      } else {
        console.error(`Error: ${data.message}`);  // Log error if removal fails
      }
    } catch (err) {
      console.error("Remove from cart error:", err);  // Log errors if the fetch fails
    }
  };

  // Clear all items from the cart
  const clearCart = async () => {
    if (!user?.id) return;

    const allIds = cartItems.map((item) => item.id);  // Get all product IDs in the cart
    try {
      const response = await fetch(`${backendURL}/delete-from-cart.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,  // User ID for cart association
          product_ids: allIds,  // Array of all product IDs to clear the cart
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setCartItems([]);  // Clear the cart state locally
      } else {
        console.error(`Error: ${data.message}`);  // Log error if clearing fails
      }
    } catch (err) {
      console.error("Clear cart error:", err);  // Log errors if the fetch fails
    }
  };

  // Calculate the total quantity of items in the cart
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,  // Provide cart items
        setCartItems,  // Allow setting cart items from outside the context
        addToCart,  // Add product to cart
        updateQuantity,  // Update quantity in the cart
        removeFromCart,  // Remove product from cart
        clearCart,  // Clear all items from cart
        refreshCart: fetchCart,  // Trigger a manual refresh of the cart
        totalQuantity,  // Total quantity of items in cart
        setUser,  // Allow logout or user update
      }}
    >
      {children}  {/* Render children components */}
    </CartContext.Provider>
  );
};
