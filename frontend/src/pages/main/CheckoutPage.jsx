import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingBag, ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import { useCart } from "../../context/cart-context";
import "react-toastify/dist/ReactToastify.css";

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const product = location.state?.product;
  const region = location.state?.region;
  const city = location.state?.city;
  const shippingFee = location.state?.shippingFee;
  const variation = location.state?.variation || "";

const BASE_URL = "http://localhost/croshet_db/get-cart.php";  // Update this URL


  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);

    if (!product) {
      toast.error("Please select a product to checkout");
      navigate("/shop");
    }
  }, [product, navigate]);

 const handlePlaceOrder = async () => {
  if (!isLoggedIn) {
    toast.info("Please login to complete your purchase");
    navigate("/login", {
      state: { from: "checkout", product, region, city, shippingFee, variation },
    });
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));
  const orderData = {
    user_id: user.id,
    product_name: product.name,
    quantity: 1,
    price: product.price,
    city,
    region,
    shipping_fee: shippingFee,
    variation,
  };

  try {
    const response = await fetch(`${BASE_URL}/place-order.php`, {  // Updated URL
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();
    if (result.success) {
      toast.success("Order placed successfully!");
      navigate("/shop");
    } else {
      toast.error("Failed to place order: " + result.message);
    }
  } catch (error) {
    console.error(error);
    toast.error("Error placing order");
  }
};

const handleAddToCart = async () => {
  if (!isLoggedIn) {
    toast.info("Please login to add items to your cart");
    navigate("/login", {
      state: { from: "shop", product, region, city, shippingFee, variation },
    });
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));

  const cartData = {
    user_id: user.id,
    product_id: product.id,
    quantity: 1,
  };

  try {
    const response = await fetch(`${BASE_URL}/add-to-cart.php`, {  // Updated URL
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cartData),
    });

    const result = await response.json();

    if (result.success) {
      toast.success(`${product.name} (${variation}) added to cart!`);
      await refreshCart(); // 🔄 force cart UI update
    } else {
      toast.error("Failed to add to cart: " + result.message);
    }
  } catch (error) {
    console.error("Add to cart error:", error);
    toast.error("Something went wrong adding to cart");
  }
};

  if (!product) return null;

  const totalCost = product.price + shippingFee;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft /> Back to Shop
          </button>
          <h2 className="text-xl font-bold text-gray-800">Checkout</h2>
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="p-6 md:w-1/2 border-r">
            <img
              src={product.image}
              alt={product.name}
              className="rounded-lg object-contain h-64 w-full"
            />
            <h3 className="text-2xl font-semibold mt-4 text-gray-800">{product.name}</h3>
            <p className="text-gray-500">
              Variation: <strong>{variation}</strong>
            </p>
            <p className="text-gray-700 mt-2 font-semibold text-lg">
              Price: ₱{product.price.toLocaleString()}
            </p>
          </div>

          <div className="p-6 md:w-1/2 space-y-4">
            <div>
              <h4 className="text-gray-700 font-medium">Shipping Info</h4>
              <p className="text-sm text-gray-600">Region: <strong>{region}</strong></p>
              <p className="text-sm text-gray-600">City: <strong>{city}</strong></p>
              <p className="text-sm text-gray-600">Shipping Fee: ₱{shippingFee}</p>
            </div>

            <div className="mt-4 border-t pt-4">
              <h4 className="text-gray-700 font-medium mb-2">Order Summary</h4>
              <div className="flex justify-between text-gray-600">
                <span>Item Price</span>
                <span>₱{product.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping Fee</span>
                <span>₱{shippingFee}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2 text-gray-900">
                <span>Total</span>
                <span>₱{totalCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
              >
                <ShoppingCart className="inline mr-2" /> Add to Cart
              </button>
              <button
                onClick={handlePlaceOrder}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
              >
                <ShoppingBag className="inline mr-2" /> Place Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
