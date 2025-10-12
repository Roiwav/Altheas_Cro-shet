import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { toast } from "react-toastify";

import gcashIcon from "../../assets/images/icons/gcash.png";
import { useCart } from "../../hooks/useCart";
import { useUser } from "../../context/useUser.js";
import { getProductImageSrc, SERVER_BASE_URL } from "../../utils/product.js";

import DeliveryAddressCard from "../../components/checkout/DeliveryAddressCard.jsx";
import OrderItemsCard from "../../components/checkout/OrderItemsCard.jsx";
import PaymentProofCard from "../../components/checkout/PaymentProofCard.jsx";
import OrderSummaryCard from "../../components/checkout/OrderSummaryCard.jsx";
import PaymentMethodCard from "../../components/checkout/PaymentMethodCard.jsx";
import PlaceOrderButton from "../../components/checkout/PlaceOrderButton.jsx";
import Modal from "../../components/common/Modal.jsx";
import AddressesTab from "../../components/user/settings/AddressesTab.jsx";

// --- Shipping Logic ---
const regions = {
  "Inside Calamba": ["Calamba", "Calamba City"],
  "Inside Laguna": ["Los Baños", "Cabuyao", "San Pablo", "Biñan", "Sta. Rosa"],
  "Outside Laguna": ["Cavite", "Batangas", "Rizal"],
  "Metro Manila": ["Manila", "Quezon City", "Pasig", "Makati", "Taguig", "Mandaluyong", "Pasay"],
  "Rest of Luzon": ["Baguio", "Dagupan", "La Union", "Tarlac", "Pampanga", "Bulacan", "Nueva Ecija"],
  "Visayas/Mindanao": ["Cebu City", "Iloilo City", "Davao City", "Cagayan de Oro", "Zamboanga", "Tacloban"]
};
const shippingFees = {
  "Inside Calamba":      { min: 60,   max: 80,   estimated: "2 – 3 days" },
  "Inside Laguna":       { min: 80,   max: 120,  estimated: "2 – 4 days" },
  "Outside Laguna":      { min: 150,  max: 200,  estimated: "3 – 6 days" },
  "Metro Manila":        { min: 120,  max: 180,  estimated: "3 – 5 days" },
  "Rest of Luzon":       { min: 180,  max: 250,  estimated: "4 – 7 days" },
  "Visayas/Mindanao":    { min: 250,  max: 400,  estimated: "5 – 10 days" }
};
const defaultRegion = "Inside Calamba";

/**
 * Determines the shipping region based on a given city.
 * @param {string} city - The city name.
 * @returns {string} The corresponding region name or a default.
 */
function getRegionByCity(city) {
  return Object.keys(regions).find(region => regions[region].includes(city)) || defaultRegion;
}

/**
 * Renders the checkout page where users finalize their order.
 * It handles address selection, payment proof upload, and order submission.
 */
