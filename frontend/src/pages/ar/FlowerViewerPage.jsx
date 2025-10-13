import React, { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../hooks/useUser';
import { QrCode, X, ShoppingCart, Check, Plus, Minus, Info, Loader2 } from 'lucide-react';
import { useCart } from '../../context/cart-context.js';
import { toast } from 'react-toastify';

// Lazy load AR components for better initial page load performance.
const ARViewer = lazy(() => import('../../components/ar/ARViewer'));
const FlowerTypeSelector = lazy(() => import('../../components/ar/FlowerTypeSelector'));
const ColorSelector = lazy(() => import('../../components/ar/ColorSelector'));
const ArrangementSelector = lazy(() => import('../../components/ar/ArrangementSelector'));
const QRCodeDisplay = lazy(() => import('../../components/ar/QRCodeDisplay'));

// Default starting color for each flower type.
const defaultColors = {
  rose: '#FFFFFF',
  tulip: '#FFFFFF',
  sunflower: '#FFFFFF',
  lily: '#FFFFFF',
  carnation: '#FFFFFF',
  peony: '#FFFFFF',
};

// Map hex colors to human-readable names for display purposes (e.g., in order summary).
const COLOR_NAMES = {
  "#ff69b4": "Hot Pink",
  "#ff0000": "Red",
  "#ff8c00": "Dark Orange",
  "#ffd700": "Gold",
  "#32cd32": "Lime Green",
  "#1e90ff": "Dodger Blue",
  "#8a2be2": "Blue Violet",
  "#ffffff": "White",
};

// Pricing structure for each flower type and arrangement.
const FLOWER_PRICES = {
  rose: { single: 150, bouquet: 1500 },
  tulip: { single: 120, bouquet: 1200 },
  sunflower: { single: 180, bouquet: 1800 },
  lily: { single: 160, bouquet: 1600 },
  carnation: { single: 100, bouquet: 1000 },
  peony: { single: 250, bouquet: 2500 },
};

/**
 * The main page for customizing and viewing crochet flowers.
 * It integrates a 3D/AR viewer with various selection controls, allowing users
 * to create a custom product, view it in AR, add it to the cart, or place an order directly.
 */
const FlowerViewerPage = () => {
  // Hooks for routing and user authentication context.
  const { type: initialType } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  const { addToCart } = useCart();

  // State management for flower customization.
  const [flowerType, setFlowerType] = useState(initialType || 'rose');
  const [arrangement, setArrangement] = useState('single');
  const [color, setColor] = useState('#FFFFFF');
  const [flowerCount, setFlowerCount] = useState(3); // bouquet flower count
  const [totalPrice, setTotalPrice] = useState(0);
  const [showQR, setShowQR] = useState(false); // QR code modal
  const [quantity, setQuantity] = useState(1); // Quantity of the custom item
  const [loading, setLoading] = useState(false); // Loading state to prevent race conditions on screenshot capture.

  // Separate refs for desktop and mobile AR viewers to avoid conflicts.
  const desktopArViewerRef = useRef(null);
  const mobileArViewerRef = useRef(null);

  // State to force remounting the Canvas on WebGL context loss.
  const [canvasKey, setCanvasKey] = useState(Date.now());

  // Memoized callback to show the QR code modal.
  const handleGenerateQR = useCallback(() => {
    setShowQR(true);
  }, []);

  /**
   * Helper to get the correct AR viewer ref based on screen size.
   * This is crucial because there are two separate ARViewer instances for responsive design.
   * @returns {React.RefObject} The ref for the currently active AR viewer.
   */
  const getActiveArViewerRef = useCallback(() => {
    // Check if we're on mobile view (window width < 1024px for lg breakpoint)
    const isMobile = window.innerWidth < 1024;
    return isMobile ? mobileArViewerRef : desktopArViewerRef;
  }, []);

  /**
   * Creates a product object representing the current customization.
   * It captures a screenshot from the active 3D viewer to use as the product image.
   */
  const createProductObject = useCallback(async () => {
    const activeRef = getActiveArViewerRef();
    console.log('Creating product object - activeRef.current:', activeRef.current);
    
    const pricePerItem = FLOWER_PRICES[flowerType]?.[arrangement] || 0;
    const colorName = COLOR_NAMES[color.toLowerCase()] || 'Custom';
    const image = activeRef.current ? await activeRef.current.captureScreenshot() : '/images/placeholder-flower.png';

    const productObj = {
      productId: `custom-${flowerType}-${arrangement}-${color.replace('#', '')}`,
      name: `${flowerType.charAt(0).toUpperCase() + flowerType.slice(1)} (${arrangement})`,
      price: pricePerItem,
      quantity: quantity,
      color: colorName,
      image: image,
      variation: arrangement, // 'single' or 'bouquet'
    };
    console.log('[DEBUG custom product object]', productObj);
    return productObj;
  }, [flowerType, arrangement, color, quantity, getActiveArViewerRef]);

  /**
   * Handles placing a direct order for the custom product.
   * Navigates to the checkout page with the product details.
   */
  const handlePlaceOrder = useCallback(async () => {
    const product = await createProductObject();
    const productForCheckout = {
      ...product,
      shippingFee: 0,
      shippingAddress: null,
    };

    navigate('/checkout', {
      state: { product: productForCheckout }
    });
  }, [createProductObject, navigate]);

  /**
   * Handles adding the customized item to the shopping cart.
   * Uses the `useCart` context to perform the action.
   */
  const handleAddToCart = useCallback(async () => {
    const activeRef = getActiveArViewerRef();
    console.log('handleAddToCart called - activeRef.current:', activeRef.current);
    
    const productToAdd = await createProductObject();
    console.log('[DEBUG handleAddToCart productToAdd]', productToAdd);
    try {
      await addToCart(productToAdd);
    } catch (error) {
      toast.error("Failed to add item to cart.");
      console.error("Add to cart error:", error);
    }
  }, [createProductObject, addToCart, getActiveArViewerRef]);

  // Effect to scroll to the top of the page when the component mounts.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /**
   * Effect to manage a brief loading state when customization changes.
   * This helps prevent race conditions when capturing a screenshot, ensuring the 3D model
   * has finished updating before the user can add to cart or place an order.
   */
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [flowerType, arrangement, color]);

  /**
   * Effect to recalculate the total price whenever the flower type,
   * arrangement, or quantity changes.
   */
  useEffect(() => {
    const prices = FLOWER_PRICES[flowerType] || { single: 0, bouquet: 0 };
    let basePrice = arrangement === 'bouquet' ? prices.bouquet : prices.single;
    setTotalPrice(basePrice * quantity);
  }, [flowerType, arrangement, flowerCount, quantity]);

  // Effect to reset the color to white whenever the flower type changes.
  useEffect(() => {
    setColor(defaultColors[flowerType] || '#FFFFFF');
  }, [flowerType]);

  // Memoized formatter for displaying currency in Philippine Peso.
  const currencyFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-16 transition-all duration-300 ease-in-out ${isAuthenticated ? 'lg:ml-[var(--sidebar-width,5rem)]' : ''}`}>
      {/* DESKTOP LAYOUT */}
      <main className={`hidden lg:block px-4 py-6 md:px-6 lg:px-8 ${isAuthenticated ? 'container mx-auto' : ''}`}>
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl lg:text-5xl dark:text-white">
            Flower Customizer
          </h1>
          <p className="max-w-2xl mx-auto mt-2 text-lg text-gray-600 dark:text-gray-300">
            Create and visualize your perfect crochet flower in AR.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 mx-auto lg:grid-cols-2 xl:grid-cols-5 xl:max-w-7xl">
          {/* 3D Model Viewer Section */}
          <div className="overflow-hidden bg-white border border-gray-200 shadow-lg xl:col-span-3 dark:bg-gray-800 rounded-xl dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 md:p-5 dark:border-gray-700">
              <h2 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">Your Custom Flower</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag to rotate • Scroll to zoom • Pinch to zoom on mobile
              </p>
            </div>
            <div
              className="relative flex items-center justify-center w-full overflow-hidden bg-gray-50 dark:bg-gray-900/50"
              style={{
                height: 'clamp(600px, 100vh, 800px)',
                minHeight: '300px',
                maxHeight: '600px',
                minWidth: 0,
              }}>
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading 3D model...</p>
                </div>
              }>
                <ARViewer
                  key={`desktop-${canvasKey}`}
                  ref={desktopArViewerRef}
                  flowerType={flowerType}
                  color={color}
                  arrangement={arrangement}
                />
              </Suspense>
            </div>
          </div>
          {/* Customization Controls Panel */}
          <div className="overflow-hidden bg-white border border-gray-200 shadow-lg xl:col-span-2 dark:bg-gray-800 rounded-xl dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 md:p-5 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Customization</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Personalize your flower design</p>
            </div>
            <div className="p-4 space-y-4 md:p-5 lg:space-y-5">
              {/* Flower Type Selection */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Flower Type</h3>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Choose your preferred flower style</p>
                <Suspense fallback={
                  <div className="h-10 bg-gray-100 rounded-lg dark:bg-gray-700 animate-pulse"></div>
                }>
                  <FlowerTypeSelector
                    selectedType={flowerType}
                    onSelect={setFlowerType}
                  />
                </Suspense>
              </div>
              {/* Arrangement Selection */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Arrangement</h3>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Choose single stem or a full bouquet</p>
                <Suspense fallback={
                  <div className="h-10 bg-gray-100 rounded-lg dark:bg-gray-700 animate-pulse"></div>
                }>
                  <ArrangementSelector selectedArrangement={arrangement} onSelect={setArrangement} />
                </Suspense>
              </div>
              {/* Animated container for bouquet-specific controls. */}
              <AnimatePresence>
                {arrangement === 'bouquet' && (
                  <Motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1 overflow-hidden"
                  >
                  {/* Add bouquet controls here if needed */}
                  </Motion.div>
                )}
              </AnimatePresence>
              {/* Color Picker */}
              <div className="space-y-1">
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Select a color for the petals</p>
                <Suspense fallback={
                  <div className="h-10 bg-gray-100 rounded-lg dark:bg-gray-700 animate-pulse"></div>
                }>
                  <ColorSelector
                    label="Flower Color"
                    selectedColor={color}
                    onSelect={setColor}
                  />
                </Suspense>
              </div>
              {/* Quantity Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-1 text-gray-600 bg-gray-100 rounded-full dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 font-semibold text-center text-gray-800 dark:text-gray-100">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="p-1 text-gray-600 bg-gray-100 rounded-full dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              {/* Price Display for Desktop */}
              <div className="items-center justify-between hidden pt-4 mt-4 border-t border-gray-200 lg:flex lg:pt-5 lg:mt-5 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Total Price:</h3>
                <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {currencyFormatter.format(totalPrice)}
                </span>
              </div>
              {/* Action Buttons for Desktop */}
              <div className="pt-5 mt-5 space-y-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleGenerateQR}
                  className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-lg"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  View in AR
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={loading}
                  className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
                  Add to Cart
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                  Place Order Now
                </button>
              </div>
            </div>
            {/* A small section with design tips for the user. */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 dark:bg-gray-700/30 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Design Notes</h3>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
                <li className="flex items-start">
                  <svg className="h-3.5 w-3.5 text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Try different color combinations for unique looks</span>
                </li>
                <li className="flex items-start">
                  <Info className="h-3.5 w-3.5 text-blue-500 mr-1.5 mt-0.5 flex-shrink-0" />
                  <span>Actual product color may vary slightly due to lighting and material availability.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      {/* MOBILE LAYOUT */}
      <div className="w-full lg:hidden">
        {/* 3D Viewer */}
        <div className="relative w-full h-[60vh] max-h-[450px] bg-gray-100 dark:bg-gray-900/50">
          <Suspense fallback={
            <div className="grid w-full h-full place-items-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading 3D model...</p>
              </div>
            </div>
          }>
            <ARViewer 
              key={`mobile-${canvasKey}`} 
              ref={mobileArViewerRef} 
              flowerType={flowerType} 
              color={color} 
              arrangement={arrangement} 
            />
          </Suspense>
          <div className="absolute bottom-0 left-0 right-0 p-2 text-center bg-black/40 backdrop-blur-sm">
            <p className="text-xs text-white/90">
              Drag to rotate • Pinch to zoom
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-6 sm:p-6">
          {/* Product Info */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize dark:text-white">{flowerType} {arrangement}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Handcrafted Crochet Flower</p>
            </div>
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{currencyFormatter.format(totalPrice)}</p>
          </div>

          {/* Customization Options */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Flower Type</h3>
              <Suspense fallback={<div className="h-24 bg-gray-100 rounded-lg dark:bg-gray-700 animate-pulse"></div>}>
                <FlowerTypeSelector selectedType={flowerType} onSelect={setFlowerType} />
              </Suspense>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Arrangement</h3>
              <Suspense fallback={<div className="h-20 bg-gray-100 rounded-lg dark:bg-gray-700 animate-pulse"></div>}>
                <ArrangementSelector selectedArrangement={arrangement} onSelect={setArrangement} />
              </Suspense>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Flower Color</h3>
              <Suspense fallback={<div className="h-16 bg-gray-100 rounded-lg dark:bg-gray-700 animate-pulse"></div>}>
                <ColorSelector selectedColor={color} onSelect={setColor} />
              </Suspense>
            </div>
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-1.5 text-gray-600 bg-gray-100 rounded-full dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 font-semibold text-center text-gray-800 dark:text-gray-100">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="p-1.5 text-gray-600 bg-gray-100 rounded-full dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Disclaimer Note */}
          <div className="p-3 text-center border border-blue-100 rounded-lg bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Please Note:</strong> Actual product color may vary slightly from the digital model due to lighting and material availability.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 mt-6 space-y-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleGenerateQR}
              className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-lg"
            >
              <QrCode className="w-5 h-5 mr-2" /> View in AR
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddToCart}
                disabled={loading}
                className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                <span className="ml-2">Add to Cart</span>
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                <span className="ml-2">Place Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Modal for displaying the QR code */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative flex flex-col w-full max-w-md bg-white shadow-2xl dark:bg-gray-800 rounded-2xl max-h-[90vh]"
            >
              <div className="flex items-center justify-between flex-shrink-0 p-4 border-b border-gray-100 sm:p-5 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">View in Augmented Reality</h3>
                <button
                  onClick={() => setShowQR(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-grow p-4 overflow-y-auto sm:p-6">
                {/* Suspense for QRCodeDisplay */}
                <Suspense fallback={
                  <div className="flex items-center justify-center w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-xl">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 mb-3 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Preparing QR Code...</p>
                    </div>
                  </div>
                }>
                  <QRCodeDisplay
                    flowerType={flowerType}
                    color={color}
                    arrangement={arrangement}
                    className="w-full"
                  />
                </Suspense>
                <div className="p-4 mt-6 border border-blue-100 rounded-lg bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800">
                  <h4 className="flex items-center mb-2 font-medium text-blue-800 dark:text-blue-200">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    How to view in AR
                  </h4>
                  <ol className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-1.5 list-decimal list-inside">
                    <li>Open your phone's camera app</li>
                    <li>Point it at the QR code</li>
                    <li>Tap the button to open in AR</li>
                    <li>Allow camera access when prompted</li>
                  </ol>
                </div>
              </div>
              <div className="flex justify-end flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                <button
                  onClick={() => setShowQR(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlowerViewerPage;
