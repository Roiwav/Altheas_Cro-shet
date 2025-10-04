// src/context/CartContext.jsx (UPDATED - fixed duplicate prevention)
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "./useUser";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie';

export const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const GUEST_CART_ID_COOKIE = 'guest-cart-id';

export const CartProvider = ({ children }) => {
    const { user, token, isAuthenticated, isLoading, fetchUser, updateUser } = useUser?.() || { user: null, token: null, isAuthenticated: false, isLoading: true, fetchUser: () => {}, updateUser: () => {} };

    console.log("🧑‍💻 CartContext user:", user, "isAuthenticated:", isAuthenticated);

    const [cartItems, setCartItems] = useState([]);
    const [shippingAddress, setShippingAddress] = useState(null);
    const [shippingFee, setShippingFee] = useState(0);
    const [isCartLoading, setIsCartLoading] = useState(true);

    const API_BASE = "http://localhost:5001/api/v1";

    // ✅ FIXED: Improved getId function to handle variations consistently
    const getId = useCallback((product) => {
        const baseId = product.productId || product._id || product.id;
        const variation = product.variation || "";
        
        // Always include variation in the ID, even if empty
        return `${baseId}${variation ? `-${variation}` : ""}`;
    }, []);

    // Generic function to save the cart to the backend
    const saveCart = useCallback(async (items, currentShippingAddress, currentShippingFee) => {
        setIsCartLoading(true);
        const userId = user?.id;
        const guestId = Cookies.get(GUEST_CART_ID_COOKIE);

        let url = `${API_BASE}/cart?`;
        if (userId) {
            url += `userId=${userId}`;
        } else if (guestId) {
            url += `guestId=${guestId}`;
        }

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user?.username,
                    items,
                    shippingAddress: currentShippingAddress,
                    shippingFee: currentShippingFee
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`❌ Backend error response: ${errorText}`);
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            console.log("✅ Cart saved to backend:", data);

            // If it was a new guest cart, the backend returns a guestId. We need to save it in a cookie.
            if (!userId && !guestId && data.guestId) {
                Cookies.set(GUEST_CART_ID_COOKIE, data.guestId, { expires: 365 });
            }

            // Update local state
            setCartItems(data.items || []);
            setShippingAddress(data.shippingAddress || null);
            setShippingFee(data.shippingFee || 0);

            return data;
        } catch (err) {
            console.error("❌ Failed saving cart:", err);
            toast.error("Could not update cart.");
            throw err;
        } finally {
            setIsCartLoading(false);
        }
    }, [user]);

    // Load cart from backend
    const loadCart = useCallback(async () => {
        setIsCartLoading(true);
        const userId = user?.id;
        const guestId = Cookies.get(GUEST_CART_ID_COOKIE);

        if (!userId && !guestId) {
            console.log("➡️ No user or guest ID, initializing empty cart.");
            setCartItems([]);
            setShippingAddress(null);
            setShippingFee(0);
            setIsCartLoading(false);
            return;
        }

        let url = `${API_BASE}/cart?`;
        if (userId) {
            url += `userId=${userId}`;
        } else if (guestId) {
            url += `guestId=${guestId}`;
        }

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.log("✅ Cart loaded from backend:", data);

            setCartItems(data.items || []);
            setShippingAddress(data.shippingAddress || null);
            setShippingFee(data.shippingFee || 0);
        } catch (err) {
            console.error("❌ Failed loading cart:", err);
            setCartItems([]); // Clear cart on error
        } finally {
            setIsCartLoading(false);
        }
    }, [user]);

    // Merge carts on login
    const mergeCartOnLogin = useCallback(async (userId) => {
        const guestId = Cookies.get(GUEST_CART_ID_COOKIE); // Get guestId before potential async operations
        if (!guestId) {
            await loadCart(); // Just load user's cart if it exists
            return;
        }
        console.log(`🔄 Merging guest cart (${guestId}) with user cart (${userId})`);
        try {
            const res = await fetch(`${API_BASE}/cart/merge`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Add authorization token
                },
                body: JSON.stringify({ userId, guestId }),
            });
            if (!res.ok) throw new Error('Failed to merge carts');
            const mergedCart = await res.json();
            setCartItems(mergedCart.items || []);
            setShippingAddress(mergedCart.shippingAddress || null);
            setShippingFee(mergedCart.shippingFee || 0);
            Cookies.remove(GUEST_CART_ID_COOKIE); // Clean up guest cookie            
            // The /cart/merge endpoint might return a partial user object.
            // Instead of overwriting the user state, we re-fetch the full user object
            // to ensure all data (like addresses) is up-to-date and consistent.
            fetchUser();
            console.log("✅ Carts merged successfully.");
        } catch (error) {
            console.error("❌ Failed to merge carts:", error);
            toast.error("Could not merge your guest cart.");
            await loadCart(); // Fallback to loading user's cart
        }
    }, [token, loadCart, fetchUser]);

    // ✅ ENHANCED: Add item to cart with improved duplicate detection and logging
    const addToCart = useCallback(async (product, quantity = 1) => {
        console.log("🛒 Adding to cart:", product, "quantity:", quantity);
        
        const productToAdd = {
            productId: product._id || String(product.id), // Use _id from DB or id from local data
            name: product.name,
            price: product.price,
            image: product.image || (product.images && product.images[0]),
            variation: product.variation || "", // Ensure variation is always a string
            quantity: quantity,
        };

        const id = getId(productToAdd);
        console.log("🔑 Generated ID:", id);
        console.log("📦 Current cart items:", cartItems);

        const existingItem = cartItems.find(item => {
            const itemId = getId(item);
            console.log("🔍 Comparing:", itemId, "vs", id);
            return itemId === id;
        });

        let newCartItems;
        if (existingItem) {
            console.log("✅ Found existing item, updating quantity:", existingItem.quantity + quantity);
            newCartItems = cartItems.map(item =>
                getId(item) === id ? { ...item, quantity: item.quantity + quantity } : item
            );
            // Show appropriate toast message
            toast.success(`Updated ${product.name} quantity to ${existingItem.quantity + quantity}!`, {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
            });
        } else {
            console.log("➕ Adding new item to cart");
            newCartItems = [...cartItems, productToAdd];
            // Show appropriate toast message  
            toast.success(`${product.name} added to cart!`, {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
            });
        }

        console.log("💾 Saving new cart:", newCartItems);
        await saveCart(newCartItems, shippingAddress, shippingFee);
    }, [cartItems, getId, saveCart, shippingAddress, shippingFee]);

    const removeFromCart = useCallback(async (productId) => {
        const newCartItems = cartItems.filter((item) => getId(item) !== productId);
        await saveCart(newCartItems, shippingAddress, shippingFee);
    }, [cartItems, getId, saveCart, shippingAddress, shippingFee]);

    const updateQuantity = useCallback(async (productId, newQuantity) => {
        if (newQuantity <= 0) {
            await removeFromCart(productId);
            return;
        }
        const newCartItems = cartItems.map(item =>
            getId(item) === productId ? { ...item, quantity: newQuantity } : item
        );
        await saveCart(newCartItems, shippingAddress, shippingFee);
    }, [cartItems, getId, saveCart, removeFromCart, shippingAddress, shippingFee]);

    const clearCart = useCallback(async () => {
        await saveCart([], null, 0);
    }, [saveCart]);

    const totalQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);

    // Main effect to handle auth changes and initial load
    useEffect(() => {
        if (isLoading) {
            console.log("⏳ CartContext: Waiting for authentication to resolve...");
            return;
        }

        if (isAuthenticated && user?.id && token) { // Ensure token is also available
            // User is logged in, merge guest cart (if any) and load.
            mergeCartOnLogin(user.id);
        } else {
            // User is a guest or has logged out, load cart using guestId from cookie.
            loadCart();
        }
    }, [isAuthenticated, user?.id, token, isLoading, loadCart, mergeCartOnLogin]);

    return (
        <CartContext.Provider
            value={{
                getId,
                cartItems,
                isCartLoading,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalQuantity,
                totalPrice,
                shippingAddress,
                setShippingAddress,
                shippingFee,
                setShippingFee,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};