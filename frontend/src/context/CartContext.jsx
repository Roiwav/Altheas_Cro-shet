// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useUser } from "./useUser";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { user, isAuthenticated } = useUser?.() || { user: null, isAuthenticated: false };

    console.log("🧑‍💻 CartContext user:", user, "isAuthenticated:", isAuthenticated);

    const [cartItems, setCartItems] = useState(() => {
        try {
            const stored = localStorage.getItem("cart");
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [region, setRegion] = useState("");
    const [city, setCity] = useState("");
    const [shippingFee, setShippingFee] = useState(0);

    const prevUserRef = useRef(null);
    const API_BASE = "http://localhost:5001/api/v1/cart";

    const getId = (product) => product?.id || product?.id || product?.productId;

    // Save cart to backend (upsert)
    const saveCartForUser = async (userId, items) => {
        console.log("➡️ Attempting to save cart to backend for user:", userId);
        console.log("➡️ Items to be saved:", items);
        if (!userId) {
            console.error("❌ Aborting save: userId is not available.");
            return null;
        }
        try {
            const res = await fetch(`${API_BASE}/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username: user?.username,
                    items,
                    region,
                    city,
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
    };

    // Load cart from backend
    const loadCartForUser = async (userId) => {
        console.log("➡️ Attempting to load cart for user:", userId);
        if (!userId) return { items: [] };
        try {
            const res = await fetch(`${API_BASE}/${userId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.log("✅ Cart loaded from backend:", data);
            
            setRegion(data.region || "");
            setCity(data.city || "");
            setShippingFee(data.shippingFee || 0);

            return data;
        } catch (err) {
            console.error("❌ Failed loading cart:", err);
            return { items: [] };
        }
    };

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
        
        console.log(`🛍️ addToCart called for product ID: ${id}`);
        const newCart = cartItems.find((p) => getId(p) === id)
            ? cartItems.map((p) => (getId(p) === id ? { ...p, qty: (p.qty || 0) + quantity } : p))
            : [...cartItems, { ...product, qty: quantity }];

        if (isAuthenticated && user?.id) {
            console.log("🔐 User is authenticated, attempting to save to backend...");
            try {
                await saveCartForUser(user.id, newCart);
                setCartItems(newCart);
                console.log("✔️ Local state updated after successful backend save.");
            } catch (err) {
                console.error("❌ Failed to add item to cart due to backend error:", err);
            }
        } else {
            console.log("👤 User is not authenticated, updating local state only.");
            setCartItems(newCart);
        }
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
                await saveCartForUser(user.id, newCart);
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
                await saveCartForUser(user.id, newCart);
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
                await saveCartForUser(user.id, []);
                setCartItems([]);
                localStorage.removeItem("cart");
            } catch (err) {
                console.error("❌ Failed to clear cart:", err);
            }
        } else {
            setCartItems([]);
            localStorage.removeItem("cart");
        }
    };  

    const totalQuantity = cartItems.reduce((sum, it) => sum + (it.qty || 0), 0);
    const totalPrice = cartItems.reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0);

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        const prevId = prevUserRef.current?.id;
        const currId = user?.id;

        if (!prevId && currId) {
            console.log(`➡️ User logged in (${currId}), merging carts...`);
            (async () => {
                const serverCart = await loadCartForUser(currId);
                const merged = mergeCarts(serverCart.items || [], cartItems);
                try {
                    await saveCartForUser(currId, merged);
                    setCartItems(merged);
                    console.log("✔️ Merged cart updated successfully.");
                } catch (err) {
                    console.error("❌ Failed to merge and save cart:", err);
                }
            })();
        }

        prevUserRef.current = user;
    }, [user]);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity, // ✅ UPDATED: Expose updateQuantity
                clearCart,
                totalQuantity,
                totalPrice,
                region,
                setRegion,
                city,
                setCity,
                shippingFee,
                setShippingFee,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};