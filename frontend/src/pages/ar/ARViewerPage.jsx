// pages/ar/ARViewerPage.jsx
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X, QrCode, AlertTriangle } from 'lucide-react';
import { ARErrorBoundary } from '../../components/ar/ARErrorBoundary';

const QRCodeDisplay = React.lazy(() => import('../../components/ar/QRCodeDisplay'));
const ARViewer = React.lazy(() => import('../../components/ar/ARViewer'));

function ARViewerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  const flowerType = searchParams.get('type') || 'rose';
  const arrangement = searchParams.get('arrangement') || 'single';
  const color = '#' + (searchParams.get('color') || 'ff69b4');

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    setIsMobile(/android|iphone|ipad|ipod|mobile/i.test(ua));
  }, []);

  const handleExitAR = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.warn);
    }
    navigate(-1);
  };

  return (
    <div className="relative w-screen h-screen text-white bg-black">
      <button
        onClick={handleExitAR}
        className="absolute z-50 p-2 rounded-full top-3 right-3 bg-white/10 hover:bg-white/20"
        aria-label="Close"
      >
        <X />
      </button>

      <ARErrorBoundary>
        <Suspense
          fallback={
            <div className="grid w-full h-full place-items-center text-white/80">
              Loading AR experience...
            </div>
          }
        >
          {isMobile ? (
            <ARViewer
              flowerType={flowerType}
              arrangement={arrangement}
              color={color}
            />
          ) : (
            <div className="grid w-full h-full p-6 place-items-center">
              <div className="w-full max-w-md p-6 text-black bg-white rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <QrCode className="w-5 h-5" />
                  <h2 className="font-semibold">Scan to view in AR</h2>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  Scan this QR code with a mobile device to launch the flower in Augmented Reality.
                </p>
                <QRCodeDisplay
                  flowerType={flowerType}
                  arrangement={arrangement}
                  color={color}
                />
                <div className="flex items-start gap-2 mt-4 text-xs text-gray-500">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <span>AR requires HTTPS and a supported mobile browser.</span>
                </div>
              </div>
            </div>
          )}
        </Suspense>
      </ARErrorBoundary>
    </div>
  );
}

export default ARViewerPage;
