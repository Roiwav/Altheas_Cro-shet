// src/pages/main/ShopPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaThLarge, FaList, FaShoppingCart, FaSearch } from "react-icons/fa";
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
  const {
    addToCart,
    totalQuantity,
    region,
    city,
    setRegion,
    setCity,
    setShippingFee,
  } = useCart();

  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // ✅ Use CartContext state for region and city
  const [localRegion, setLocalRegion] = useState(defaultRegion);
  const [localCity, setLocalCity] = useState(defaultCity);

  useEffect(() => window.scrollTo(0, 0), []);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // ✅ Add useEffect to sync local state with CartContext
  useEffect(() => {
    setRegion(localRegion);
  }, [localRegion, setRegion]);

  useEffect(() => {
    const fee = shippingFees[localCity] || 0;
    setCity(localCity);
    setShippingFee(fee);
  }, [localCity, setCity, setShippingFee]);
  
  // Filter products based on search query
  const filteredProducts = productList.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const itemsPerPage = 20;
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Get product image safely
  const getImageSrc = (product) => {
    if (productImages?.[product.id]) return productImages[product.id];
    if (productImages?.[String(product.id)]) return productImages[String(product.id)];
    if (product.image && typeof product.image === "string") return product.image;
    return placeholderImage;
  };

  // Handle Add to Cart (wait for backend sync if user is logged in)
  const handleAddToCart = async (product) => {
    if (!product) return;
    try {
      // addToCart already handles saving the cart to the backend
      await addToCart(product, 1);
      toast.success(`${product.name} added to cart!`);
      setSelectedProduct(null);
    } catch (err) {
      toast.error("Failed to add to cart.");
      console.error(err);
    }
  };

  // Handle Buy Now
  const handleBuyNow = (product) => {
    if (!product) return;
    const shippingFee = shippingFees[localCity] || 0;
    // Pass all necessary info in the product object for the checkout page
    const productForCheckout = { ...product, shippingFee, region: localRegion, city: localCity };
    navigate("/checkout", { state: { product: productForCheckout } });
    setSelectedProduct(null);
  };

  return (
    <>
      {/* The Navbar and Sidebar are now provided by the main Layout component */}
      <main className="relative z-10 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen pt-16 px-6 md:px-20 pb-16 lg:ml-[var(--sidebar-width,5rem)] transition-all duration-300 ease-in-out">
        {/* View, Search & Pagination */}
        <div className="flex flex-col sm:flex-row justify-end items-center mb-8 gap-4 flex-wrap">
          {/* Search Bar */}
          <div className="relative w-full sm:w-auto">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for flowers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80 px-4 py-2 pl-12 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>

        </div>

        {/* Products */}
        <motion.div
          layout
          className="grid grid-cols-1 gap-10"
        >
          <AnimatePresence>
            {paginatedProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
                className="relative group border p-4 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row gap-6"
              >
                <motion.img
                  layout
                  src={getImageSrc(product)}
                  alt={product.name}
                  className="rounded-lg flex-shrink-0 w-full md:w-1/3 h-72 object-contain bg-gray-100 dark:bg-gray-700"
                />
                <motion.div layout className="md:w-2/3 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{product.name}</h3>
                  <p className="text-lg text-blue-700 dark:text-blue-400 font-semibold">{currencyFormatter.format(product.price)}</p>
                  <AnimatePresence initial={false}>
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: "0.5rem" }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="text-gray-600 dark:text-gray-300 flex-grow"
                    >
                      {product.description}
                    </motion.p>
                  </AnimatePresence>
                  <AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-4 mt-auto">
                      <button onClick={() => setSelectedProduct(product)} className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                        <FaShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </button>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {paginatedProducts.length === 0 && searchQuery && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">No Products Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Your search for "{searchQuery}" did not match any products.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center md:justify-end mt-16">
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 hover:bg-gray-300 disabled:opacity-40 transition-opacity"
              >
                Previous
              </button>
              <span className="text-gray-600 dark:text-gray-400 font-semibold">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-opacity"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden w-[95%] max-w-4xl shadow-2xl flex flex-col md:flex-row relative"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="bg-gray-100 dark:bg-gray-700 p-6 flex items-center justify-center md:w-1/2">
                <img
                  src={getImageSrc(selectedProduct)}
                  alt={selectedProduct.name}
                  className="object-contain h-64 md:h-[400px]"
                />
              </div>

              <div className="p-6 md:w-1/2 space-y-6 flex flex-col justify-between bg-white dark:bg-gray-800">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{selectedProduct.name}</h2>
                  <p className="text-2xl text-red-600 dark:text-red-500 font-bold mt-3">
                    {currencyFormatter.format(selectedProduct.price)}
                  </p>
                </div>

                <div className="border-y py-4 space-y-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300 block">Region</label>
                    <select
                      className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      value={localRegion} // ✅ Use local state
                      onChange={(e) => {
                        setLocalRegion(e.target.value);
                        setLocalCity(regions[e.target.value][0]);
                      }}
                    >
                      {Object.keys(regions).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300 block">City</label>
                    <select
                      className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      value={localCity} // ✅ Use local state
                      onChange={(e) => setLocalCity(e.target.value)} // ✅ Update local state
                    >
                      {regions[localRegion].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-600 dark:text-gray-400">Shipping Fee:</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{currencyFormatter.format(shippingFees[localCity] || 0)}</span>
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
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl font-bold"
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
