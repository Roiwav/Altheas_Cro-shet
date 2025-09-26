import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Smartphone, QrCode, X, Maximize2, Minimize2, Save, ShoppingCart, Check } from 'lucide-react';

// Lazy load AR components
const ARViewer = lazy(() => import('../../components/ar/ARViewer'));
const FlowerTypeSelector = lazy(() => import('../../components/ar/FlowerTypeSelector'));
const ColorSelector = lazy(() => import('../../components/ar/ColorSelector'));
const ArrangementSelector = lazy(() => import('../../components/ar/ArrangementSelector'));
const QRCodeDisplay = lazy(() => import('../../components/ar/QRCodeDisplay'));

const defaultColors = {
  rose: '#ff69b4',
  tulip: '#ff8c00',
  sunflower: '#ffd700',
  lily: '#ffffff',
  carnation: '#ffc0cb',
  peony: '#ffb6c1',
};

const FLOWER_PRICES = {
  rose: { single: 150, bouquet: 1500 },
  tulip: { single: 120, bouquet: 1200 },
  sunflower: { single: 180, bouquet: 1800 },
  lily: { single: 160, bouquet: 1600 },
  carnation: { single: 100, bouquet: 1000 },
  peony: { single: 250, bouquet: 2500 },
};

const ARPage = () => {
  const { type: initialType } = useParams();
  const navigate = useNavigate();
  const [flowerType, setFlowerType] = useState(initialType || 'rose');
  const [arrangement, setArrangement] = useState('single');
  const [color, setColor] = useState(defaultColors[flowerType] || '#ff69b4');
  const [price, setPrice] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Handle save as draft
  const handleSaveDraft = useCallback(() => {
    const draft = { flowerType, color, arrangement, savedAt: new Date().toISOString() };
    localStorage.setItem('flowerDraft', JSON.stringify(draft));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  }, [flowerType, color, arrangement]);

  // Handle generate QR code
  const handleGenerateQR = useCallback(() => {
    setShowQR(true);
    handleSaveDraft();
  }, [handleSaveDraft]);

  // Handle place order
  const handlePlaceOrder = useCallback(() => {
    handleSaveDraft();
    navigate('/checkout', { state: { flowerType, color, arrangement, price } });
  }, [flowerType, color, arrangement, price, handleSaveDraft, navigate]);

  // Calculate price when flower type or arrangement changes
  useEffect(() => {
    const prices = FLOWER_PRICES[flowerType] || { single: 0, bouquet: 0 };
    setPrice(prices[arrangement] || 0);
  }, [flowerType, arrangement]);

  const currencyFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 lg:ml-[var(--sidebar-width,5rem)] pt-16 pb-28 lg:pb-0 transition-all duration-300 ease-in-out">
      {/* The Navbar and Sidebar are now provided by the main Layout component */}
      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Flower Customizer
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Create and visualize your perfect crochet flower in AR.
          </p>
        </div>

        {isSaved && (
          <div className="mb-4 py-1.5 px-4 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg text-sm flex items-center justify-center space-x-2">
            <Check className="w-4 h-4" />
            <span>Your design has been saved!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main AR Viewer */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Your Custom Flower</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Drag to rotate • Scroll to zoom • Pinch to zoom on mobile</p>
            </div>
            
            <div className="relative w-full h-[50vh] lg:h-[500px] bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center">
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading 3D model...</p>
                </div>
              }>
                <ARViewer 
                  flowerType={flowerType}
                  color={color}
                  className="w-full h-full"
                />
              </Suspense>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Customization</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Personalize your flower design</p>
            </div>
            
            <div className="p-5 space-y-6">
              {/* Flower Type Selection */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Flower Type</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Choose your preferred flower style</p>
                <Suspense fallback={
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Choose single stem or a full bouquet</p>
                <Suspense fallback={
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                }>
                  <ArrangementSelector selectedArrangement={arrangement} onSelect={setArrangement} />
                </Suspense>
              </div>

              {/* Color Picker */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select your favorite color</p>
                <Suspense fallback={
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                }>
                  <ColorSelector
                    selectedColor={color}
                    onSelect={setColor}
                  />
                </Suspense>
              </div>
              
              {/* Price Display */}
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Total Price:</h3>
                <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {currencyFormatter.format(price)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-6 border-t border-gray-100 dark:border-gray-700 space-y-3 hidden lg:block">
                <button
                  onClick={handleGenerateQR}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Generate QR Code
                </button>
                
                <button
                  onClick={handlePlaceOrder}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Place Order Now
                </button>
                
                <button
                  onClick={handleSaveDraft}
                  className="w-full flex items-center justify-center px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 font-medium rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </button>
              </div>
            </div>
            
            {/* Design Tips */}
            <div className="p-5 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Design Tips</h3>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
                <li className="flex items-start">
                  <svg className="h-3.5 w-3.5 text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Try different color combinations for unique looks</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-3.5 w-3.5 text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Save your favorite designs to your account</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Footer for Mobile Actions */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-3 z-40">
        <div className="container mx-auto flex items-center justify-center space-x-3">
          <button
            onClick={handleGenerateQR}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg shadow-md transition-all"
          >
            <QrCode className="w-5 h-5 mr-2" />
            <span>View in AR</span>
          </button>
          <button
            onClick={handlePlaceOrder}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg shadow-md transition-all"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            <span>Order Now</span>
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md relative"
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">View in Augmented Reality</h3>
                <button 
                  onClick={() => setShowQR(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6">
                <Suspense fallback={
                  <div className="h-64 w-64 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Preparing QR Code...</p>
                    </div>
                  </div>
                }>
                  <QRCodeDisplay 
                    flowerType={flowerType}
                    color={color}
                    className="w-full"
                  />
                </Suspense>
                
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    How to view in AR
                  </h4>
                  <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1.5 list-decimal list-inside">
                    <li>Open your phone's camera app</li>
                    <li>Point it at the QR code</li>
                    <li>Tap the notification to open in AR</li>
                    <li>Allow camera access when prompted</li>
                  </ol>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowQR(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
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

export default ARPage;
