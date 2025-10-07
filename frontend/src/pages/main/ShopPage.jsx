// src/pages/main/ShopPage.jsx (UPDATED - guest cart checkout redirect to signup)
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaThLarge, FaList, FaShoppingCart, FaSearch } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// import productList from "../../data/productList";
import productImages from "../../assets/images/productImages.js";
import { useCart } from "../../hooks/useCart";
import { useUser } from "../../context/useUser.js";

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
  "Manila": 25,
  "Quezon City": 20,
  "Calamba City": 36,
  "Batangas City": 30,
  "Baguio": 35,
  "Dagupan": 32,
  "Cebu City": 28,
  "Iloilo City": 30,
  "Davao City": 34,
  "Cagayan de Oro": 33,
};

const defaultRegion = "South Luzon";
const defaultCity = "Calamba City";

// Categories for filtering
const categories = [
  "All",
  "Bouquet",
  "Single Stem",
  "Arrangement",
  "Custom"
];

// Placeholder image
const placeholderImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>Image not available</text></svg>";

export default function ShopPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    addToCart,
    totalQuantity,
    shippingAddress,
    setShippingAddress,
    setShippingFee,
  } = useCart();
  const { user, isAuthenticated } = useUser();

  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("list"); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState("default");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // ✅ Use CartContext state for region and city
  const [localRegion, setLocalRegion] = useState(defaultRegion);
  const [localCity, setLocalCity] = useState(defaultCity);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [selectedVariation, setSelectedVariation] = useState("");
  const [modalQuantity, setModalQuantity] = useState(1);
  const [directCheckoutProduct, setDirectCheckoutProduct] = useState(null);

  const [products, setProducts] = useState([]);


  // This effect sets the initial shipping info when the page loads or user changes.
  useEffect(() => {
    if (isAuthenticated && user?.addresses?.length > 0) {
      const defaultAddress = user.addresses.find(a => a.isDefault) || user.addresses[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setLocalRegion(defaultAddress.state);
        setLocalCity(defaultAddress.city);
      }
    } else {
      // Fallback for guests or users without addresses
      setLocalRegion(defaultRegion);
      setLocalCity(defaultCity);
      setSelectedAddressId("");
    }
  }, [isAuthenticated, user]);

    useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/v1/products");
        const data = await res.json();
        setProducts(data.products || []); // adjust depending on your backend response
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Effect to handle selected product changes, for setting default variation
  useEffect(() => {
    if (selectedProduct && selectedProduct.variations?.length > 0) {
      // Set the first variation as the default when the modal opens
      setSelectedVariation(selectedProduct.variations[0]);
    } else {
      setSelectedVariation("");
    }
    // Reset quantity to 1 whenever the modal opens for a new product
    setModalQuantity(1);
  }, [selectedProduct]);

  // Handle direct checkout from gallery and product modal opening
  useEffect(() => {
    // Check if we're coming from a product click in the gallery
    if (location.state?.openProductModal && location.state?.selectedProduct) {
      const { selectedProduct: productFromState } = location.state;
      
      // Find the matching product in the shop's product list using case-insensitive name comparison
      const productFromList = productList.find(p => {
        const shopProductName = p.name?.trim().toLowerCase() || '';
        const galleryProductName = productFromState.name?.trim().toLowerCase() || '';
        return shopProductName === galleryProductName;
      });
      
      // If we found a matching product in the shop, use it (with the gallery image)
      if (productFromList) {
        setSelectedProduct({
          ...productFromList,
          image: productFromState.image || productFromList.image
        });
      } else {
        // Fallback to the product data from the gallery
        setSelectedProduct(productFromState);
      }
      
      // Clear the navigation state to prevent reopening on refresh
      window.history.replaceState(null, '');
    }
    // Handle direct checkout flow (existing functionality)
    else if (location.state?.showCheckout && location.state?.selectedProduct) {
      setDirectCheckoutProduct({
        ...location.state.selectedProduct,
        quantity: location.state.quantity || 1
      });
      // Clear the state to prevent showing the checkout again on refresh
      window.history.replaceState(null, '');
    }
    
    // Only run this effect when location.state changes
  }, [location.state]);

  useEffect(() => window.scrollTo(0, 0), []);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, selectedCategory]);

  // This useEffect hook syncs the local shipping choices with the CartContext.
  useEffect(() => {
    // The fee is calculated directly in the JSX. This effect's job is to
    // keep the global cart context aware of the shipping details.
    const fee = shippingFees[localCity] || 0;
    let addressToSet;
    if (isAuthenticated && selectedAddressId) {
      addressToSet = user.addresses.find(a => a.id === selectedAddressId);
    } else {
      addressToSet = {
        state: localRegion,
        city: localCity,
        label: "Guest Address",
        line1: "N/A",
        postalCode: "N/A",
        country: "Philippines"
      };
    }

    if (addressToSet) {
      setShippingAddress(addressToSet);
    }
    setShippingFee(fee);
  }, [localRegion, localCity, isAuthenticated, user, selectedAddressId, setShippingAddress, setShippingFee]);
  
  // Filter and sort products
  const processedProducts = React.useMemo(() => {
    let productsToShow = [...products];

    // Filter by category
    if (selectedCategory !== "All") {
      products = products.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.length >= 3) {
      products = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort products
    switch (sortBy) {
      case "price-asc":
        products.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        products.sort((a, b) => b.price - a.price);
        break;
      // Add more sorting options here if needed (e.g., by name)
    }

    return products;
  }, [searchQuery, selectedCategory, sortBy]);

  const itemsPerPage = 20;
  const paginatedProducts = processedProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);

  // Get product image safely
  const getImageSrc = (product) => {
    if (productImages?.[product.id]) return productImages[product.id];
    if (productImages?.[String(product.id)]) return productImages[String(product.id)];
    if (product.image && typeof product.image === "string") return product.image;
    return placeholderImage;
  };

  // Handle Add to Cart (works for both guest and authenticated users)
  const handleAddToCart = async (product) => {
    if (!product) return;
    // Create a product object that includes the selected variation
    const productToAdd = {
      ...product,
      variation: selectedVariation || "", // Ensure variation is always a string
    };

    try {
      // ✅ addToCart works for both guests (saves in cookie) and authenticated users (saves to backend)
      await addToCart(productToAdd, modalQuantity);
      
      setSelectedProduct(null);
    } catch (err) {
      // Only show error toast if something goes wrong
      toast.error("Failed to add to cart.");
      console.error(err);
    }
  };

  // ✅ UPDATED: Handle Buy Now - redirect guests to signup for direct checkout
  const handleBuyNow = () => {
    if (!selectedProduct) return;

    // ✅ NEW: Check if user is authenticated for Buy Now
    if (!isAuthenticated) {
      toast.info("Please sign up to purchase items directly. You can add items to cart as a guest!");
      navigate("/signup", {
        state: { 
          from: "shop-buy-now",
          product: {
            ...selectedProduct,
            variation: selectedVariation || "",
            quantity: modalQuantity
          }
        },
      });
      setSelectedProduct(null);
      return;
    }

    const shippingFee = shippingFees[localCity] || 0;
    let shippingAddress;
    if (isAuthenticated && selectedAddressId) {
      shippingAddress = user.addresses.find(a => a.id === selectedAddressId);
    } else {
      // For guests, create a partial address object that still works
      shippingAddress = {
        state: localRegion,
        city: localCity,
        line1: "N/A", postalCode: "N/A", country: "Philippines"
      };
    }
    // Pass all necessary info in the product object for the checkout page
    // Standardize the object to look like a cart item for consistency
    // This ensures the object structure is identical to items from the cart.
    const productForCheckout = {
      _id: String(selectedProduct.id),
      productId: String(selectedProduct.id),
      name: selectedProduct.name,
      price: selectedProduct.price,
      image: getImageSrc(selectedProduct),
      variation: selectedVariation || "", // Ensure variation is always a string
      quantity: modalQuantity,
      shippingFee,
      shippingAddress,
    };
    navigate("/checkout", { state: { product: productForCheckout } });
    setSelectedProduct(null);
  };

  return (
    <>
      {/* The Navbar and Sidebar are now provided by the main Layout component */}
      <main className={`relative z-10 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen pt-16 pb-16 ${isAuthenticated ? 'px-6 md:px-20 lg:ml-[var(--sidebar-width,5rem)]' : ''} transition-all duration-300 ease-in-out`}>
        {/* ✅ NEW: Guest user info banner */}
        {!isAuthenticated && totalQuantity > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaShoppingCart className="text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    You have {totalQuantity} item(s) in your cart
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Sign up to checkout and save your cart to your account!
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/signup", { state: { from: "shop-cart" } })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* View, Search & Pagination */}
        <div className="flex flex-col flex-wrap items-center justify-between gap-4 mb-8 md:flex-row">
          {/* Left side: Filters */}
          <div className="flex items-center w-full gap-4 md:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 text-gray-900 transition-all bg-white border border-gray-300 rounded-full dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 text-gray-900 transition-all bg-white border border-gray-300 rounded-full dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="default">Sort by: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          {/* Right side: Search and View Toggle */}
          <div className="flex items-center justify-end w-full gap-4 md:w-auto">
            {/* View Toggle */}
            <div className="flex items-center p-1 bg-gray-200 rounded-full dark:bg-gray-700">
              <button onClick={() => setView('list')} className={`p-2 rounded-full transition-colors ${view === 'list' ? 'bg-white dark:bg-gray-900 text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                <FaList />
              </button>
              <button onClick={() => setView('grid')} className={`p-2 rounded-full transition-colors ${view === 'grid' ? 'bg-white dark:bg-gray-900 text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                <FaThLarge />
              </button>
            </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-auto">
            <FaSearch className="absolute text-gray-400 -translate-y-1/2 left-4 top-1/2" />
            <input
              type="text"
              placeholder="Search for flowers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-12 text-gray-900 transition-all bg-white border border-gray-300 rounded-full sm:w-80 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          </div>
        </div>

        {/* Products */}
        <motion.div layout className={`grid ${view === 'grid' ? 'grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
          <AnimatePresence>
            {paginatedProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
                className={`relative group border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all flex overflow-hidden ${view === 'grid' ? 'flex-col' : 'flex-row items-center'}`}
              >
                <div className={`flex-shrink-0 bg-gray-100 dark:bg-gray-700 ${view === 'grid' ? 'h-48 sm:h-64 w-full' : 'w-32 h-32 rounded-full mx-4'}`}>
                  <motion.img
                    layoutId={`product-image-${product.id}`}
                    src={getImageSrc(product)}
                    alt={product.name}
                    className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${view === 'grid' ? 'object-contain' : 'object-cover rounded-full'}`}
                  />
                </div>
                <motion.div layout className="flex flex-col flex-grow p-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{product.name}</h3>
                  <p className="mt-1 text-lg font-semibold text-blue-700 dark:text-blue-400">{currencyFormatter.format(product.price)}</p>
                  
                  {view === 'list' && (
                    <AnimatePresence initial={false}>
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: "0.5rem" }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="flex-grow text-gray-600 dark:text-gray-300"
                      >
                        {product.description}
                      </motion.p>
                    </AnimatePresence>
                  )}

                  {view === 'grid' && (
                     <p className="flex-grow mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {product.description.substring(0, 80)}{product.description.length > 80 && '...'}
                     </p>
                  )}

                  <AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-4 mt-auto">
                      <button onClick={() => setSelectedProduct(product)} className="inline-flex items-center px-4 py-2 text-white transition-colors bg-pink-600 rounded-lg hover:bg-pink-700">
                        <FaShoppingCart className="w-4 h-4 mr-2" />
                    
                      </button>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {paginatedProducts.length === 0 && searchQuery.length >= 3 && (
          <div className="py-20 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">No Products Found</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your search for "{searchQuery}" did not match any products.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-16 md:justify-end">
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 transition-opacity bg-gray-200 rounded-full dark:bg-gray-700 dark:hover:bg-gray-600 hover:bg-gray-300 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-semibold text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 text-white transition-opacity bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-40"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
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
              <div className="flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-700 md:w-1/2">
                <img
                  src={getImageSrc(selectedProduct)}
                  alt={selectedProduct.name}
                  className="object-contain h-64 md:h-[400px]"
                />
              </div>

              <div className="flex flex-col justify-between p-6 space-y-6 bg-white md:w-1/2 dark:bg-gray-800">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 md:text-3xl dark:text-white">{selectedProduct.name}</h2>
                  <p className="mt-3 text-2xl font-bold text-red-600 dark:text-red-500">
                    {currencyFormatter.format(selectedProduct.price)}
                  </p>
                </div>

                <div className="pt-4 space-y-4">
                  {selectedProduct.variations && selectedProduct.variations.length > 0 && (
                    <div>
                      <label htmlFor="variation-select" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Variation
                      </label>
                      <select
                        id="variation-select"
                        value={selectedVariation}
                        onChange={(e) => setSelectedVariation(e.target.value)}
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500"
                      >
                        {selectedProduct.variations.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label htmlFor="quantity-input" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantity
                    </label>
                    <div className="flex items-center">
                      <button
                        onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                        className="px-4 py-2 font-semibold text-gray-700 transition bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg dark:text-gray-300 dark:bg-gray-600 dark:border-gray-500 hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        -
                      </button>
                      <input
                        id="quantity-input"
                        type="number"
                        value={modalQuantity}
                        onChange={(e) => setModalQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-16 py-2 text-center text-gray-900 bg-white border-t border-b border-gray-300 dark:text-white dark:bg-gray-700 dark:border-gray-500 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      />
                      <button
                        onClick={() => setModalQuantity(q => q + 1)}
                        className="px-4 py-2 font-semibold text-gray-700 transition bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg dark:text-gray-300 dark:bg-gray-600 dark:border-gray-500 hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-grow py-4 text-sm text-gray-600 border-y dark:text-gray-300">
                  <p>
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleAddToCart(selectedProduct)}
                    className="flex-1 py-3 text-lg font-semibold text-white transition bg-pink-600 rounded-lg hover:bg-pink-700"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className={`flex-1 py-3 text-lg font-semibold transition border rounded-lg ${
                      isAuthenticated 
                        ? 'text-red-600 bg-transparent border-red-600 hover:bg-red-600 hover:text-white dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400 dark:hover:text-white'
                        : 'text-orange-600 bg-transparent border-orange-600 hover:bg-orange-600 hover:text-white dark:text-orange-400 dark:border-orange-400 dark:hover:bg-orange-400 dark:hover:text-white'
                    }`}
                  >
                    {isAuthenticated ? 'Buy Now' : 'Sign Up to Buy'}
                  </button>
                </div>

                {/* ✅ NEW: Guest user notice for Buy Now */}
                {!isAuthenticated && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-orange-700 dark:text-orange-300 text-sm text-center">
                      Create an account to buy items directly or continue as guest to add to cart!
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute text-2xl font-bold text-gray-400 top-3 right-3 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
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