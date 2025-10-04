// src/pages/main/CartPage.jsx (UPDATED - cart management only)
import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, Package, CreditCard, Minus, Plus, X, Shield } from "lucide-react";
import { toast } from "react-toastify";

import { SettingsContext } from "../../context/SettingsContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useUser } from "../../context/useUser.js";

export default function CartPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        cartItems,
        getId,
        updateQuantity,
        removeFromCart,
        shippingAddress,
        setShippingAddress,
        shippingFee,
        setShippingFee
    } = useCart();

    const { user, isAuthenticated } = useUser();
    const { settings } = React.useContext(SettingsContext);

    const singleProduct = location.state?.product;
    const arOrder = location.state && !location.state.product ? location.state : null;

    // Shipping fees data
    const shippingFees = {
        "Manila": 25, "Quezon City": 20, "Calamba City": 36, "Batangas City": 30,
        "Baguio": 35, "Dagupan": 32, "Cebu City": 28, "Iloilo City": 30,
        "Davao City": 34, "Cagayan de Oro": 33,
    };

    const [selectedItems, setSelectedItems] = useState(new Set());

    // Use the cartItems from context directly, or the single product if it's a "Buy Now" flow.
    const checkoutItems = singleProduct 
    ? [singleProduct] 
    : arOrder
    ? [{
        name: `${arOrder.arrangement} ${arOrder.flowerType}`,
        price: arOrder.totalPrice, 
        quantity: arOrder.quantity,
        color: `${arOrder.color}`,
        image: "/images/placeholder-flower.png",
        shippingAddress: {
            city: arOrder.shippingSubArea,
            state: arOrder.shippingArea,
            line1: arOrder.streetAddress
        },
        shippingFee: arOrder.shippingFee || 0,
    }]
    : cartItems;

    useEffect(() => {
        if (isAuthenticated) {
            let addresses = user?.addresses || [];

            if (addresses.length === 0) {
                const saved = localStorage.getItem("userAddresses");
                if (saved) {
                    addresses = JSON.parse(saved);
                }
            }

            if (addresses.length > 0) {
                const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
                setShippingAddress(defaultAddress);
                setShippingFee(shippingFees[defaultAddress.city] || 0);
            }
        }
    }, [singleProduct, isAuthenticated, user, setShippingAddress, setShippingFee]);

    // Calculate totals only for selected items
    const selectedCheckoutItems = checkoutItems.filter(item => selectedItems.has(getId(item)));
    
    const subtotal = selectedCheckoutItems.reduce(
        (sum, item) => sum + (item.price * (item.quantity || 1)),
        0
    );
    
    const totalCost = subtotal + 
    (singleProduct 
    ? singleProduct.shippingFee
    : arOrder
    ? (arOrder.shippingFee || 0) 
    : shippingFee);

    const handleSelectItem = (itemId, isSelected) => {
        const newSelectedItems = new Set(selectedItems);
        if (isSelected) {
            newSelectedItems.add(itemId);
        } else {
            newSelectedItems.delete(itemId);
        }
        setSelectedItems(newSelectedItems);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === checkoutItems.length) {
            setSelectedItems(new Set());
        } else {
            const allItemIds = checkoutItems.map(item => getId(item));
            setSelectedItems(new Set(allItemIds));
        }
    };

    // Navigate to CheckoutPage instead of placing order directly
    const handleProceedToCheckout = (specificItems = null) => {
        const itemsToOrder = specificItems || selectedCheckoutItems;
        
        if (itemsToOrder.length === 0) {
            toast.error("Please select at least one item to proceed to checkout.");
            return;
        }

        // Navigate to CheckoutPage with selected items
        navigate("/checkout", { 
            state: { 
                cartItems: itemsToOrder,
                fromCart: true,
                shippingAddress,
                shippingFee: singleProduct ? singleProduct.shippingFee : shippingFee
            } 
        });
    };

    // Buy Now logic for individual items (same as ShopPage)
    const handleBuyNowIndividual = (item) => {
        if (!item) return;
        
        const currentShippingFee = singleProduct ? singleProduct.shippingFee : shippingFee;
        
        let currentShippingAddress;
        if (isAuthenticated && user?.addresses?.length > 0) {
            currentShippingAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
        } else {
            currentShippingAddress = shippingAddress || {
                state: "South Luzon",
                city: "Calamba City", 
                line1: "N/A",
                postalCode: "N/A",
                country: "Philippines"
            };
        }

        const productForCheckout = {
            _id: String(item.productId || item._id || item.id),
            productId: String(item.productId || item._id || item.id),
            name: item.name,
            price: item.price,
            image: item.image,
            variation: item.variation || item.color || "",
            quantity: item.quantity || 1,
            shippingFee: currentShippingFee,
            shippingAddress: currentShippingAddress,
        };

        navigate("/checkout", { state: { product: productForCheckout } });
    };
    
    const handleDecreaseQuantity = async (item) => {
        const newQty = (item.quantity || 1) - 1;
        if (newQty > 0) {
            await updateQuantity(getId(item), newQty);
        } else {
            await removeFromCart(getId(item));
            toast.success("Item removed from cart.");
        }
    };

    const handleIncreaseQuantity = async (item) => {
        const newQty = (item.quantity || 1) + 1;
        await updateQuantity(getId(item), newQty);
    };

    const handleRemoveItem = async (itemId) => {
        await removeFromCart(itemId);
        const newSelectedItems = new Set(selectedItems);
        newSelectedItems.delete(itemId);
        setSelectedItems(newSelectedItems);
        toast.success("Item removed from cart.");
    };

    const currencyFormatter = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    });

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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Review and manage your cart items</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Secure</span>
                    </div>
                </div>

                {checkoutItems.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Product Details */}
                        <div className="space-y-6">
                            {/* Products Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">Cart Items</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{checkoutItems.length} item(s) in your cart</p>
                                            </div>
                                        </div>
                                        {!singleProduct && !arOrder && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {selectedItems.size} of {checkoutItems.length} selected
                                                </span>
                                                <button
                                                    onClick={handleSelectAll}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                                >
                                                    {selectedItems.size === checkoutItems.length ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {checkoutItems.map((item, index) => {
                                        const itemId = getId(item);
                                        const isSelected = selectedItems.has(itemId);
                                        return (
                                            <div key={itemId} className={`p-6 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                                <div className="flex items-start gap-4">
                                                    {!singleProduct && !arOrder && (
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => handleSelectItem(itemId, e.target.checked)}
                                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-2"
                                                        />
                                                    )}
                                                    <div className="relative">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-600"
                                                        />
                                                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                                                            {item.quantity || 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h4>
                                                        {item.color && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Color: {item.color}</p>
                                                        )}
                                                        {item.variation && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Variation: {item.variation}</p>
                                                        )}
                                                        <div className="flex items-center justify-between mt-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                                                    {currencyFormatter.format(item.price)}
                                                                </span>
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">each</span>
                                                            </div>
                                                            {!singleProduct && !arOrder && (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                                        <button 
                                                                            onClick={() => handleDecreaseQuantity(item)}
                                                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-l-lg text-gray-600 dark:text-gray-400"
                                                                        >
                                                                            <Minus className="w-4 h-4" />
                                                                        </button>
                                                                        <span className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                                                                            {item.quantity || 1}
                                                                        </span>
                                                                        <button 
                                                                            onClick={() => handleIncreaseQuantity(item)}
                                                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-r-lg text-gray-600 dark:text-gray-400"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleRemoveItem(itemId)}
                                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between mt-3">
                                                            <div className="text-right">
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal: </span>
                                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                                    {currencyFormatter.format(item.price * (item.quantity || 1))}
                                                                </span>
                                                            </div>
                                                            {/* Individual Buy Now Button for each product */}
                                                            {!singleProduct && !arOrder && (
                                                                <button
                                                                    onClick={() => handleBuyNowIndividual(item)}
                                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-red-600"
                                                                >
                                                                    <ShoppingBag className="w-4 h-4" />
                                                                    Buy Now
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Cart Summary */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                {/* Cart Summary */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="bg-orange-50 dark:bg-orange-900/20 px-6 py-4 border-b border-orange-100 dark:border-orange-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                                <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">Cart Summary</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {selectedItems.size > 0 ? `Selected items (${selectedItems.size})` : 'Select items to checkout'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {selectedItems.size > 0 ? (
                                            <>
                                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                                    <span>Subtotal ({selectedItems.size} items)</span>
                                                    <span>{currencyFormatter.format(subtotal)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                                    <span>Estimated Shipping</span>
                                                    <span>{currencyFormatter.format(singleProduct ? singleProduct.shippingFee : shippingFee)}</span>
                                                </div>
                                                <hr className="border-gray-200 dark:border-gray-700" />
                                                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                                                    <span>Total</span>
                                                    <span className="text-orange-600 dark:text-orange-400">{currencyFormatter.format(totalCost)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-gray-500 dark:text-gray-400">No items selected</p>
                                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                                    Select items to checkout, or use "Buy Now" for individual items
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Proceed to Checkout Button */}
                                {(singleProduct || arOrder || selectedItems.size > 0) && (
                                    <button
                                        disabled={selectedItems.size === 0}
                                        onClick={() => handleProceedToCheckout()}
                                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        <ShoppingBag className="w-6 h-6" />
                                        Proceed to Checkout ({selectedItems.size} items)
                                    </button>
                                )}

                                {/* Continue Shopping Button */}
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    Continue Shopping
                                </button>

                                {/* Security Badge */}
                                <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                    <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span>Your information is secure and encrypted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                        <div className="max-w-md mx-auto">
                            <ShoppingBag className="w-24 h-24 mx-auto text-gray-400 mb-6" />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                Looks like you haven't added any items to your cart yet.
                            </p>
                            <button
                                onClick={() => navigate('/shop')}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}