import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X, AlertTriangle } from 'lucide-react';

// Lazy load AR components
const ARViewer = React.lazy(() => import('../../components/ar/ARViewer'));

function ARViewerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Get flower type and color from URL parameters
  const flowerType = searchParams.get('type') || 'rose';
  const color = '#' + (searchParams.get('color') || 'ff69b4');

  // Check device and WebXR support
  useEffect(() => {
    const checkDeviceAndARSupport = async () => {
      try {
        // Check if mobile device
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
        setIsMobile(isMobileDevice);

        if (!isMobileDevice) {
          throw new Error('AR mode is only available on mobile devices');
        }

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
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-medium mb-2">Preparing AR Experience</h2>
          <p className="text-gray-300">This may take a moment...</p>
          {!isMobile && (
            <div className="mt-4 p-3 bg-yellow-500 bg-opacity-20 text-yellow-300 rounded-lg flex items-start">
              <AlertTriangle className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
              <span>For best results, please use a mobile device with AR support.</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">AR Not Available</h2>
          <p className="mb-6 text-gray-300">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleExitAR}
              className="w-full px-6 py-3 bg-pink-600 rounded-full font-medium hover:bg-pink-700 transition-colors"
            >
              Go Back
            </button>
            {!isMobile && (
              <p className="text-sm text-gray-400 mt-4">
                Try opening this page on a mobile device with AR support for the full experience.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* AR Viewport */}
      <div className="absolute inset-0">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center bg-black text-white">
            <div className="w-12 h-12 border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <ARViewer 
            flowerType={flowerType} 
            color={color} 
            arEnabled={true}
            className="ar-viewer"
          />
        </Suspense>
      </div>
      
      {/* AR Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-3">
        <button
          onClick={handleExitAR}
          className="w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white hover:bg-opacity-70 transition-all backdrop-blur-sm"
          aria-label="Exit AR"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* AR Prompt */}
      <div className="absolute bottom-8 left-0 right-0 mx-auto text-center text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full max-w-xs">
        Move your device to view the flower in your space
      </div>
    </div>
  );
}

export default ARViewerPage;
