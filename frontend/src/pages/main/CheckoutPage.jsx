    // src/pages/main/CheckoutPage.jsx
    import { useLocation, useNavigate } from "react-router-dom";
    import React, { useState, useEffect, useCallback } from "react";
    import { ArrowLeft, ShoppingBag, Loader2 } from "lucide-react";
    import { toast } from "react-toastify";

    import gcashIcon from '../../assets/images/icons/gcash.png';
    import { SettingsContext } from "../../context/SettingsContext.jsx";
    import { useCart } from "../../context/CartContext.jsx";
    import { useUser } from "../../context/useUser.js";

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
        const { settings } = React.useContext(SettingsContext);

        const singleProduct = location.state?.product;

        const arOrder = location.state && !location.state.product ? location.state : null;

        // Shipping fees data (could be moved to a shared utility file later)
        const shippingFees = {
            "Manila": 25, "Quezon City": 20, "Calamba City": 36, "Batangas City": 30,
            "Baguio": 35, "Dagupan": 32, "Cebu City": 28, "Iloilo City": 30,
            "Davao City": 34, "Cagayan de Oro": 33,
        };

        const [paymentMethod, setPaymentMethod] = useState('GCash');
        const [isPlacingOrder, setIsPlacingOrder] = useState(false);
        // Use the cartItems from context directly, or the single product if it's a "Buy Now" flow.
        const checkoutItems = singleProduct 
        ? [singleProduct] 
        : arOrder
        ? [{
            name: `${arOrder.arrangement} ${arOrder.flowerType}`, // <-- update here
            price: arOrder.totalPrice, 
            quantity: arOrder.quantity,
            color: `${arOrder.color}`,
            image: "/images/placeholder-flower.png", // <-- update with actual AR flower image if available
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

        // ✅ If DB has no addresses, fallback to localStorage
        if (addresses.length === 0) {
        const saved = localStorage.getItem("userAddresses");
        if (saved) {
            addresses = JSON.parse(saved);
        }
        }

        if (addresses.length > 0) {
        // ✅ Find the default, else use first one
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
        const totalCost = subtotal + 
        (singleProduct 
        ? singleProduct.shippingFee
        : arOrder
        ? (arOrder.shippingFee || 0) 
        : shippingFee);

        const handlePlaceOrder = async () => {
            if (!isAuthenticated) {
                toast.info("You need to sign up first before placing an order.");
                navigate("/login", {
                    state: { from: "checkout" },
                });
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
                            productId: id || 'Custom-Flower', // Ensure this is a string, as expected by the backend
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity || 1,
                            image: item.image,
                            color: item.color
                        };
                    }),
                    shippingAddress: singleProduct 
                    ? singleProduct.shippingAddress
                    : arOrder
                    ? {
                        city: arOrder.shippingSubArea,
                        state: arOrder.shippingArea,
                        line1: arOrder.streetAddress
                    }
                    : shippingAddress,
                    shippingFee: singleProduct 
                    ? singleProduct.shippingFee
                    : arOrder
                    ? arOrder.shippingFee || 0
                    : shippingFee,
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
                    // If it wasn't a "Buy Now" single product, clear the main cart.
                    if (!singleProduct && !arOrder) {
                        clearCart(); 
                    }
                    toast.success("Your order has been placed successfully!");
                    navigate("/orders"); // Navigate to orders page to see the new orders
                } else {
                    let errorMessage = "The order could not be placed.";
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) { /* Ignore JSON parsing errors */ }
                    toast.error(errorMessage);
                }
            } catch (err) {
                console.error("Failed to place order(s):", err);
                toast.error(err.message || "An unexpected server error occurred. Please try again.");
            } finally {
                setIsPlacingOrder(false);
            }
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

        const handleIncreaseQuantity = async (item) => {
            const newQty = (item.quantity || 1) + 1;
            await updateQuantity(getId(item), newQty);
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
                <div className="w-full max-w-5xl overflow-hidden border shadow-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border-white/20 dark:border-gray-700/50">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/70 dark:border-gray-700/70">
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
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="object-contain w-20 h-20 rounded"
                                        />
                                        <div className="flex-1 mx-4">
                                            <p className="font-medium">{item.name}</p>
                                            {item.color && (
                                                <p className="text-sm text-gray-500">Color: {item.color}</p>
                                            )}
                                            <p className="mt-1 text-gray-700">
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

                            <div className="p-6 space-y-4 md:w-1/2">
                                <div>
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Shipping Info</h4>
                                    <div className="p-3 mt-1 text-sm text-gray-600 border rounded-lg dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
                                        {(() => {
                                            const addr = singleProduct ? singleProduct.shippingAddress : shippingAddress;
                                            if (!addr) return <p>No shipping address selected. Please add one in your dashboard.</p>;
                                            const addressParts = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
                                            return <p>{addressParts.join(', ')}</p>;
                                        })()}
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600">
                                        Shipping Fee: {currencyFormatter.format(singleProduct ? singleProduct.shippingFee : shippingFee)}
                                    </p>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-200/70 dark:border-gray-700/70">
                                    <h4 className="mb-2 font-medium text-gray-700 dark:text-gray-300">Order Summary</h4>
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Subtotal</span>
                                        <span>{currencyFormatter.format(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Shipping Fee</span>
                                        <span>{currencyFormatter.format(singleProduct ? singleProduct.shippingFee : shippingFee)}</span>
                                    </div>
                                    <div className="flex justify-between mt-2 text-lg font-bold text-gray-900 dark:text-white">
                                        <span>Total</span>
                                        <span>{currencyFormatter.format(totalCost)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-200/70 dark:border-gray-700/70">
                                    <h4 className="mb-3 font-medium text-gray-700 dark:text-gray-300">Payment Method</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer dark:border-gray-600 hover:bg-pink-50 dark:hover:bg-gray-700/50">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="GCash"
                                                checked={paymentMethod === 'GCash'}
                                                onChange={() => setPaymentMethod('GCash')}
                                                className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                                            />
                                            <img src={gcashIcon} alt="GCash" className="w-auto h-6 ml-3" />
                                        </label>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-6 sm:flex-row">
                                    <button
                                        disabled={isPlacingOrder}
                                        onClick={handlePlaceOrder}
                                        className="inline-flex items-center justify-center flex-1 gap-2 py-3 text-base font-semibold text-white transition-colors bg-pink-600 rounded-xl hover:bg-pink-700 disabled:bg-pink-400 disabled:cursor-not-allowed"
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
                            <ShoppingBag className="w-16 h-16 mx-auto text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Your cart is empty</h3>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">
                                You have no items to check out.
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
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
