// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "./useUser";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useUser?.() || { user: null, isAuthenticated: false, isLoading: true };
    const prevAuth = useRef(isAuthenticated);
    useEffect(() => {
        // Keep track of the previous authentication state to detect logout
        prevAuth.current = isAuthenticated;
    }, [isAuthenticated]);

    console.log("🧑‍💻 CartContext user:", user, "isAuthenticated:", isAuthenticated);

    // Initialize cart from localStorage for guest users
    const [cartItems, setCartItems] = useState(() => {
        const localCart = localStorage.getItem('guestCart');
        return localCart ? JSON.parse(localCart) : [];
    });
    const cartItemsRef = useRef(cartItems);
    useEffect(() => {
        // Keep a ref to the latest cartItems to use in the logout logic
        // without adding cartItems to the main useEffect dependency array.
        cartItemsRef.current = cartItems;
    }, [cartItems]);
    const [shippingAddress, setShippingAddress] = useState(null);
    const [shippingFee, setShippingFee] = useState(0);

    const API_BASE = "http://localhost:5001/api/v1/cart";

    const getId = useCallback((product) => product?._id || product?.id || product?.productId, []);

    // Save cart to backend (upsert)
    const saveCartForUser = useCallback(async (userId, items, username, currentShippingAddress, currentShippingFee) => {
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
                    shippingAddress: currentShippingAddress,
                    shippingFee: currentShippingFee 
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
    }, []);

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
    const mergeCarts = useCallback((serverItems = [], localItems = []) => {
        console.log("🔄 Merging local and server carts...");
        if (!localItems || localItems.length === 0) return serverItems;

        const map = new Map();

        // Helper to add or update an item in the map
        const addItem = (item) => {
            const id = getId(item);
            if (!id) return;
            const qty = item.qty || item.quantity || 1;
            const existing = map.get(id);
            // Prioritize server item details but sum quantities
            if (existing) {
                existing.qty += qty;
            } else {
                map.set(id, { ...item, qty });
            }
        };

        serverItems.forEach(addItem);
        localItems.forEach(addItem);
        return Array.from(map.values());
    }, [getId]);

    // Add item to cart
    const addToCart = useCallback(async (product, quantity = 1) => {
        const id = getId(product);
        if (!id) {
            console.error("❌ Aborting addToCart: Product ID is missing.");
            return;
        }
        
        console.log(`🛍️ addToCart called for product ID: ${id}`);
        const newCart = cartItems.find((p) => getId(p) === id)
            ? cartItems.map((p) => (getId(p) === id ? { ...p, qty: (p.qty || 0) + quantity } : p))
            : [...cartItems, { ...product, qty: quantity }];

        if (isAuthenticated && user?.id) {
            console.log("🔐 User is authenticated, attempting to save to backend...");
            try {
                await saveCartForUser(user.id, newCart, user.username, shippingAddress, shippingFee);
                setCartItems(newCart);
                console.log("✔️ Local state updated after successful backend save.");
                return true;
            } catch (err) {
                console.error("❌ Failed to save cart to backend:", err);
                toast.error("Could not update cart on the server.");
                return false;
            }
        } else {
            // Guest user: save to localStorage
            localStorage.setItem('guestCart', JSON.stringify(newCart));
            setCartItems(newCart);
        }
    }, [cartItems, getId, isAuthenticated, user, saveCartForUser, shippingAddress, shippingFee]);

    // ✅ ADDED: Remove item function
    const removeFromCart = useCallback(async (productId) => {
        const newCart = cartItems.filter((item) => getId(item) !== productId);
        if (isAuthenticated && user?.id) {
            try {
                await saveCartForUser(user.id, newCart, user.username, shippingAddress, shippingFee);
                setCartItems(newCart);
            } catch (err) {
                console.error("❌ Failed to remove item from cart:", err);
            }
        } else {
            // Guest user
            setCartItems(newCart);
            localStorage.setItem('guestCart', JSON.stringify(newCart));
        }
    }, [cartItems, getId, isAuthenticated, user, saveCartForUser, shippingAddress, shippingFee]);

    // ✅ ADDED: Update quantity function
    const updateQuantity = useCallback(async (productId, newQty) => {
        if (newQty <= 0) {
            await removeFromCart(productId);
            return;
        }
        const newCart = cartItems.map(item =>
            getId(item) === productId ? { ...item, qty: newQty } : item
        );
        if (isAuthenticated && user?.id) {
            try {
                await saveCartForUser(user.id, newCart, user.username, shippingAddress, shippingFee);
                setCartItems(newCart);
            } catch (err) {
                console.error("❌ Failed to update quantity:", err);
            }
        } else {
            // Guest user
            setCartItems(newCart);
            localStorage.setItem('guestCart', JSON.stringify(newCart));
        }
    }, [cartItems, getId, isAuthenticated, user, saveCartForUser, removeFromCart, shippingAddress, shippingFee]);

    const clearCart = useCallback(async () => {
        if (isAuthenticated && user?.id) {
            try {
                await saveCartForUser(user.id, [], user.username, shippingAddress, shippingFee);
                setCartItems([]);
            } catch (err) {
                console.error("❌ Failed to clear cart:", err);
            }
        } else {
            // Guest user
            setCartItems([]);
            localStorage.removeItem('guestCart');
        }
    }, [isAuthenticated, user, saveCartForUser, shippingAddress, shippingFee]);

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
            const localCartData = localStorage.getItem('guestCart');
            const localItems = localCartData ? JSON.parse(localCartData) : [];

            loadCartForUser(user.id).then(serverCart => {
                const serverItems = serverCart.items || [];
                const mergedItems = mergeCarts(serverItems, localItems);
                
                setCartItems(mergedItems);

                // If there were local items, save the merged cart to the backend and clear local storage
                if (localItems.length > 0) {
                    saveCartForUser(user.id, mergedItems, user.username, serverCart.shippingAddress, serverCart.shippingFee)
                        .then(() => localStorage.removeItem('guestCart'))
                        .catch(err => console.error("❌ Failed to save merged cart:", err));
                }
            }).catch(err => console.error("❌ Failed to load cart for user:", err));
        } else if (prevAuth.current && !isAuthenticated) {
            // User has just logged out. Save their current cart to localStorage.
            if (cartItemsRef.current.length > 0) {
                console.log("➡️ User logged out, saving cart to guest cart.");
                localStorage.setItem('guestCart', JSON.stringify(cartItemsRef.current));
            } else {
                localStorage.removeItem('guestCart');
            }
        } else {
            if (!isLoading) {
                console.log("➡️ No authenticated user, using guest cart.");
                const localCart = localStorage.getItem('guestCart');
                setCartItems(localCart ? JSON.parse(localCart) : []);
            }
        }
    }, [isAuthenticated, user?.id, isLoading, loadCartForUser, mergeCarts, saveCartForUser]); // Rerun when auth state or loading status changes

    // This function will be called explicitly on logout to ensure cart is saved.
    const persistCartOnLogout = () => {
        return new Promise((resolve) => {
            if (cartItemsRef.current.length > 0) {
                console.log("➡️ Persisting cart to localStorage on logout.");
                localStorage.setItem('guestCart', JSON.stringify(cartItemsRef.current));
            }
            resolve();
        });
    };

    return (
        <CartContext.Provider
            value={{
                getId,
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity, // ✅ UPDATED: Expose updateQuantity
                saveCartForUser,
                persistCartOnLogout, // Expose the new function
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