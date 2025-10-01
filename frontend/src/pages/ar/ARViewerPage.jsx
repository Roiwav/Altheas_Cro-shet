import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X, AlertTriangle, Smartphone, QrCode } from 'lucide-react';

// Lazy load AR components
const QRCodeDisplay = React.lazy(() => import('../../components/ar/QRCodeDisplay'));
const ARViewer = React.lazy(() => import('../../components/ar/ARViewer'));

function ARViewerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Get flower type and color from URL parameters
  const flowerType = searchParams.get('type') || 'rose';
  const arrangement = searchParams.get('arrangement') || 'single';
  const color = '#' + (searchParams.get('color') || 'ff69b4');

  // Check device and WebXR support
  useEffect(() => {
    const checkDeviceAndARSupport = async () => {
      try {
        // Check if mobile device
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
        setIsMobile(isMobileDevice);

        // Check WebXR support
        if (!navigator.xr) {
          throw new Error('WebXR not supported on this device');
        }
        
        // Check AR support
        const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!isSupported) {
          throw new Error('AR not supported on this device');
        }
        
        // Check for required features
        const optionalFeatures = ['dom-overlay'];
        const requiredFeatures = ['hit-test'];
        
        // Test if we can request a session with these features
        try {
          // This is just a test, we'll create a real session later
          const testSession = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures,
            optionalFeatures,
            domOverlay: { root: document.body }
          });
          await testSession.end();
        } catch (err) {
          console.warn('AR feature test failed, falling back to basic AR:', err);
          // Continue with basic AR if some features aren't supported
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('AR initialization error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    checkDeviceAndARSupport();
  }, []);

  const handleExitAR = () => {
    // Try to exit fullscreen first if we're in it
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.warn);
    }
    navigate(-1); // Go back to previous page
  };

  // Request fullscreen when entering AR mode
  useEffect(() => {
    if (!isLoading && !error) {
      const requestFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (err) {
          console.warn('Failed to enter fullscreen:', err);
        }
      };
      
      requestFullscreen();
    }
  }, [isLoading, error]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-white bg-black">
        <div className="max-w-md p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-4 rounded-full border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <h2 className="mb-2 text-xl font-medium">Preparing AR Experience</h2>
          <p className="text-gray-300">This may take a moment...</p>
          {!isMobile && (
            <div className="flex items-start p-3 mt-4 text-yellow-300 bg-yellow-500 rounded-lg bg-opacity-20">
              <AlertTriangle className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
              <span>For best results, please use a mobile device with AR support.</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If on desktop, show a QR code to continue on mobile
  if (!isMobile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 text-white bg-gray-900">
        <div className="w-full max-w-md text-center bg-gray-800 shadow-2xl rounded-2xl">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 text-pink-400 bg-pink-500 rounded-full bg-opacity-20">
              <Smartphone className="w-8 h-8" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Continue on Your Phone</h2>
            <p className="text-gray-300">Scan the QR code with your mobile device to view the flower in Augmented Reality.</p>
          </div>
          
          <div className="p-6">
            <Suspense fallback={
              <div className="flex items-center justify-center w-full h-64 bg-gray-700 rounded-xl">
                <div className="w-10 h-10 border-4 rounded-full border-t-pink-500 animate-spin"></div>
              </div>
            }>
              <QRCodeDisplay
                flowerType={flowerType}
                color={color.substring(1)} // Remove '#' from color
                arrangement={arrangement}
                className="w-full"
              />
            </Suspense>
          </div>

          <div className="p-6 border-t border-gray-700">
            <button
              onClick={handleExitAR}
              className="w-full px-6 py-3 font-medium transition-colors bg-pink-600 rounded-full hover:bg-pink-700"
            >
              Go Back to Customizer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 text-white bg-black">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-500 rounded-full bg-opacity-20">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="mb-3 text-2xl font-bold">AR Not Available</h2>
          <p className="mb-6 text-gray-300">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleExitAR}
              className="w-full px-6 py-3 font-medium transition-colors bg-pink-600 rounded-full hover:bg-pink-700"
            >
              Go Back
            </button>
            {!isMobile && (
              <p className="mt-4 text-sm text-gray-400">
                Try opening this page on a mobile device with AR support for the full experience.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* AR Viewport */}
      <div className="absolute inset-0">
        <Suspense fallback={
          <div className="flex items-center justify-center w-full h-full text-white bg-black">
            <div className="w-12 h-12 border-4 rounded-full border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
        }>
          <ARViewer 
            flowerType={flowerType} 
            color={color} 
            arrangement={arrangement}
            isAREnabled={true}
            className="ar-viewer"
          />
        </Suspense>
      </div>
      
      {/* AR Controls */}
      <div className="absolute z-10 flex flex-col space-y-3 top-4 right-4">
        <button
          onClick={handleExitAR}
          className="flex items-center justify-center w-12 h-12 text-white transition-all bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 backdrop-blur-sm"
          aria-label="Exit AR"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* AR Prompt */}
      <div className="absolute left-0 right-0 max-w-xs px-4 py-2 mx-auto text-sm text-center text-white bg-black bg-opacity-50 rounded-full bottom-8">
        Move your device to view the flower in your space
      </div>
    </div>
  );
}

export default ARViewerPage;
