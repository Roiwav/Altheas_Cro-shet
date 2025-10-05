import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X, QrCode, AlertTriangle } from 'lucide-react';
import { useUser } from '../../context/useUser';
import { ARErrorBoundary } from '../../components/ar/ARErrorBoundary';

const QRCodeDisplay = React.lazy(() => import('../../components/ar/QRCodeDisplay'));
const ARViewer = React.lazy(() => import('../../components/ar/ARViewer'));

function ARViewerPage() {
  const { isAuthenticated } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  const flowerType = searchParams.get('type') || 'rose';
  const arrangement = searchParams.get('arrangement') || 'single';
  const color = '#' + (searchParams.get('color') || 'ff69b4');

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
    setIsMobile(isMobileDevice);
  }, []);

  const handleExitAR = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.warn);
    }
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100">
      {/* Exit Button */}
      <button
        onClick={handleExitAR}
        className="fixed z-50 p-3 transition-shadow bg-white rounded-full shadow-lg top-4 right-4 hover:shadow-xl"
        aria-label="Exit AR View"
      >
        <X className="w-6 h-6 text-gray-700" />
      </button>

      {/* Desktop: Show QR Code */}
      {!isMobile && (
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="max-w-md p-8 text-center bg-white shadow-2xl rounded-2xl">
            <QrCode className="w-16 h-16 mx-auto mb-4 text-pink-500" />
            <h2 className="mb-4 text-2xl font-bold">View in AR</h2>
            <p className="mb-6 text-gray-600">
              Scan this QR code with your mobile device to view the flower in Augmented Reality.
            </p>
            <ARErrorBoundary>
              <Suspense fallback={<div>Generating QR Code...</div>}>
                <QRCodeDisplay 
                  flowerType={flowerType}
                  arrangement={arrangement}
                  color={color.replace('#', '')}
                />
              </Suspense>
            </ARErrorBoundary>
          </div>
        </div>
      )}

      {/* Mobile: Show AR Viewer */}
      {isMobile && (
        <ARErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-pink-500 rounded-full animate-spin"></div>
                <p className="text-gray-700">Loading AR experience...</p>
              </div>
            </div>
          }>
            <ARViewer 
              flowerType={flowerType}
              arrangement={arrangement}
              color={color}
            />
          </Suspense>
        </ARErrorBoundary>
      )}
    </div>
  );
}

export default ARViewerPage;
