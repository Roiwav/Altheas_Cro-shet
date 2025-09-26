// src/pages/main/CheckoutPage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { toast } from "react-toastify";

import { useCart } from "../../context/CartContext.jsx";
import { useUser } from "../../context/useUser.js";

export default function CheckoutPage({ isSidebarHovered }) {
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

    // Shipping fees data (could be moved to a shared utility file later)
    const shippingFees = {
        "Manila": 25, "Quezon City": 20, "Calamba City": 36, "Batangas City": 30,
        "Baguio": 35, "Dagupan": 32, "Cebu City": 28, "Iloilo City": 30,
        "Davao City": 34, "Cagayan de Oro": 33,
    };

    // State to manage the ID of the selected address from the user's address book
    const [selectedAddressId, setSelectedAddressId] = useState('');

    const [paymentMethod, setPaymentMethod] = useState('COD');
    // Use the cartItems from context directly, or the single product if it's a "Buy Now" flow.
    const checkoutItems = singleProduct ? [singleProduct] : cartItems;
    const [confirmingRemoveId, setConfirmingRemoveId] = useState(null);

    useEffect(() => {
        // When the component loads, set the initial selected address
        if (isAuthenticated && user?.addresses?.length > 0) {
            // Try to find a default address, or fall back to the first one
            const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress._id); // Use the address's unique ID
                setShippingAddress(defaultAddress);
                setShippingFee(shippingFees[defaultAddress.city] || 0);
            }
        }
    }, [singleProduct, isAuthenticated, user, setShippingAddress, setShippingFee]);

    // Handler for when the user selects a new address from the dropdown
    const handleAddressChange = useCallback((e) => {
        const newAddressId = e.target.value;
        const newAddress = user.addresses.find(addr => addr._id === newAddressId);
        if (newAddress) {
            setSelectedAddressId(newAddressId);
            setShippingAddress(newAddress);
            setShippingFee(shippingFees[newAddress.city] || 0);
        }
    }, [user, setShippingAddress, setShippingFee, shippingFees]);

    const subtotal = checkoutItems.reduce(
        (sum, item) => sum + (item.price * (item.qty || 1)),
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

        try {
            // Consolidate all items into a single order
            const orderData = {
                userId: user?.id,
                username: user?.username,
                products: checkoutItems.map(item => ({
                    productId: getId(item),
                    name: item.name,
                    price: item.price,
                    quantity: item.qty || 1,
                    image: item.image,
                    variation: item.variation,
                })),
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
                // If it wasn't a "Buy Now" single product, clear the main cart.
                if (!singleProduct) {
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

    const handleInitiateRemove = (itemId) => {
        setConfirmingRemoveId(itemId);
    };

    const handleConfirmRemove = async () => {
        if (!confirmingRemoveId) return;
        await removeFromCart(confirmingRemoveId);
        setConfirmingRemoveId(null);
        toast.success("Item removed from cart.");
    };

    const handleCancelRemove = () => {
        setConfirmingRemoveId(null);
    };

    const currencyFormatter = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    });

    return (
        <div
            className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 md:p-12 transition-all duration-300 ${
                isSidebarHovered ? "md:pl-72" : "md:pl-28"
            }`}
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
                                        confirmingRemoveId === getId(item) ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-red-600">Confirm?</span>
                                                <button
                                                    onClick={handleConfirmRemove}
                                                    className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    onClick={handleCancelRemove}
                                                    className="px-3 py-1 bg-gray-300 text-gray-800 rounded-md text-sm hover:bg-gray-400"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleDecreaseQuantity(item)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                                                <span>{item.qty || 1}</span>
                                                <button onClick={() => handleIncreaseQuantity(item)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                                                <button
                                                    onClick={() => handleInitiateRemove(getId(item))}
                                                    className="ml-2 text-red-500 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-6 md:w-1/2 space-y-4">
                            <div>
                                <h4 className="text-gray-700 font-medium">Shipping Info</h4>
                                {isAuthenticated && user?.addresses?.length > 0 ? (
                                    <div className="mt-2">
                                        <select
                                            value={selectedAddressId}
                                            onChange={handleAddressChange}
                                            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                                        >
                                            {user.addresses.map((addr) => (
                                                <option key={addr._id} value={addr._id}>
                                                    {addr.label} - {addr.line1}, {addr.city}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        {(() => {
                                            const addr = singleProduct ? singleProduct.shippingAddress : shippingAddress;
                                            if (!addr) return <p>No shipping address selected.</p>;
                                            const addressParts = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
                                            return <p>{addressParts.join(', ')}</p>;
                                        })()}
                                    </div>
                                )}
                                <p className="text-sm text-gray-600 mt-2">
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

                            <div className="mt-4 border-t pt-4">
                                <h4 className="text-gray-700 font-medium mb-3">Payment Method</h4>
                                <div className="space-y-2">
                                    <label className="flex items-center p-3 border rounded-lg hover:bg-pink-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={paymentMethod === 'COD'}
                                            onChange={() => setPaymentMethod('COD')}
                                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-800">Cash on Delivery (COD)</span>
                                    </label>
                                    <label className="flex items-center p-3 border rounded-lg hover:bg-pink-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="GCash"
                                            checked={paymentMethod === 'GCash'}
                                            onChange={() => setPaymentMethod('GCash')}
                                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-800">GCash</span>
                                    </label>
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
