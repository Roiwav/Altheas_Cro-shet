// src/pages/main/CheckoutPage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { toast } from "react-toastify";

import { useCart } from "../../context/CartContext.jsx";
import { useUser } from "../../context/useUser.js";
import { shippingFees } from "../../data/shippingData.js";

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        cartItems,
        getId, // Import the getId helper function
        updateQuantity,
        removeFromCart,
        shippingAddress,
        shippingFee,
        clearCart
    } = useCart();
    
    const { user, isAuthenticated, token, isLoading } = useUser?.() || { user: null, isAuthenticated: false, token: null, isLoading: true };
    const toastShown = useRef(false);

    // New state to track selected items for checkout
    const [selectedItems, setSelectedItems] = useState([]);

    const singleProduct = location.state?.product;

    // This useEffect handles redirecting unauthenticated users.
    useEffect(() => {
        // Wait until the authentication status is confirmed and use a ref to ensure
        // the toast and redirect only happen once.
        if (!isLoading && !isAuthenticated && !toastShown.current) {
            // Mark that we've shown the toast to prevent it from showing again on re-renders.
            toastShown.current = true;
            toast.info("You must be logged in to proceed to checkout.");
            // Redirect to login, and pass the current location to come back after login.
            navigate("/login", { state: { from: location.pathname } });
        }
    }, [isLoading, isAuthenticated, navigate, location]);

    const checkoutItems = singleProduct ? [singleProduct] : cartItems; // Items to display

    // Initialize selected items when the component loads
    useEffect(() => {
        setSelectedItems(checkoutItems);
    }, [cartItems, singleProduct]);

    // Items to actually process in the order
    const itemsToOrder = singleProduct ? [singleProduct] : selectedItems;

    // This useEffect will still display a toast if the cart is empty,
    // which is a good user experience practice.
    useEffect(() => {
        if (!checkoutItems.length && !toastShown.current) {
            toastShown.current = true;
            navigate("/shop");
        }
    }, [checkoutItems, navigate]);

    const subtotal = itemsToOrder.reduce(
        (sum, item) => sum + (item.price * (item.qty || 1)),
        0
    );

    // Determine the correct shipping address and fee
    const finalShippingAddress = singleProduct 
        ? singleProduct.shippingAddress 
        : (user?.addresses?.find(a => a.isDefault) || shippingAddress);

    const finalShippingFee = singleProduct 
        ? singleProduct.shippingFee 
        : (shippingFees[finalShippingAddress?.city] || 0);

    const totalCost = subtotal + finalShippingFee;

    const handlePlaceOrder = async () => {
        if (!isAuthenticated) {
            navigate("/login", {
                state: { from: "checkout" },
            });
            return;
        }

        try {
            // Create an array of promises, one for each order to be placed.
            const orderPromises = itemsToOrder.map(item => {
                const itemTotal = item.price * (item.qty || 1);
                // Apply the shipping fee to each individual order.
                const orderTotal = itemTotal + finalShippingFee;

                const orderData = {
                    userId: user?.id,
                    username: user?.username,
                    products: [{ // The products array now contains only one item
                        productId: item._id || item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.qty || 1,
                        image: item.image,
                        variation: item.variation,
                    }],
                    shippingAddress: finalShippingAddress,
                    shippingFee: finalShippingFee,
                    total: orderTotal,
                };

                return fetch("http://localhost:5001/api/orders", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(orderData),
                });
            });

            // Wait for all orders to be placed.
            const responses = await Promise.all(orderPromises);

            // Check if all responses were successful.
            const allSuccessful = responses.every(res => res.ok);

            if (allSuccessful) {
                // If it wasn't a "Buy Now" single product, clear the main cart.
                if (!singleProduct) {
                    clearCart(); 
                }
                toast.success("Your order(s) have been placed successfully!");
                navigate("/orders"); // Navigate to orders page to see the new orders
            } else {
                // Find the first failed response to show an error.
                const failedResponses = await Promise.all(responses.filter(res => !res.ok).map(res => res.json()));
                const errorMessage = failedResponses[0]?.message || "One or more items could not be ordered.";
                console.error("Failed to place order(s):", errorMessage);
                toast.error(errorMessage);
            }
        } catch (err) {
            console.error("Server error:", err);
            toast.error("An unexpected server error occurred. Please try again.");
        }
    };
    
    const handleDecreaseQuantity = async (item) => {
        const newQty = (item.qty || 1) - 1;
        if (newQty > 0) {
            await updateQuantity(getId(item), newQty);
        } else {
            await removeFromCart(getId(item));
        }
    };

    const handleIncreaseQuantity = async (item) => {
        const newQty = (item.qty || 1) + 1;
        await updateQuantity(getId(item), newQty);
    };

    const handleRemoveItem = async (item) => {
        await removeFromCart(getId(item));
    };

    const handleSelectItem = (item) => {
        setSelectedItems(prev => {
            const itemId = getId(item);
            if (prev.some(selected => getId(selected) === itemId)) {
                return prev.filter(selected => getId(selected) !== itemId);
            } else {
                return [...prev, item];
            }
        });
    };

    const currencyFormatter = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 md:p-12">
            <div className="w-full max-w-5xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
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
                    <div className="p-6 md:w-1/2 border-r space-y-4">
                        {checkoutItems.map((item) => (
                            <div
                                key={item._id || item.id}
                                className={`flex items-center justify-between border p-4 rounded-lg transition-all ${itemsToOrder.some(i => getId(i) === getId(item)) ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700' : 'bg-white/50 dark:bg-gray-800/50'}`}
                            >
                                {!singleProduct && (
                                    <input
                                        type="checkbox"
                                        checked={itemsToOrder.some(i => getId(i) === getId(item))}
                                        onChange={() => handleSelectItem(item)}
                                        className="mr-4 h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                    />
                                )}
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 object-contain rounded"
                                />
                                <div className="flex-1 mx-4">
                                    <p className="font-medium">{item.name}</p>
                                    {item.variation && (
                                        <p className="text-sm text-gray-500">Variation: {item.variation}</p>
                                    )}
                                    <p className="text-gray-700 mt-1">
                                        {currencyFormatter.format(item.price)}
                                    </p>
                                </div>
                                {!singleProduct && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDecreaseQuantity(item)}
                                            className="px-2 py-1 bg-gray-200 rounded"
                                        >
                                            -
                                        </button>
                                        <span>{item.qty || 1}</span>
                                        <button
                                            onClick={() => handleIncreaseQuantity(item)}
                                            className="px-2 py-1 bg-gray-200 rounded"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => handleRemoveItem(item)}
                                            className="ml-2 text-red-500 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-6 md:w-1/2 space-y-4">
                        <div>
                            <h4 className="text-gray-700 font-medium">Shipping Info</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {(() => {
                                    const addr = finalShippingAddress;
                                    if (!addr) return <p>No shipping address selected.</p>;
                                    const addressParts = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
                                    return <p>{addressParts.join(', ')}</p>;
                                })()}
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                Shipping Fee: {currencyFormatter.format(finalShippingFee)}
                            </p>
                        </div>

                        <div className="mt-4 border-t pt-4">
                            <h4 className="text-gray-700 font-medium mb-2">Order Summary</h4>
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{currencyFormatter.format(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping Fee</span>
                                <span>{currencyFormatter.format(finalShippingFee)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg mt-2 text-gray-900">
                                <span>Total</span>
                                <span>{currencyFormatter.format(totalCost)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
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
