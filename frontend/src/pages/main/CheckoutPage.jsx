// src/pages/main/CheckoutPage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ShoppingBag, ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";

// Merged: Keep both context imports for cart and user
import { useCart } from "../../context/CartContext.jsx";
import { useUser } from "../../context/useUser";
import "react-toastify/dist/ReactToastify.css";

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Merged: Combine the destructuring from both branches to get all needed cart functions
  const { cartItems, addToCart, updateQuantity, removeFromCart, clearCart } =
    useCart();
  // Merged: Use `isAuthenticated` from the `useUser` context, which is the more robust approach
  const { isAuthenticated } = useUser?.() || { isAuthenticated: false };
  const toastShown = useRef(false);

  // Optional: single product passed from Buy Now
  const product = location.state?.product;
  const region = location.state?.region;
  const city = location.state?.city;
  const shippingFee = location.state?.shippingFee ?? 0;
  const variation = location.state?.variation || "Default";

  // Check user login & redirect if no product (for single buy)
  useEffect(() => {
    // Merged: Combine the conditions to handle both empty cart and no product
    if (!cartItems.length && !product && !toastShown.current) {
      toastShown.current = true;
      toast.error("Please select a product to checkout.");
      navigate("/shop");
    }
  }, [cartItems, product, navigate]);

  const handlePlaceOrder = async () => {
  if (!isAuthenticated) { // ✅ Fixed isLoggedIn to isAuthenticated
    toast.info("Please login to complete your purchase");
    navigate("/login", {
      state: { from: "checkout", product, region, city, shippingFee, variation },
    });
    return;
  }

  try {
    const orderData = {
      userId: JSON.parse(localStorage.getItem("user"))?.id || "guest",
      products: [
        {
          productId: product._id || product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          variation,
        },
      ],
      region,
      city,
      shippingFee,
      total: product.price + shippingFee,
    };

    const res = await fetch("http://localhost:5001/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();

    if (data.success) {
      toast.success("✅ Order placed successfully!");
      navigate("/shop");
    } else {
      toast.error("❌ Failed to place order");
    }
  } catch (err) {
    toast.error("⚠️ Server error: " + err.message);
  }
};


  const handleAddToCart = (productToAdd) => {
    // Merged: Use `isAuthenticated` to check login status
    if (!isAuthenticated) {
      toast.info("Please login to add items to your cart");
      navigate("/login", {
        state: { from: "shop" },
      });
      return;
    }

    const productWithId = {
      ...productToAdd,
      id: productToAdd._id || productToAdd.id,
      variation,
    };

    addToCart(productWithId, 1);
    toast.success(`🛒 ${productToAdd.name} (${variation}) added to cart!`);
  };

  // If a single product exists, treat it as Buy Now
  const checkoutItems = product ? [product] : cartItems;

  // Calculate totals
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * (item.qty || 1),
    0
  );
  const totalCost = subtotal + (product ? shippingFee : 0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 md:p-12">
      <div className="w-full max-w-5xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200/70 dark:border-gray-700/70 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h2>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Merged: Use the UI that supports both a single product and multiple cart items */}
          <div className="p-6 md:w-1/2 border-r space-y-4">
            {checkoutItems.map((item) => (
              <div
                key={item._id || item.id}
                className="flex items-center justify-between border p-4 rounded-lg"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-contain rounded"
                />
                <div className="flex-1 mx-4">
                  <p className="font-medium">{item.name}</p>
                  {item.variation && (
                    <p className="text-sm text-gray-500">Variation: {item.variation}</p>
                  )}
                  {/* ✅ Corrected: Display price * quantity */}
                  <p className="text-gray-700 mt-1">
                    ₱{(item.price * (item.qty || 1)).toLocaleString()}
                  </p>
                </div>
                {product ? null : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item._id || item.id, (item.qty || 1) - 1)
                      }
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span>{item.qty || 1}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item._id || item.id, (item.qty || 1) + 1)
                      }
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item._id || item.id)}
                      className="ml-2 text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Merged: Keep the 'Add to Cart' button for the 'Buy Now' product */}
            {product && !cartItems.includes(product) && (
              <button
                onClick={() => handleAddToCart(product)}
                className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
              >
                <ShoppingCart className="inline mr-2" /> Add to Cart
              </button>
            )}
          </div>

          {/* Order summary */}
          <div className="p-6 md:w-1/2 space-y-4">
            <div>
              <h4 className="text-gray-700 font-medium">Shipping Info</h4>
              {product && (
                <>
                  <p className="text-sm text-gray-600">Region: {region}</p>
                  <p className="text-sm text-gray-600">City: {city}</p>
                  <p className="text-sm text-gray-600">
                    Shipping Fee: ₱{shippingFee}
                  </p>
                </>
              )}
            </div>

            <div className="mt-4 border-t pt-4">
              <h4 className="text-gray-700 font-medium mb-2">Order Summary</h4>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₱{subtotal.toLocaleString()}</span>
              </div>
              {product && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping Fee</span>
                  <span>₱{shippingFee.toLocaleString?.() || shippingFee}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg mt-2 text-gray-900">
                <span>Total</span>
                <span>₱{totalCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {/* Merged: Keep the 'Add to Cart' button logic from `nookie-b` and `Integration-A-B`
              The logic for `handleAddToCart` is already combined above, so this button will work. */}
              {product && (
                <button
                  onClick={() => handleAddToCart(product)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-700 py-3 rounded-xl text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" /> Add to Cart
                </button>
              )}
              <button
                onClick={handlePlaceOrder}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-pink-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-pink-700 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" /> Place Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}