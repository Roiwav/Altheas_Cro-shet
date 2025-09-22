// context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useUser } from "./useUser";

export const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useUser() || {
    user: null,
    isAuthenticated: false,
  };

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

  const getId = (product) => product?.id || product?.productId;

  // Save cart to backend
  const saveCartForUser = async () => {
    const userId = user?.id;
    if (!userId) {
      console.log("Not logged in, skipping backend save.");
      return null;
    }
    try {
      // ✅ Updated mapping to ensure all fields are present and have default values
      const sanitizedItems = cartItems.map(item => {
        const productId = item.productId || item._id || item.id;
        const title = item.title || item.name;
        const price = item.price || 0;
        const image = item.image || "default-image.jpg";
        const qty = item.qty || 1; // ✅ Ensure qty is never 0 or undefined

        return { productId, title, price, image, qty };
      });
      
      const res = await fetch(`${API_BASE}/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: sanitizedItems, region, city, shippingFee }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log("✅ Cart updated on backend:", data);
      return data;
    } catch (err) {
      console.error("❌ Failed saving cart to backend:", err);
    }
  };

  // Load cart from backend
  const loadCartForUser = async (userId) => {
    if (!userId) {
      console.log("Not logged in, skipping backend load.");
      return { items: [] };
    }
    try {
      const res = await fetch(`${API_BASE}/${userId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRegion(data.region || "");
      setCity(data.city || "");
      setShippingFee(data.shippingFee || 0);
      return data;
    } catch (err) {
      console.error("❌ Failed loading cart from backend:", err);
      return { items: [] };
    }
  };

  const mergeCarts = (serverItems = [], localItems = []) => {
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

  const addToCart = (product, quantity = 1) => {
    const id = getId(product);
    if (!id) return;

    const newCart = cartItems.find((p) => getId(p) === id)
      ? cartItems.map((p) =>
          getId(p) === id ? { ...p, qty: (p.qty || 0) + quantity } : p
        )
      : [...cartItems, { ...product, qty: quantity }];

    setCartItems(newCart);
  };
  
  const updateQuantity = (productId, newQty) => {
    const quantity = Math.max(0, newQty); 
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(currentItems => {
        return currentItems.map(item =>
            getId(item) === productId ? { ...item, qty: quantity } : item
        );
    });
};

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter((item) => getId(item) !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  const totalQuantity = cartItems.reduce((sum, it) => sum + (it.qty || 0), 0);
  const totalPrice = cartItems.reduce(
    (sum, it) => sum + (it.qty || 0) * (it.price || 0),
    0
  );

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    if (isAuthenticated) {
      const timeoutId = setTimeout(() => {
        saveCartForUser();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [cartItems, isAuthenticated, user, region, city, shippingFee]);

  useEffect(() => {
    const prevId = prevUserRef.current?.id;
    const currId = user?.id;

    if (!prevId && currId) {
      (async () => {
        console.log(`➡️ User logged in (${currId}), loading and merging carts...`);
        const serverCart = await loadCartForUser(currId);
        const merged = mergeCarts(serverCart.items || [], cartItems);
        setCartItems(merged);
        console.log("✔️ Merged cart updated successfully.");
      })();
    }

    if (prevId && !currId) {
      console.log("➡️ User logged out, clearing local cart.");
      setCartItems([]);
      localStorage.removeItem("cart");
    }

    prevUserRef.current = user;
  }, [user]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
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