export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { removeFromCart, getId } = useCart();
  const { user, isAuthenticated, token } = useUser();

  const singleProduct = location.state?.product;
  const cartItems = location.state?.cartItems || [];
  const fromCart = location.state?.fromCart || false;
  const passedShippingAddress = location.state?.shippingAddress;
  const passedShippingFee = location.state?.shippingFee || 0;

  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // The items to be included in this checkout session.
  const checkoutItems = singleProduct ? [singleProduct] : cartItems;

  // State for dynamically derived shipping fee and delivery estimate based on address.
  const [derivedShippingFee, setDerivedShippingFee] = useState(0);
  const [derivedDeliveryEstimate, setDerivedDeliveryEstimate] = useState("");

  // Determine the current address to use for the order.
  const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];
  const currentAddress = selectedAddress || passedShippingAddress || defaultAddress;

  /**
   * Effect to set the selected address to the user's default address on initial load.
   */
  useEffect(() => {
    if (user && !selectedAddress) {
      setSelectedAddress(defaultAddress);
    }
  }, [user, defaultAddress, selectedAddress]);

  /**
   * Effect to recalculate the shipping fee and delivery estimate whenever the address changes.
   */
  useEffect(() => {
    let addressObj = currentAddress;
    if (addressObj && addressObj.city) {
      const region = getRegionByCity(addressObj.city);
      const feeObj = shippingFees[region] || { min: 0, estimated: "N/A" };
      setDerivedShippingFee(feeObj.min);
      setDerivedDeliveryEstimate(feeObj.estimated);
    } else {
      setDerivedShippingFee(passedShippingFee || 0);
      setDerivedDeliveryEstimate(shippingFees[defaultRegion].estimated); // Fallback to default
    }
  }, [currentAddress, passedShippingFee, user]);

  /**
   * Effect to redirect the user if they land on the checkout page with no items.
   */
  useEffect(() => {
    if (checkoutItems.length === 0) {
      toast.error("No items to checkout");
      navigate("/cart");
    }
  }, [checkoutItems.length, navigate]);

  // Calculate order totals.
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  const shippingFee = derivedShippingFee;
  const totalCost = subtotal + shippingFee;

  /**
   * Opens the address management modal.
   */
  const handleChangeAddress = () => {
    setIsAddressModalOpen(true);
  };

  /**
   * Handles the selection of an address from the modal.
   * @param {object} address - The selected address object.
   */
  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setIsAddressModalOpen(false);
  };

  /**
   * Handles the file upload for the payment proof.
   * Validates file type and size before setting the state.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const handlePaymentProofUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, JPEG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setPaymentProof(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPaymentProofPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    toast.success("Payment proof uploaded successfully!");
  };

  /**
   * Removes the currently uploaded payment proof.
   */
  const handleRemovePaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
    const fileInput = document.getElementById("payment-proof-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  /**
   * Handles the final order submission.
   * It validates the form, constructs FormData, and sends the order to the backend.
   */
  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.info("You need to sign up first before placing an order.");
      navigate("/login", { state: { from: "checkout" } });
      return;
    }

    if (checkoutItems.length === 0) {
      toast.error("No items to order.");
      return;
    }

    if (!paymentProof) {
      toast.error("Please upload proof of payment before placing your order.");
      return;
    }

    if (!currentAddress) {
      toast.error("Please add a delivery address before placing your order.");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const formData = new FormData();

      // Prepare order data object to be sent to the backend.
      const orderData = {
        userId: user?.id,
        username: user?.username,
        products: checkoutItems.map((item) => {
          const id = item.productId || item._id || item.id;
          if (!id) console.error("Item missing productId and _id:", item);
          return {
            productId: id || "Custom-Flower",
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            image: item.image,
            color: item.color,
            variation: item.variation,
          };
        }),
        shippingAddress: currentAddress,
        shippingFee: shippingFee,
        total: totalCost,
        paymentMethod: paymentMethod,
        estimatedDelivery: derivedDeliveryEstimate,
      };

      formData.append("orderData", JSON.stringify(orderData));
      formData.append("paymentProof", paymentProof);

      const response = await fetch(`${SERVER_BASE_URL}/api/v1/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
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
        } catch { /* empty */ }
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Failed to place order:", err);
      toast.error(
        err.message || "An unexpected server error occurred. Please try again."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Memoized currency formatter for performance.
  const currencyFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  });

  // Return null if there are no items to check out (e.g., after a redirect).
  if (checkoutItems.length === 0) return null;

  const canPlaceOrder = paymentProof && currentAddress && !isPlacingOrder;

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Checkout
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Complete your purchase
            </p>
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Secure</span>
          </div>
        </div>

        <Modal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          title="Manage Your Addresses"
        >
          <AddressesTab onSelectAddress={handleSelectAddress} isSelectMode={true} />
        </Modal>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            <DeliveryAddressCard
              address={currentAddress}
              shippingFee={shippingFee}
              estimatedDelivery={derivedDeliveryEstimate}
              onChangeAddress={handleChangeAddress}
            />

            <OrderItemsCard
              items={checkoutItems}
              getProductImageSrc={getProductImageSrc}
              currencyFormatter={currencyFormatter}
            />

            <PaymentProofCard
              paymentProofPreview={paymentProofPreview}
              paymentProof={paymentProof}
              onUpload={handlePaymentProofUpload}
              onRemove={handleRemovePaymentProof}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky space-y-6 top-24">
              <OrderSummaryCard
                itemsCount={checkoutItems.length}
                subtotal={subtotal}
                shippingFee={shippingFee}
                totalCost={totalCost}
                currencyFormatter={currencyFormatter} 
                estimatedDelivery={derivedDeliveryEstimate}
              />

              <PaymentMethodCard
                method={paymentMethod}
                setMethod={setPaymentMethod}
                gcashIcon={gcashIcon}
              />

              <PlaceOrderButton
                canPlaceOrder={Boolean(canPlaceOrder)}
                isPlacingOrder={isPlacingOrder}
                onPlaceOrder={handlePlaceOrder}
                totalCost={totalCost}
                currencyFormatter={currencyFormatter}
                hasPaymentProof={Boolean(paymentProof)}
              />

              {!paymentProof && (
                <div className="p-3 text-center border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Please upload your payment proof to continue
                  </p>
                </div>
              )}

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
