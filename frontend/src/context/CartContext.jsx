// src/context/CartContext.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "./useUser";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie';
import { CartContext } from "./cart-context";
import { GUEST_CART_ID_COOKIE } from "../utils/constants";

export const CartProvider = ({ children }) => {
    const { user, token, isAuthenticated, isLoading: _isUserLoading } = useUser?.() || { 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isLoading: true 
    };

    console.log("🧑‍💻 CartContext user:", user, "isAuthenticated:", isAuthenticated);

    const [cartItems, setCartItems] = useState([]);
    const [shippingAddress, setShippingAddress] = useState(null);
    const [shippingFee, setShippingFee] = useState(0);
    const [isCartLoading, setIsCartLoading] = useState(true);

    const API_BASE = "http://localhost:5001/api/v1";

    // Improved getId function to handle variations consistently
    const getId = useCallback((product) => {
        const baseId = product.productId || product._id || product.id;
        const variation = product.variation || "";
        
        return `${baseId}${variation ? `-${variation}` : ""}`;
    }, []);

    // ✅ FIXED: Use localStorage as primary storage, backend as backup
    const saveCart = useCallback(async (items, currentShippingAddress, currentShippingFee) => {
        setIsCartLoading(true);
        const userId = user?.id;

        console.log("💾 Saving cart:", { 
            itemCount: items.length, 
            userId: userId ? `${userId.substring(0,8)}...` : null,
            isAuthenticated 
        });

        // ✅ PRIMARY: Always save to localStorage (works for both guest and authenticated users)
        const cartData = {
            items,
            shippingAddress: currentShippingAddress,
            shippingFee: currentShippingFee,
            timestamp: Date.now(),
            userId: userId || null // Track which user this belongs to
        };

        if (isAuthenticated && userId) {
            // Save to user-specific localStorage key
            localStorage.setItem(`user-cart-${userId}`, JSON.stringify(cartData));
            console.log("✅ Cart saved to user localStorage");
        } else {
            // Save to guest localStorage key
            localStorage.setItem('guest-cart', JSON.stringify(cartData));
            console.log("✅ Cart saved to guest localStorage");
        }

        // Update React state
        setCartItems(items);
        setShippingAddress(currentShippingAddress || null);
        setShippingFee(currentShippingFee || 0);

        // ✅ SECONDARY: Try to backup to backend if endpoints exist (optional)
        if (isAuthenticated && userId && token) {
            try {
                const url = `${API_BASE}/cart?userId=${userId}`;
                const requestBody = {
                    username: user?.username,
                    items,
                    shippingAddress: currentShippingAddress,
                    shippingFee: currentShippingFee
                };

                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(requestBody),
                });

                if (res.ok) {
                    console.log("✅ Cart also backed up to backend");
                } else if (res.status === 404) {
                    console.log("ℹ️ Backend cart endpoints not implemented yet - using localStorage only");
                } else {
                    console.warn("⚠️ Backend cart save failed:", res.status);
                }
            } catch (err) {
                console.log("ℹ️ Backend cart save skipped:", err.message);
            }
        }

        setIsCartLoading(false);
        return cartData;
    }, [user, token, isAuthenticated]);

    // ✅ FIXED: Load cart from localStorage, try backend as fallback
    const loadCart = useCallback(async () => {
        setIsCartLoading(true);
        const userId = user?.id;

        console.log("📂 Loading cart:", { 
            userId: userId ? `${userId.substring(0,8)}...` : null,
            isAuthenticated 
        });

        let cartData = null;

        // ✅ PRIMARY: Load from localStorage first
        try {
            if (isAuthenticated && userId) {
                // Try user-specific cart first
                const userCartJson = localStorage.getItem(`user-cart-${userId}`);
                if (userCartJson) {
                    cartData = JSON.parse(userCartJson);
                    console.log("📱 Loaded user cart from localStorage:", cartData.items?.length || 0, "items");
                }
            } else {
                // Load guest cart
                const guestCartJson = localStorage.getItem('guest-cart');
                if (guestCartJson) {
                    cartData = JSON.parse(guestCartJson);
                    console.log("📱 Loaded guest cart from localStorage:", cartData.items?.length || 0, "items");
                }
            }
        } catch (e) {
            console.error("Failed to parse cart from localStorage:", e);
        }

        // ✅ SECONDARY: Try backend as fallback (if localStorage failed)
        if (!cartData && isAuthenticated && userId && token) {
            try {
                const url = `${API_BASE}/cart?userId=${userId}`;
                const res = await fetch(url, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    cartData = await res.json();
                    console.log("📱 Loaded cart from backend:", cartData.items?.length || 0, "items");
                    
                    // Save to localStorage for future use
                    localStorage.setItem(`user-cart-${userId}`, JSON.stringify(cartData));
                } else if (res.status === 404) {
                    console.log("ℹ️ Backend cart endpoints not implemented yet");
                } else {
                    console.warn("⚠️ Backend cart load failed:", res.status);
                }
            } catch (err) {
                console.log("ℹ️ Backend cart load skipped:", err.message);
            }
        }

        // Apply loaded cart data or use defaults
        if (cartData) {
            setCartItems(cartData.items || []);
            setShippingAddress(cartData.shippingAddress || null);
            setShippingFee(cartData.shippingFee || 0);
        } else {
            setCartItems([]);
            setShippingAddress(null);
            setShippingFee(0);
        }

        setIsCartLoading(false);
    }, [user, token, isAuthenticated]);

    // ✅ IMPROVED: Manual merge function for localStorage-based carts
    const manualMergeGuestCart = useCallback(async (userId) => {
        console.log("🔄 Starting localStorage cart merge for user:", userId.substring(0,8) + '...');
        
        const guestCartJson = localStorage.getItem('guest-cart');
        const userCartJson = localStorage.getItem(`user-cart-${userId}`);
        
        let guestItems = [];
        let userItems = [];
        let mergedShippingAddress = null;
        let mergedShippingFee = 0;

        // Parse guest cart
        if (guestCartJson) {
            try {
                const guestCart = JSON.parse(guestCartJson);
                guestItems = guestCart.items || [];
                mergedShippingAddress = guestCart.shippingAddress;
                mergedShippingFee = guestCart.shippingFee || 0;
                console.log("👻 Found guest cart:", guestItems.length, "items");
            } catch (e) {
                console.error("Failed to parse guest cart:", e);
            }
        }

        // Parse user cart
        if (userCartJson) {
            try {
                const userCart = JSON.parse(userCartJson);
                userItems = userCart.items || [];
                // Prefer user's shipping info if available
                if (userCart.shippingAddress) {
                    mergedShippingAddress = userCart.shippingAddress;
                    mergedShippingFee = userCart.shippingFee || 0;
                }
                console.log("👤 Found user cart:", userItems.length, "items");
            } catch (e) {
                console.error("Failed to parse user cart:", e);
            }
        }

        if (guestItems.length === 0 && userItems.length === 0) {
            console.log("ℹ️ No cart items to merge");
            return;
        }

        // Merge items (combine quantities for duplicates)
        const mergedItems = [...userItems];

        for (const guestItem of guestItems) {
            const guestItemId = getId(guestItem);
            const existingIndex = mergedItems.findIndex(item => getId(item) === guestItemId);

            if (existingIndex >= 0) {
                // Combine quantities
                mergedItems[existingIndex].quantity = (mergedItems[existingIndex].quantity || 1) + (guestItem.quantity || 1);
                console.log(`🔄 Combined quantities for: ${guestItem.name}`);
            } else {
                // Add new item
                mergedItems.push(guestItem);
                console.log(`➕ Added new item: ${guestItem.name}`);
            }
        }

        // Save merged cart and update state
        await saveCart(mergedItems, mergedShippingAddress, mergedShippingFee);

        // Clean up guest cart
        localStorage.removeItem('guest-cart');
        Cookies.remove(GUEST_CART_ID_COOKIE);

        console.log("✅ Cart merge completed:", mergedItems.length, "total items");
        
        const totalGuestItems = guestItems.length;
        if (totalGuestItems > 0) {
            toast.success(`Your ${totalGuestItems} cart ${totalGuestItems === 1 ? 'item has' : 'items have'} been saved to your account!`);
        }

        return mergedItems;
    }, [getId, saveCart]);

    // ✅ IMPROVED: Merge carts on login
    const mergeCartOnLogin = useCallback(async (userId) => {
        console.log(`🔄 Starting cart merge for user: ${userId.substring(0,8)}...`);
        
        try {
            await manualMergeGuestCart(userId);
        } catch (error) {
            console.error("❌ Cart merge failed:", error);
            // Fallback: just load user's existing cart
            await loadCart();
            toast.info("Welcome back! Loading your cart...");
        }
    }, [manualMergeGuestCart, loadCart]);

    // Enhanced Add item to cart
    const addToCart = useCallback(async (product, quantity = 1) => {
        console.log("🛒 Adding to cart:", product.name, "x", quantity);
        
        const productToAdd = {
            productId: product._id || String(product.id),
            name: product.name,
            price: product.price,
            image: product.image || (product.images && product.images[0]),
            variation: product.variation || "",
            quantity: quantity,
        };

        const id = getId(productToAdd);
        const existingItem = cartItems.find(item => getId(item) === id);

        let newCartItems;
        if (existingItem) {
            newCartItems = cartItems.map(item =>
                getId(item) === id ? { ...item, quantity: item.quantity + quantity } : item
            );
            toast.success(`Updated ${product.name} quantity to ${existingItem.quantity + quantity}!`, {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
            });
        } else {
            newCartItems = [...cartItems, productToAdd];
            toast.success(`${product.name} added to cart!`, {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
            });
        }

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

    const totalQuantity = useMemo(() => 
        cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0), 
        [cartItems]
    );

    const totalPrice = useMemo(
        () => cartItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0),
        [cartItems]
    );

    // Main effect
    // Load cart when user state changes
    useEffect(() => {
        if (!_isUserLoading) {
            if (user && isAuthenticated && token) {
                mergeCartOnLogin(user.id);
            } else {
                console.log("👻 Guest user or logged out, loading guest cart...");
                loadCart();
            }
        }
    }, [isAuthenticated, user, token, _isUserLoading, loadCart, mergeCartOnLogin]);

    const contextValue = useMemo(() => ({
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
    }), [
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
    ]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};