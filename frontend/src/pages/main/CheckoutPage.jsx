// src/pages/main/CheckoutPage.jsx (UPDATED - added proof of payment image uploader)
import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, Loader2, MapPin, Package, CreditCard, Shield, Truck, Clock, Upload, X, Camera } from "lucide-react";
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
    
    // ✅ NEW: Payment proof state
    const [paymentProof, setPaymentProof] = useState(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState(null);

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

    // Handle change address navigation
    const handleChangeAddress = () => {
        navigate("/settings", { 
            state: { 
                activeTab: "addresses",
                returnTo: location.pathname,
                returnState: location.state
            } 
        });
    };

    // ✅ NEW: Handle payment proof image upload
    const handlePaymentProofUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file (PNG, JPG, JPEG)");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        setPaymentProof(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPaymentProofPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        toast.success("Payment proof uploaded successfully!");
    };

    // ✅ NEW: Remove payment proof
    const handleRemovePaymentProof = () => {
        setPaymentProof(null);
        setPaymentProofPreview(null);
        // Reset the file input
        const fileInput = document.getElementById('payment-proof-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    };

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

        // ✅ NEW: Validate payment proof
        if (!paymentProof) {
            toast.error("Please upload proof of payment before placing your order.");
            return;
        }

        setIsPlacingOrder(true);

        try {
            // ✅ NEW: Create FormData to handle file upload
            const formData = new FormData();
            
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

            // Add order data to FormData
            formData.append('orderData', JSON.stringify(orderData));
            
            // Add payment proof image
            formData.append('paymentProof', paymentProof);

            const response = await fetch("http://localhost:5001/api/orders", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                    // Don't set Content-Type, let browser set it for FormData
                },
                body: formData,
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

    // ✅ NEW: Check if order can be placed
    const canPlaceOrder = paymentProof && !isPlacingOrder;

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
                                            <p className="text-gray-500 dark:text-gray-400 mb-2">No shipping address available</p>
                                            <button
                                                onClick={handleChangeAddress}
                                                className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium text-sm underline"
                                            >
                                                Add Address
                                            </button>
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
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleChangeAddress}
                                                className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium text-sm ml-4 shrink-0 underline"
                                            >
                                                Change Address
                                            </button>
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

                        {/* ✅ NEW: Payment Proof Upload Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-100 dark:border-red-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                        <Camera className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            Proof of Payment <span className="text-red-500">*</span>
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Upload a screenshot of your GCash payment</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {!paymentProofPreview ? (
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                                        <input
                                            id="payment-proof-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePaymentProofUpload}
                                            className="hidden"
                                        />
                                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                            Upload Payment Proof
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            Take a screenshot of your GCash payment confirmation and upload it here
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('payment-proof-upload').click()}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                                        >
                                            <Camera className="w-4 h-4" />
                                            Choose Image
                                        </button>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                            PNG, JPG or JPEG (max 5MB)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                                            <div className="flex items-start gap-4">
                                                <img
                                                    src={paymentProofPreview}
                                                    alt="Payment proof"
                                                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        Payment Proof Uploaded
                                                    </h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {paymentProof?.name}
                                                    </p>
                                                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                                                        <Shield className="w-3 h-3" />
                                                        Ready to place order
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={handleRemovePaymentProof}
                                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Remove payment proof"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
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

                            {/* ✅ UPDATED: Place Order Button - only enabled when payment proof is uploaded */}
                            <button
                                disabled={!canPlaceOrder}
                                onClick={handlePlaceOrder}
                                className={`w-full py-4 font-bold text-lg rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                                    canPlaceOrder
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl text-white'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {isPlacingOrder ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Placing Order...
                                    </>
                                ) : !paymentProof ? (
                                    <>
                                        <Camera className="w-6 h-6" />
                                        Upload Payment Proof First
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-6 h-6" />
                                        Place Order • {currencyFormatter.format(totalCost)}
                                    </>
                                )}
                            </button>

                            {/* ✅ NEW: Payment proof status message */}
                            {!paymentProof && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
                                    <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">
                                        Please upload your payment proof to continue
                                    </p>
                                </div>
                            )}

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