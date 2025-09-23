// src/pages/main/CheckoutPage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import { useCart } from "../../context/CartContext.jsx";
import { useUser } from "../../context/useUser.js";

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        cartItems,
        updateQuantity,
        removeFromCart,
        region,
        city,
        shippingFee,
        clearCart
    } = useCart();
    
    const { user, isAuthenticated } = useUser?.() || { user: null, isAuthenticated: false };
    const toastShown = useRef(false);

    const singleProduct = location.state?.product;

    const checkoutItems = singleProduct ? [singleProduct] : cartItems;

    // This useEffect will still display a toast if the cart is empty,
    // which is a good user experience practice.
    useEffect(() => {
        if (!checkoutItems.length && !toastShown.current) {
            toastShown.current = true;
            navigate("/shop");
        }
    }, [checkoutItems, navigate]);

    const subtotal = checkoutItems.reduce(
        (sum, item) => sum + (item.price * (item.qty || 1)),
        0
    );
    const totalCost = subtotal + (singleProduct ? singleProduct.shippingFee : shippingFee);

    const handlePlaceOrder = async () => {
        if (!isAuthenticated) {
            navigate("/login", {
                state: { from: "checkout" },
            });
            return;
        }

        try {
            const orderData = {
                userId: user?.id,
                username: user?.username,
                products: checkoutItems.map(item => ({
                    productId: item._id || item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.qty || 1,
                    variation: item.variation,
                })),
                region: region, 
                city: city,
                shippingFee: shippingFee,
                total: totalCost,
            };

            const res = await fetch("http://localhost:5001/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            const data = await res.json();

            if (data.success) {
                // Clear the cart after a successful order
                clearCart(); 
                navigate("/shop");
            } else {
                console.error("Failed to place order:", data.message);
            }
        } catch (err) {
            console.error("Server error:", err.message);
        }
    };
    
    const handleDecreaseQuantity = async (item) => {
        const newQty = (item.qty || 1) - 1;
        if (newQty > 0) {
            await updateQuantity(item._id || item.id, newQty);
        } else {
            await removeFromCart(item._id || item.id);
        }
    };

    const handleIncreaseQuantity = async (item) => {
        const newQty = (item.qty || 1) + 1;
        await updateQuantity(item._id || item.id, newQty);
    };

    const handleRemoveItem = async (item) => {
        await removeFromCart(item._id || item.id);
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
                            <p className="text-sm text-gray-600">Region: {singleProduct ? singleProduct.region : region}</p>
                            <p className="text-sm text-gray-600">City: {singleProduct ? singleProduct.city : city}</p>
                            <p className="text-sm text-gray-600">
                                Shipping Fee: {currencyFormatter.format(singleProduct ? singleProduct.shippingFee : shippingFee)}
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
                                <span>{currencyFormatter.format(singleProduct ? singleProduct.shippingFee : shippingFee)}</span>
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
