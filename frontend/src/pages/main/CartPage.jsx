// src/pages/main/CartPage.jsx (UPDATED - guest user buy now restrictions)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Package, CreditCard, Minus, Plus, X, Shield, UserPlus } from "lucide-react";
import { toast } from "react-toastify";

import { useCart } from "../../context/cart-context.js";
import { useUser } from "../../context/useUser.js";
import { getProductImageSrc } from "../../utils/product.js";

export default function CartPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    cartItems,
    getId,
    updateQuantity,
    removeFromCart,
    removeMultipleFromCart,
    shippingAddress,
    setShippingAddress,
    shippingFee,
    setShippingFee
  } = useCart();

  const { user, isAuthenticated } = useUser();

  const singleProduct = location.state?.product;
  const arOrder = location.state && !location.state.product ? location.state : null;

    // Shipping fees data (memoized)
  const shippingFees = useMemo(() => ({
    "Manila": 25, "Quezon City": 20, "Calamba City": 36, "Batangas City": 30,
    "Baguio": 35, "Dagupan": 32, "Cebu City": 28, "Iloilo City": 30,
    "Davao City": 34, "Cagayan de Oro": 33,
  }), []);

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
    }, [singleProduct, isAuthenticated, user, setShippingAddress, setShippingFee, shippingFees]);

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

    // Effect to scroll to top on component mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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

    const handleRemoveSelected = async () => {
        if (selectedItems.size === 0) {
            toast.info("No items selected to remove.");
            return;
        }

        if (window.confirm(`Are you sure you want to remove ${selectedItems.size} selected item(s)?`)) {
            const idsToRemove = Array.from(selectedItems);
            await removeMultipleFromCart(idsToRemove);
            setSelectedItems(new Set()); // Clear selection after removal
            toast.success(`${idsToRemove.length} item(s) removed from your cart.`);
        }
    };

    // Navigate to CheckoutPage for authenticated users, signup for guests
    const handleProceedToCheckout = useCallback((specificItems = null) => {
        const itemsToOrder = specificItems || selectedCheckoutItems;
        
        if (itemsToOrder.length === 0) {
            toast.error("Please select at least one item to proceed to checkout.");
            return;
        }

        if (itemsToOrder.length < 2) {
            toast.error("Please select at least 2 items to proceed to bulk checkout.");
            return;
        }

        // ✅ NEW: Check if user is authenticated for bulk checkout
        if (!isAuthenticated) {
            toast.info("Please sign up to checkout your items. Your cart will be saved to your account!");
            navigate("/signup", {
                state: { 
                    from: "cart-bulk-checkout",
                    cartItems: itemsToOrder
                }
            });
            return;
        }

        // Navigate to CheckoutPage with selected items (authenticated users only)
        navigate("/checkout", { 
            state: { 
                cartItems: itemsToOrder,
                fromCart: true,
                shippingAddress,
                shippingFee: singleProduct ? singleProduct.shippingFee : shippingFee
            } 
        });
    }, [isAuthenticated, navigate, selectedCheckoutItems, shippingAddress, shippingFee, singleProduct]);

    // ✅ UPDATED: Buy Now logic - redirect guests to signup
    const handleBuyNowIndividual = (item) => {
        if (!item) return;
        
        // ✅ NEW: Check if user is authenticated for individual buy now
        if (!isAuthenticated) {
            toast.info("Please sign up to purchase items directly. Your cart will be saved to your account!");
            navigate("/signup", {
                state: { 
                    from: "cart-buy-now",
                    product: {
                        ...item,
                        shippingFee: singleProduct ? singleProduct.shippingFee : shippingFee
                    }
                }
            });
            return;
        }
        
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
        const currentQty = item.quantity || 1;
        
        // Don't allow decrease if quantity is already 1
        if (currentQty <= 1) {
            return; // Do nothing - button should be disabled at this point
        }
        
        const newQty = currentQty - 1;
        await updateQuantity(getId(item), newQty);
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
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Header */}
                <div className="relative flex items-center justify-between h-12 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Back</span>
                    </button>
                    <div className="absolute text-center -translate-x-1/2 left-1/2">
                        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">Shopping Cart</h1>
                        <p className="hidden text-sm text-gray-500 sm:block dark:text-gray-400">Review your items</p>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-green-600 w-28 dark:text-green-400">
                        <Shield className="w-4 h-4" />
                        <span className="hidden text-sm font-medium sm:inline">Secure</span>
                    </div>
                </div>

                {/* ✅ NEW: Guest user info banner for cart page */}
                {!isAuthenticated && checkoutItems.length > 0 && (
                    <div className="p-4 mb-6 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <UserPlus className="text-orange-600 dark:text-orange-400" />
                                <div>
                                    <p className="font-medium text-orange-900 dark:text-orange-100">
                                        You're shopping as a guest
                                    </p>
                                    <p className="text-sm text-orange-700 dark:text-orange-300">
                                        Sign up to checkout your {checkoutItems.length} item(s) and save your cart to your account!
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate("/signup", { state: { from: "cart-page" } })}
                                className="px-4 py-2 font-medium text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-700"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                )}

                {checkoutItems.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Left Column - Product Details */}
                        <div className="space-y-6">
                            {/* Products Card */}
                            <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                                <div className="px-6 py-4 border-b border-blue-100 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
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
                                                    {selectedItems.size} / {checkoutItems.length} selected
                                                </span>
                                                <button
                                                    onClick={handleSelectAll}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                                >
                                                    {selectedItems.size === checkoutItems.length ? 'Deselect All' : 'Select All'}
                                                </button>
                                                {selectedItems.size > 0 && (
                                                    <>
                                                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                                                        <button
                                                            onClick={handleRemoveSelected}
                                                            className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                                                        >
                                                            Remove Selected
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
{checkoutItems.map((item) => {
                                        const itemId = getId(item);
                                        const isSelected = selectedItems.has(itemId);
                                        const currentQty = item.quantity || 1;
                                        const isMinQuantity = currentQty <= 1;
                                        
                                        return (
                                            <div key={itemId} className={`p-6 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                                <div className="flex items-start gap-4">
                                                    {!singleProduct && !arOrder && (
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => handleSelectItem(itemId, e.target.checked)}
                                                            className="w-5 h-5 mt-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        />
                                                    )}
                                                    <div className="relative">
                                                        <img
                                                            src={getProductImageSrc(item.image)}
                                                            alt={item.name}
                                                            className="object-cover w-20 h-20 border border-gray-200 rounded-xl dark:border-gray-600"
                                                        />


                                                        <div className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-orange-500 rounded-full -top-2 -right-2">
                                                            {currentQty}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-gray-900 truncate dark:text-white">{item.name}</h4>
                                                        {item.color && (
                                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Color: {item.color}</p>
                                                        )}
                                                        {item.variation && (
                                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Variation: {item.variation}</p>
                                                        )}
                                                        <div className="flex flex-col gap-3 mt-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex items-center">
                                                                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                                                    {currencyFormatter.format(item.price)}
                                                                </span>
                                                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">each</span>
                                                            </div>
                                                            {!singleProduct && !arOrder && (
                                                                <div className="flex items-center justify-between gap-3 sm:justify-end">
                                                                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg dark:bg-gray-700">
                                                                        <button 
                                                                            onClick={() => handleDecreaseQuantity(item)}
                                                                            disabled={isMinQuantity}
                                                                            className={`p-2.5 sm:p-2 rounded-l-lg text-gray-600 dark:text-gray-400 transition-colors ${
                                                                                isMinQuantity 
                                                                                    ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700' 
                                                                                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                            }`}
                                                                        >
                                                                            <Minus className="w-4 h-4" />
                                                                        </button>
                                                                        <span className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white min-w-[2.5rem] text-center">
                                                                            {currentQty}
                                                                        </span>
                                                                        <button 
                                                                            onClick={() => handleIncreaseQuantity(item)}
                                                                            className="p-2.5 sm:p-2 text-gray-600 rounded-r-lg hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-400"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleRemoveItem(itemId)}
                                                                        className="p-2.5 sm:p-2 text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                        title="Remove item from cart"
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
                                                                    {currencyFormatter.format(item.price * currentQty)}
                                                                </span>
                                                            </div>
                                                            {/* ✅ UPDATED: Individual Buy Now Button - different for guests */}
                                                            {!singleProduct && !arOrder && isAuthenticated && (
                                                                <button
                                                                    onClick={() => handleBuyNowIndividual(item)}
                                                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors bg-red-600 border border-red-600 rounded-lg sm:px-4 hover:bg-red-700"
                                                                >
                                                                    <ShoppingBag className="w-4 h-4" />
                                                                    <span className="hidden sm:inline">Buy Now</span>
                                                                    <span className="sm:hidden">Buy</span>
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
                            <div className="sticky space-y-6 top-24">
                                {/* Cart Summary */}
                                <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                                    <div className="px-6 py-4 border-b border-orange-100 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/30">
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
                                            <div className="py-6 text-center">
                                                <p className="text-gray-500 dark:text-gray-400">No items selected</p>
                                                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                                    {isAuthenticated 
                                                        ? "Select 2+ items for bulk checkout, or use 'Buy Now' for individual items"
                                                        : "Sign up to checkout items, or use 'Sign Up to Buy' for individual items"
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Proceed to Checkout Button - Only show when 2+ items are selected */}
                                {selectedItems.size >= 2 && (
                                     <button
                                        onClick={() => handleProceedToCheckout()}
                                        className={`w-full py-3 sm:py-4 font-bold text-base sm:text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 ${
                                            isAuthenticated
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                                                : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
                                        }`}
                                    >
                                        <ShoppingBag className="w-6 h-6" />
                                        <span className="hidden sm:inline">{isAuthenticated ? `Proceed to Checkout (${selectedItems.size} items)` : `Sign Up to Checkout (${selectedItems.size} items)`}</span>
                                        <span className="sm:hidden">{isAuthenticated ? `Checkout (${selectedItems.size})` : `Sign Up (${selectedItems.size})`}</span>
                                    </button>
                                )}

                                {/* Helper message when less than 2 items selected */}
                                {selectedItems.size === 1 && (
                                    <div className="p-4 text-center border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-xl">
                                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                                            {isAuthenticated
                                                ? "Select one more item for bulk checkout, or use 'Buy Now' to purchase this item individually."
                                                : "Select one more item for bulk checkout, or use 'Sign Up to Buy' to purchase this item individually."
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Continue Shopping Button */}
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="flex items-center justify-center w-full gap-2 py-3 font-medium text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-xl"
                                >
                                    Continue Shopping
                                </button>

                                {/* Security Badge */}
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span>Your information is secure and encrypted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 text-center bg-white shadow-sm dark:bg-gray-800 rounded-2xl">
                        <div className="max-w-md mx-auto">
                            <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-gray-400" />
                            <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Your cart is empty</h3>
                            <p className="mb-8 text-gray-600 dark:text-gray-400">
                                Looks like you haven't added any items to your cart yet.
                            </p>
                            <button
                                onClick={() => navigate('/shop')}
                                className="inline-flex items-center gap-2 px-8 py-3 font-semibold text-white transition-colors bg-orange-600 rounded-xl hover:bg-orange-700"
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
