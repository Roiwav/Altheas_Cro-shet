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
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
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

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left Column - Shipping Address */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Shipping Address Card */}
                        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                            <div className="px-6 py-4 border-b border-orange-100 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/30">
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
                                        <div className="py-8 text-center">
                                            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                            <p className="mb-2 text-gray-500 dark:text-gray-400">No shipping address available</p>
                                            <button
                                                onClick={handleChangeAddress}
                                                className="text-sm font-medium text-orange-600 underline hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                                            >
                                                Add Address
                                            </button>
                                        </div>
                                    );
                                    const addressParts = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
                                    return (
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">{addressParts.join(', ')}</p>
                                                <div className="flex items-center gap-4 mt-3 text-sm">
                                                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                        <Truck className="w-4 h-4" />
                                                        <span>Shipping: {currencyFormatter.format(shippingFee)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleChangeAddress}
                                                className="ml-4 text-sm font-medium text-orange-600 underline hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 shrink-0"
                                            >
                                                Change Address
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                            <div className="px-6 py-4 border-b border-blue-100 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
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
                                                    className="object-cover w-16 h-16 border border-gray-200 rounded-lg dark:border-gray-600"
                                                />
                                                <div className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full -top-2 -right-2">
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
                        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                            <div className="px-6 py-4 border-b border-red-100 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/30">
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
                                    <div className="p-8 text-center transition-colors border-2 border-gray-300 border-dashed dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500">
                                        <input
                                            id="payment-proof-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePaymentProofUpload}
                                            className="hidden"
                                        />
                                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                                            Upload Payment Proof
                                        </h4>
                                        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                                            Take a screenshot of your GCash payment confirmation and upload it here
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('payment-proof-upload').click()}
                                            className="inline-flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-700"
                                        >
                                            <Camera className="w-4 h-4" />
                                            Choose Image
                                        </button>
                                        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                            PNG, JPG or JPEG (max 5MB)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
                                            <div className="flex items-start gap-4">
                                                <img
                                                    src={paymentProofPreview}
                                                    alt="Payment proof"
                                                    className="object-cover w-24 h-24 border border-gray-200 rounded-lg dark:border-gray-600"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        Payment Proof Uploaded
                                                    </h4>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        {paymentProof?.name}
                                                    </p>
                                                    <p className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
                                                        <Shield className="w-3 h-3" />
                                                        Ready to place order
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={handleRemovePaymentProof}
                                                    className="p-1 text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
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
                        <div className="sticky space-y-6 top-24">
                            {/* Order Summary */}
                            <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                                <div className="px-6 py-4 border-b border-green-100 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
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
                            <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                                <div className="px-6 py-4 border-b border-purple-100 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                                            <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Payment Method</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <label className="flex items-center p-4 transition-colors border-2 border-orange-300 cursor-pointer rounded-xl dark:border-orange-500 bg-orange-50 dark:bg-orange-900/10 hover:border-orange-400 dark:hover:border-orange-400">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="GCash"
                                            checked={paymentMethod === 'GCash'}
                                            onChange={() => setPaymentMethod('GCash')}
                                            className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500"
                                        />
                                        <img src={gcashIcon} alt="GCash" className="w-auto h-8 ml-4" />
                                        <div className="flex-1 ml-3">
                                            <p className="font-medium text-gray-900 dark:text-white">GCash</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Fast and secure mobile payment</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* ✅ UPDATED: Place Order Button - only enabled when payment proof is uploaded */}
                            <button
                                disabled={!canPlaceOrder}
                                onClick={handlePlaceOrder}                                className={`w-full py-3 sm:py-4 font-bold text-base sm:text-lg rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 ${
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
                                        <span className="hidden sm:inline">Upload Payment Proof First</span>
                                        <span className="sm:hidden">Upload Proof</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-6 h-6" />
                                        <span className="hidden sm:inline">Place Order • {currencyFormatter.format(totalCost)}</span>
                                        <span className="sm:hidden">Place Order</span>
                                    </>
                                )}
                            </button>

                            {/* ✅ NEW: Payment proof status message */}
                            {!paymentProof && (
                                <div className="p-3 text-center border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                        Please upload your payment proof to continue
                                    </p>
                                </div>
                            )}

                            {/* Security Badge */}
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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