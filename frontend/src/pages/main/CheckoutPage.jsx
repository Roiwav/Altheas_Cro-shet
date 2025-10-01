// src/pages/main/CheckoutPage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import codIcon from '../../assets/images/icons/cash-on-delivery.png';
import gcashIcon from '../../assets/images/icons/gcash.png';
import { useCart } from "../../context/CartContext.jsx";
import { useUser } from "../../context/useUser.js";
import useSettings from "../../hooks/useSettings";

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        cartItems, // The items in the cart
        getId, // Helper function to get a unique ID for a cart item
        updateQuantity,
        removeFromCart,
        shippingAddress, // The current shipping address object from the context
        setShippingAddress, // Function to update the shipping address in the context
        shippingFee, // The current shipping fee from the context
        setShippingFee, // Function to update the shipping fee in the context
        clearCart
    } = useCart();

    const { user, isAuthenticated, token } = useUser();

    const singleProduct = location.state?.product;

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const { settings } = useSettings();
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    // Use the cartItems from context directly, or the single product if it's a "Buy Now" flow.
    const checkoutItems = singleProduct ? [singleProduct] : cartItems;

    useEffect(() => {
        // Shipping fees data (moved inside useEffect to avoid dependency issues)
        const shippingFees = {
            "Manila": 25, "Quezon City": 20, "Calamba City": 36, "Batangas City": 30,
            "Baguio": 35, "Dagupan": 32, "Cebu City": 28, "Iloilo City": 30,
            "Davao City": 34, "Cagayan de Oro": 33,
        };

        if (isAuthenticated) {
            let addresses = user?.addresses || [];

            // If DB has no addresses, fallback to localStorage
            if (addresses.length === 0) {
                const saved = localStorage.getItem("userAddresses");
                if (saved) {
                    try {
                        addresses = JSON.parse(saved);
                    } catch (e) {
                        console.error("Error parsing saved addresses:", e);
                    }
                }
            }

            if (addresses.length > 0) {
                // Find the default, else use first one
                const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];

                setShippingAddress(defaultAddress);
                setShippingFee(shippingFees[defaultAddress.city] || 0);
            }
        }
    }, [singleProduct, isAuthenticated, user, setShippingAddress, setShippingFee]);

    const subtotal = checkoutItems.reduce(
        (sum, item) => sum + (item.price * (item.quantity || 1)),
        0
    );
    const totalCost = subtotal + (singleProduct ? singleProduct.shippingFee : shippingFee);

    const handlePlaceOrder = async () => {
        if (!isAuthenticated) {
            toast.info("You need to sign up first before placing an order.");
            navigate("/login", {
                state: { from: "checkout" },
            });
            return;
        }

        if (paymentMethod === 'GCash' && !settings?.gcashPayment) {
            toast.error("GCash payment is currently unavailable. Please choose another payment method.");
            return;
        }

        setIsPlacingOrder(true);

        try {
            // Consolidate all items into a single order
            const orderData = {
                userId: user?.id,
                username: user?.username,
                products: checkoutItems.map((item) => {
                    const id = item.productId || item._id || item.id;
                    if (!id) {
                        console.error('Item is missing productId and _id:', item);
                    }
                    return {
                        productId: id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity || 1,
                        image: item.image,
                        variation: item.variation,
                    };
                }),
                shippingAddress: singleProduct ? singleProduct.shippingAddress : shippingAddress,
                shippingFee: singleProduct ? singleProduct.shippingFee : shippingFee,
                total: totalCost,
                paymentMethod: paymentMethod,
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
                if (!singleProduct) {
                    clearCart(); 
                }
                toast.success("Your order has been placed successfully!");
                navigate("/orders");
            } else {
                let errorMessage = "The order could not be placed.";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    console.error("Error parsing error response:", e);
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error placing order:', error);
            toast.error(error.message || 'Failed to place order. Please try again.');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const handleIncreaseQuantity = async (item) => {
        const newQty = (item.quantity || 1) + 1;
        await updateQuantity(getId(item), newQty);
    };

    const handleDecreaseQuantity = async (item) => {
        const newQty = (item.quantity || 1) - 1;
        if (newQty > 0) {
            await updateQuantity(getId(item), newQty);
        } else {
            // If quantity becomes 0, remove the item directly
            await removeFromCart(getId(item));
            toast.success("Item removed from cart.");
        }
    };

    const handleRemoveItem = async (itemId) => {
        await removeFromCart(itemId);
        toast.success("Item removed from cart.");
    };

    const currencyFormatter = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    });

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 md:pr-12 md:pl-[calc(var(--sidebar-width,5rem)+3rem)] transition-[padding-left] duration-300 ease-in-out"
        >
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

                {checkoutItems.length > 0 ? (
                    <div className="flex flex-col md:flex-row">
                        <div className="p-6 md:w-1/2 border-r space-y-4 overflow-y-auto max-h-[60vh]">
                            {checkoutItems.map((item) => (
                                <div
                                    key={getId(item)}
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
                                            <button onClick={() => handleDecreaseQuantity(item)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                                            <span>{item.quantity || 1}</span>
                                            <button onClick={() => handleIncreaseQuantity(item)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                                            <button
                                                onClick={() => handleRemoveItem(getId(item))}
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
                                <h4 className="text-gray-700 dark:text-gray-300 font-medium">Shipping Info</h4>
                                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    {(() => {
                                        const addr = singleProduct ? singleProduct.shippingAddress : shippingAddress;
                                        if (!addr) return <p>No shipping address selected. Please add one in your dashboard.</p>;
                                        const addressParts = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
                                        return <p>{addressParts.join(', ')}</p>;
                                    })()}
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    Shipping Fee: {currencyFormatter.format(singleProduct ? singleProduct.shippingFee : shippingFee)}
                                </p>
                            </div>

                            <div className="mt-4 border-t border-gray-200/70 dark:border-gray-700/70 pt-4">
                                <h4 className="text-gray-700 dark:text-gray-300 font-medium mb-2">Order Summary</h4>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{currencyFormatter.format(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Shipping Fee</span>
                                    <span>{currencyFormatter.format(singleProduct ? singleProduct.shippingFee : shippingFee)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg mt-2 text-gray-900 dark:text-white">
                                    <span>Total</span>
                                    <span>{currencyFormatter.format(totalCost)}</span>
                                </div>
                            </div>

                            <div className="mt-4 border-t border-gray-200/70 dark:border-gray-700/70 pt-4">
                                <h4 className="text-gray-700 dark:text-gray-300 font-medium mb-3">Payment Method</h4>
                                <div className="space-y-2">
                                    <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-pink-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={paymentMethod === 'COD'}
                                            onChange={() => setPaymentMethod('COD')}
                                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                                        />
                                        <img src={codIcon} alt="Cash on Delivery" className="ml-3 h-6 w-auto" />
                                        <span className="ml-2 text-sm font-medium text-gray-800 dark:text-gray-200">Cash on Delivery (COD)</span>
                                    </label>
                                    {settings?.gcashPayment && (
                                        <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-pink-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="GCash"
                                                checked={paymentMethod === 'GCash'}
                                                onChange={() => setPaymentMethod('GCash')}
                                                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                                            />
                                            <img src={gcashIcon} alt="GCash" className="ml-3 h-6 w-auto" />
                                            <span className="ml-2 text-sm font-medium text-gray-800 dark:text-gray-200">GCash</span>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button
                                    disabled={isPlacingOrder}
                                    onClick={handlePlaceOrder}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-pink-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-pink-700 transition-colors disabled:bg-pink-400 disabled:cursor-not-allowed"
                                >
                                    {isPlacingOrder ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <ShoppingBag className="w-5 h-5" />
                                    )}
                                    {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <ShoppingBag className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Your cart is empty</h3>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                            You have no items to check out.
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/shop')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                            >
                                Go to Shop
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
