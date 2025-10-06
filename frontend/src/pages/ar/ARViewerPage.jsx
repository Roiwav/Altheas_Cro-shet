// pages/ar/ARViewerPage.jsx
import React, { Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { ARErrorBoundary } from '../../components/ar/ARErrorBoundary';

const ARViewer = React.lazy(() => import('../../components/ar/ARViewer'));

function ARViewerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const flowerType = searchParams.get('type') || 'rose';
  const arrangement = searchParams.get('arrangement') || 'single';
  const color = '#' + (searchParams.get('color') || 'ff69b4');

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
          <ARViewer
            flowerType={flowerType}
            arrangement={arrangement}
            color={color}
            isFullScreen={true}
            showARButton={true}
          />
        </Suspense>
      </ARErrorBoundary>
    </div>
  );
}

export default ARViewerPage;
