// src/pages/main/CheckoutPage.jsx (NEW - handles payment & order placement)
import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, Loader2, MapPin, Package, CreditCard, Shield, Truck, Clock } from "lucide-react";
import { toast } from "react-toastify";

import gcashIcon from '../../assets/images/icons/gcash.png';
import { SettingsContext } from "../../context/SettingsContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useUser } from "../../context/useUser.js";

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const { removeFromCart, getId } = useCart();
    const { user, isAuthenticated, token } = useUser();
    const { settings } = React.useContext(SettingsContext);

    // Get data from navigation state (from CartPage or ShopPage)
    const singleProduct = location.state?.product;
    const cartItems = location.state?.cartItems || [];
    const fromCart = location.state?.fromCart || false;
    const passedShippingAddress = location.state?.shippingAddress;
    const passedShippingFee = location.state?.shippingFee || 0;

    const [paymentMethod, setPaymentMethod] = useState('GCash');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // Determine items to checkout
    const checkoutItems = singleProduct ? [singleProduct] : cartItems;

    // Redirect if no items
    useEffect(() => {
        if (checkoutItems.length === 0) {
            toast.error("No items to checkout");
            navigate("/cart");
        }
    }, [checkoutItems.length, navigate]);

    // Calculate totals
    const subtotal = checkoutItems.reduce(
        (sum, item) => sum + (item.price * (item.quantity || 1)),
        0
    );

    const shippingFee = singleProduct ? singleProduct.shippingFee : passedShippingFee;
    const totalCost = subtotal + shippingFee;

    const handlePlaceOrder = async () => {
        if (!isAuthenticated) {
            toast.info("You need to sign up first before placing an order.");
            navigate("/login", {
                state: { from: "checkout" },
            });
            return;
        }

        if (checkoutItems.length === 0) {
            toast.error("No items to order.");
            return;
        }

        setIsPlacingOrder(true);

        try {
            const orderData = {
                userId: user?.id,
                username: user?.username,
                products: checkoutItems.map((item) => {
                    const id = item.productId || item._id || item.id;
                    if (!id) {
                        console.error('Item is missing productId and _id:', item);
                    }
                    return {
                        productId: id || 'Custom-Flower',
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity || 1,
                        image: item.image,
                        color: item.color,
                        variation: item.variation
                    };
                }),
                shippingAddress: singleProduct ? singleProduct.shippingAddress : passedShippingAddress,
                shippingFee: shippingFee,
                total: totalCost,
                paymentMethod: paymentMethod
            };

            const response = await fetch("http://localhost:5001/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(orderData),
            });

            if (response.ok) {
                // If items came from cart, remove them
                if (fromCart && !singleProduct) {
                    for (const item of checkoutItems) {
                        await removeFromCart(getId(item));
                    }
                }
                toast.success("Your order has been placed successfully!");
                navigate("/orders");
            } else {
                let errorMessage = "The order could not be placed.";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) { /* Ignore JSON parsing errors */ }
                toast.error(errorMessage);
            }
        } catch (err) {
            console.error("Failed to place order:", err);
            toast.error(err.message || "An unexpected server error occurred. Please try again.");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const currencyFormatter = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    });

    if (checkoutItems.length === 0) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-10 md:ml-[var(--sidebar-width,5rem)] transition-all duration-300 ease-in-out">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Complete your purchase</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Secure</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Shipping Address */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Shipping Address Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-orange-50 dark:bg-orange-900/20 px-6 py-4 border-b border-orange-100 dark:border-orange-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                        <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Delivery Address</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Where should we deliver your order?</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {(() => {
                                    const addr = singleProduct ? singleProduct.shippingAddress : passedShippingAddress;
                                    if (!addr) return (
                                        <div className="text-center py-8">
                                            <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                            <p className="text-gray-500 dark:text-gray-400">No shipping address available</p>
                                        </div>
                                    );
                                    const addressParts = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
                                    return (
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-gray-900 dark:text-white font-medium">{addressParts.join(', ')}</p>
                                                <div className="flex items-center gap-4 mt-3 text-sm">
                                                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                        <Truck className="w-4 h-4" />
                                                        <span>Shipping: {currencyFormatter.format(shippingFee)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                        <Clock className="w-4 h-4" />
                                                        <span>2-3 days delivery</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Order Items</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{checkoutItems.length} item(s) to be ordered</p>
                                    </div>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {checkoutItems.map((item, index) => (
                                    <div key={index} className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="relative">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                                />
                                                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                                    {item.quantity || 1}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                                                {item.color && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Color: {item.color}</p>
                                                )}
                                                {item.variation && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Variation: {item.variation}</p>
                                                )}
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                                        {currencyFormatter.format(item.price)}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        Qty: {item.quantity || 1}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Summary & Payment */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Order Summary */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-100 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                            <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Order Summary</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{checkoutItems.length} item(s)</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Subtotal ({checkoutItems.length} items)</span>
                                        <span>{currencyFormatter.format(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Shipping Fee</span>
                                        <span>{currencyFormatter.format(shippingFee)}</span>
                                    </div>
                                    <hr className="border-gray-200 dark:border-gray-700" />
                                    <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                                        <span>Total</span>
                                        <span className="text-green-600 dark:text-green-400">{currencyFormatter.format(totalCost)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="bg-purple-50 dark:bg-purple-900/20 px-6 py-4 border-b border-purple-100 dark:border-purple-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                            <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Payment Method</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred payment</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors border-orange-300 dark:border-orange-500 bg-orange-50 dark:bg-orange-900/10 hover:border-orange-400 dark:hover:border-orange-400">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="GCash"
                                            checked={paymentMethod === 'GCash'}
                                            onChange={() => setPaymentMethod('GCash')}
                                            className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500"
                                        />
                                        <img src={gcashIcon} alt="GCash" className="w-auto h-8 ml-4" />
                                        <div className="ml-3 flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">GCash</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Fast and secure mobile payment</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Place Order Button */}
                            <button
                                disabled={isPlacingOrder}
                                onClick={handlePlaceOrder}
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {isPlacingOrder ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Placing Order...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-6 h-6" />
                                        Place Order • {currencyFormatter.format(totalCost)}
                                    </>
                                )}
                            </button>

                            {/* Security Badge */}
                            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span>Your payment information is secure and encrypted</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}