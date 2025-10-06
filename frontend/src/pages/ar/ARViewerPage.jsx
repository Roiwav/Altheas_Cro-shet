// pages/ar/ARViewerPage.jsx
// This page is dedicated to displaying the full-screen Augmented Reality experience.
// It receives flower configuration from URL parameters and renders the ARViewer component.

import React, { Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { ARErrorBoundary } from '../../components/ar/ARErrorBoundary';

// Lazily import the ARViewer component to improve initial page load performance.
const ARViewer = React.lazy(() => import('../../components/ar/ARViewer'));

/**
 * Renders the full-screen AR viewer page.
 * This page is typically accessed by scanning a QR code or clicking a direct AR link.
 */
function ARViewerPage() {
  // Hooks for navigation and accessing URL query parameters.
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Retrieve flower configuration from URL search parameters, with fallbacks.
  const flowerType = searchParams.get('type') || 'rose';
  const arrangement = searchParams.get('arrangement') || 'single';
  const color = '#' + (searchParams.get('color') || 'ff69b4');

  /**
   * Handles exiting the AR view.
   * It exits fullscreen mode if active and navigates back to the flower customizer page.
   */
  const handleExitAR = () => {
    // Exit fullscreen if the browser is in fullscreen mode.
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.warn);
    }
    navigate('/ar');
  };

  return (
    // Main container for the AR view, styled to fill the screen.
    <div className="relative w-screen overflow-hidden text-white bg-black h-dvh">
      {/* Exit button positioned at the top-right corner. */}
      <button
        onClick={handleExitAR}
        className="absolute z-50 p-2 rounded-full top-3 right-3 bg-white/10 hover:bg-white/20"
        aria-label="Close"
      >
        <X />
      </button>

      {/* Wraps the AR viewer in an error boundary to catch and handle potential WebXR errors gracefully. */}
      <ARErrorBoundary>
        {/* Suspense provides a fallback UI while the lazy-loaded ARViewer component is loading. */}
        <Suspense
          fallback={
            <div className="grid w-full h-full place-items-center text-white/80">
              Loading AR experience...
            </div>
          }
        >
          {/* The ARViewer component, configured for a full-screen AR experience. */}
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
