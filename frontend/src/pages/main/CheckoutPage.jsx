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

// Shipping fee/region logic
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
function getRegionByCity(city) {
  return Object.keys(regions).find(region => regions[region].includes(city)) || defaultRegion;
}

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

  const checkoutItems = singleProduct ? [singleProduct] : cartItems;

  // Dynamically derive shipping fee and estimated delivery
  const [derivedShippingFee, setDerivedShippingFee] = useState(0);
  const [derivedDeliveryEstimate, setDerivedDeliveryEstimate] = useState("");

  const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];
  const currentAddress = selectedAddress || passedShippingAddress || defaultAddress;

  useEffect(() => {
    if (user && !selectedAddress) {
      setSelectedAddress(defaultAddress);
    }
  }, [user, defaultAddress, selectedAddress]);

  // Watch the (possibly changed) address for shipping calculation
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

  useEffect(() => {
    if (checkoutItems.length === 0) {
      toast.error("No items to checkout");
      navigate("/cart");
    }
  }, [checkoutItems.length, navigate]);

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  // Always use the dynamically derived shipping fee
  const shippingFee = derivedShippingFee;

  const totalCost = subtotal + shippingFee;

  const handleChangeAddress = () => {
    setIsAddressModalOpen(true);
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setIsAddressModalOpen(false);
  };

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

  const handleRemovePaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
    const fileInput = document.getElementById("payment-proof-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

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

      const response = await fetch(`${SERVER_BASE_URL}/api/orders`, {
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

  const currencyFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  });

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
