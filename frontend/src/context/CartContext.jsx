// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "./useUser";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useUser?.() || { user: null, isAuthenticated: false, isLoading: true };

    console.log("🧑‍💻 CartContext user:", user, "isAuthenticated:", isAuthenticated);

    const [cartItems, setCartItems] = useState([]);
    const [shippingAddress, setShippingAddress] = useState(null);
    const [shippingFee, setShippingFee] = useState(0);

    const API_BASE = "http://localhost:5001/api/v1/cart";

    const getId = (product) => product?.id || product?.id || product?.productId;

    // Save cart to backend (upsert)
    const saveCartForUser = useCallback(async (userId, items, username) => {
        console.log("➡️ Attempting to save cart to backend for user:", userId);
        console.log("➡️ Items to be saved:", items);
        // Critical: Ensure we have a valid user and username before saving.
        if (!userId || !username) { // Use the passed `username` argument
            console.error("❌ Aborting save: userId or username is not available.", { userId, username: username });
            return null;
        }
        try {
            const res = await fetch(`${API_BASE}/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username: username,
                    items,
                    shippingAddress,
                    shippingFee 
                }),
            });
            
            console.log(`📡 Backend responded with status: ${res.status}`);
            if (!res.ok) {
                const errorText = await res.text();
                console.error(`❌ Backend error response: ${errorText}`);
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            console.log("✅ Cart saved successfully, backend response:", data);
            return data;
        } catch (err) {
            console.error("❌ Failed saving cart:", err);
            // Re-throw the error to ensure the calling function knows about it
            throw err;
        }
    }, [shippingAddress, shippingFee]);

    // Load cart from backend
    const loadCartForUser = useCallback(async (userId) => {
        console.log("➡️ Attempting to load cart for user:", userId);
        if (!userId) return { items: [] };
        try {
            const res = await fetch(`${API_BASE}/${userId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.log("✅ Cart loaded from backend:", data);
            
            setShippingAddress(data.shippingAddress || null);
            setShippingFee(data.shippingFee || 0);

            return data;
        } catch (err) {
            console.error("❌ Failed loading cart:", err);
            return { items: [] };
        }
    }, []);

    // Merge local and server carts
    const mergeCarts = (serverItems = [], localItems = []) => {
        console.log("🔄 Merging local and server carts...");
        const map = new Map();
        const addItem = (item) => {
            const id = getId(item);
            if (!id) return;
            const qty = item.qty ?? item.quantity ?? 1;
            const existing = map.get(id);
            if (existing) existing.qty += qty;
            else map.set(id, { ...item, qty });
        };
        serverItems.forEach(addItem);
        localItems.forEach(addItem);
        return Array.from(map.values());
    };

    // Add item to cart
    const addToCart = async (product, quantity = 1) => {
        const id = getId(product);
        if (!id) {
            console.error("❌ Aborting addToCart: Product ID is missing.");
            return;
        }
        
        if (!isAuthenticated) {
            toast.info("Please log in to add items to your cart.");
            return false;
        }

        console.log(`🛍️ addToCart called for product ID: ${id}`);
        const newCart = cartItems.find((p) => getId(p) === id)
            ? cartItems.map((p) => (getId(p) === id ? { ...p, qty: (p.qty || 0) + quantity } : p))
            : [...cartItems, { ...product, qty: quantity }];

        if (isAuthenticated && user?.id) {
            console.log("🔐 User is authenticated, attempting to save to backend...");
            try {
                await saveCartForUser(user.id, newCart, user.username);
                setCartItems(newCart);
                console.log("✔️ Local state updated after successful backend save.");
                return true;
            } catch (err) {
                console.error("❌ Failed to add item to cart due to backend error:", err);
                throw err; // Re-throw to be caught by the calling component
            }
        }
        return false; // Should not be reached, but as a fallback.
    };

    // ✅ ADDED: Update quantity function
    const updateQuantity = async (productId, newQty) => {
        if (newQty <= 0) {
            await removeFromCart(productId);
            return;
        }
        const newCart = cartItems.map(item =>
            getId(item) === productId ? { ...item, qty: newQty } : item
        );
        if (isAuthenticated && user?.id) {
            try {
                await saveCartForUser(user.id, newCart, user.username);
                setCartItems(newCart);
            } catch (err) {
                console.error("❌ Failed to update quantity:", err);
            }
        } else {
            setCartItems(newCart);
        }
    };

    // ✅ ADDED: Remove item function
    const removeFromCart = async (productId) => {
        const newCart = cartItems.filter((item) => getId(item) !== productId);
        if (isAuthenticated && user?.id) {
            try {
                await saveCartForUser(user.id, newCart, user.username);
                setCartItems(newCart);
            } catch (err) {
                console.error("❌ Failed to remove item from cart:", err);
            }
        } else {
            setCartItems(newCart);
        }
    };

    const clearCart = async () => {
        if (isAuthenticated && user?.id) {
            try {
                await saveCartForUser(user.id, [], user.username);
                setCartItems([]);
            } catch (err) {
                console.error("❌ Failed to clear cart:", err);
            }
        } else {
            setCartItems([]);
        }
    };  

    const totalQuantity = cartItems.reduce((sum, it) => sum + (it.qty || 0), 0);
    const totalPrice = cartItems.reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0);

    // This effect handles loading the cart when a user is authenticated,
    // and clearing it when they are not.
    useEffect(() => {
        // A guard to prevent running the effect with stale or incomplete user data during login/logout transitions.
        if (isAuthenticated && !user?.id) {
            console.log("⏳ Waiting for full user object before handling auth change...");
            return;
        }

        // Do nothing until the user's authentication status is fully loaded.
        if (isLoading) {
            console.log("⏳ Waiting for authentication to resolve...");
            return;
        }

        if (isAuthenticated && user?.id) {
            console.log(`➡️ User is authenticated (${user.id}), loading cart...`);
            loadCartForUser(user.id)
                .then(serverCart => setCartItems(serverCart.items || []))
                .catch(err => console.error("❌ Failed to load cart for user:", err));
        } else {
            if (!isLoading) { // Ensure we don't clear the cart prematurely
                console.log("➡️ No authenticated user, cart is cleared.");
                setCartItems([]);
            }
        }
    }, [isAuthenticated, user?.id, isLoading]); // Rerun when auth state or loading status changes

    return (
        <CartContext.Provider
            value={{
                getId,
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity, // ✅ UPDATED: Expose updateQuantity
                saveCartForUser,
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