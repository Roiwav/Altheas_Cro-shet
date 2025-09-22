// src/pages/main/ShopPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaThLarge, FaList, FaShoppingCart } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import productList from "../../data/productList";
import productImages from "../../assets/images/productImages.js";
import { useCart } from "../../context/CartContext.jsx";

// Currency formatter
const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

// Regions & Shipping
const regions = {
  "Metro Manila": ["Manila", "Quezon City"],
  "South Luzon": ["Calamba City", "Batangas City"],
  "North Luzon": ["Baguio", "Dagupan"],
  Visayas: ["Cebu City", "Iloilo City"],
  Mindanao: ["Davao City", "Cagayan de Oro"],
};
const shippingFees = {
  Manila: 25,
  "Quezon City": 20,
  "Calamba City": 36,
  "Batangas City": 30,
  Baguio: 35,
  Dagupan: 32,
  "Cebu City": 28,
  "Iloilo City": 30,
  "Davao City": 34,
  "Cagayan de Oro": 33,
};

const defaultRegion = "South Luzon";
const defaultCity = "Calamba City";

// Placeholder image
const placeholderImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>Image not available</text></svg>";

export default function ShopPage() {
  const navigate = useNavigate();
  const { addToCart, saveCartForUser, setRegion, setCity, setShippingFee } = useCart();

  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // ✅ Use CartContext state for region and city
  const [localRegion, setLocalRegion] = useState(defaultRegion);
  const [localCity, setLocalCity] = useState(defaultCity);

  useEffect(() => window.scrollTo(0, 0), []);

  // ✅ Add useEffect to sync local state with CartContext
  useEffect(() => {
    setRegion(localRegion);
  }, [localRegion, setRegion]);

  useEffect(() => {
    const fee = shippingFees[localCity] || 0;
    setCity(localCity);
    setShippingFee(fee);
  }, [localCity, setCity, setShippingFee]);
  
  const itemsPerPage = 20;
  const paginatedProducts = productList.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(productList.length / itemsPerPage);

  const getImageSrc = (product) => {
    if (!product) return placeholderImage;
    const id = product.productId || product.id;
    if (id && productImages[id]) return productImages[id];
    if (typeof product.image === "string" && product.image.startsWith("http")) {
      return product.image;
    }
    return placeholderImage;
  };

  const handleAddToCart = async (product) => {
    if (!product) return;
    try {
      await addToCart(product, 1);
      if (saveCartForUser) {
        await saveCartForUser(); // ensure backend sync
      }
      toast.success(`${product.name} added to cart!`);
      setSelectedProduct(null);
    } catch (err) {
      toast.error("Failed to add to cart.");
      console.error(err);
    }
  };

  const handleBuyNow = (product) => {
    if (!product) return;
    const fee = shippingFees[localCity] || 0;
    // ✅ Pass the local state to Checkout
    navigate("/checkout", { state: { product, region: localRegion, city: localCity, shippingFee: fee } });
    setSelectedProduct(null);
  };

  return (
    <>
      {/* The Navbar and Sidebar are now provided by the main Layout component */}
      <main className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen lg:pl-20 pt-16 px-6 md:px-20">
        {/* View & Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <div className="flex gap-3 mb-4 sm:mb-0">
            {[
              { Icon: FaThLarge, label: "Grid", value: "grid" },
              { Icon: FaList, label: "List", value: "list" },
            ].map(({ Icon, label, value }) => (
              <button
                key={value}
                onClick={() => setView(value)}
                className={`px-4 py-2 flex items-center gap-2 rounded-full border transition ${
                  view === value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-gray-600 font-semibold">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        {/* Products */}
        <motion.div
          layout
          className={`grid ${view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "grid-cols-1 gap-10"}`}
        >
          <AnimatePresence>
            {paginatedProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`relative group border p-4 rounded-xl bg-white shadow-sm hover:shadow-xl transition-all ${
                  view === "list" ? "flex flex-col md:flex-row gap-6" : ""
                }`}
              >
                <img
                  src={getImageSrc(product)}
                  alt={product.name}
                  className={`rounded-xl ${view === "list" ? "w-full md:w-1/3 h-72 object-contain" : "w-full h-48 object-cover mb-4"}`}
                />
                <div className={`${view === "list" ? "md:w-2/3 space-y-4" : "space-y-2"}`}>
                  <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
                  {view === "list" && <p className="text-gray-600">{product.description}</p>}
                  <p className="text-lg text-blue-700 font-semibold">{currencyFormatter.format(product.price)}</p>
                </div>
                {view === "grid" && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setSelectedProduct(product)}
                    className="absolute bottom-3 right-3 bg-black text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaShoppingCart />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl overflow-hidden w-[95%] max-w-4xl shadow-2xl flex flex-col md:flex-row relative"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="bg-gray-100 p-6 flex items-center justify-center md:w-1/2">
                <img
                  src={getImageSrc(selectedProduct)}
                  alt={selectedProduct.name}
                  className="object-contain h-64 md:h-[400px]"
                />
              </div>

              <div className="p-6 md:w-1/2 space-y-6 flex flex-col justify-between bg-white">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{selectedProduct.name}</h2>
                  <p className="text-2xl text-red-600 font-bold mt-3">
                    {currencyFormatter.format(selectedProduct.price)}
                  </p>
                </div>

                <div className="border-y py-4 space-y-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-700 block">Region</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={localRegion} // ✅ Use local state
                      onChange={(e) => {
                        setLocalRegion(e.target.value); // ✅ Update local state
                        setLocalCity(regions[e.target.value][0]); // ✅ Update local state
                      }}
                    >
                      {Object.keys(regions).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 block">City</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={localCity} // ✅ Use local state
                      onChange={(e) => setLocalCity(e.target.value)} // ✅ Update local state
                    >
                      {regions[localRegion].map((c) => ( // ✅ Use local state
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-600">Shipping Fee:</span>
                    <span className="text-gray-900 font-semibold">₱{shippingFees[localCity] || 0}</span> {/* ✅ Use local state */}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleAddToCart(selectedProduct)}
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold text-lg hover:bg-orange-600 transition"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => handleBuyNow(selectedProduct)}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-red-700 transition"
                  >
                    Buy Now
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}