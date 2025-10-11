// pages/ar/ARViewerPage.jsx
// This page is dedicated to displaying the full-screen Augmented Reality experience.
// It receives flower configuration from URL parameters and renders the ARViewer component.
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { X, RotateCcw } from 'lucide-react';
import { ARErrorBoundary } from '../../components/ar/ARErrorBoundary';

// Lazily import the ARViewer component to improve initial page load performance.
const ARViewer = React.lazy(() => import('../../components/ar/ARViewer'));

/**
 * Renders the full-screen AR viewer page.
 * This page is typically accessed by scanning a QR code or clicking a direct AR link.
 */
function ARViewerPage() {
  // Hooks for navigation and accessing URL query parameters.
  const modelViewerRef = useRef(null);
  const [arSessionStarted, setArSessionStarted] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve flower configuration from URL search parameters, with fallbacks.
  const flowerType = searchParams.get('type') || 'rose';
  const arrangement = searchParams.get('arrangement') || 'single';
  const color = '#' + (searchParams.get('color') || 'ff69b4');
  const modelSrc = location.state?.modelSrc; // Get modelSrc from navigation state

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

  /**
   * Handles resetting the AR session.
   * It programmatically exits and re-enters AR mode.
   */
  const handleResetAR = async () => {
    const modelViewer = modelViewerRef.current;
    if (modelViewer && modelViewer.arSession) {
      try {
        // Exit the current session
        await modelViewer.arSession.end();
        // The 'ar-status' event listener below will handle re-activation.
      } catch (error) {
        console.error("Error ending AR session for reset:", error);
        // As a fallback, just try activating again.
        modelViewer.activateAR();
      }
    }
  };

  // Effect to listen for AR session status changes.
  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return;

    const handleArStatus = (event) => {
      setArSessionStarted(event.detail.status === 'session-started');
      // If the session ended (e.g., from our reset function), immediately try to start it again.
      if (event.detail.status === 'not-presenting') {
        // A small delay can help ensure the browser is ready to start a new session.
        setTimeout(() => modelViewer.activateAR(), 100);
      }
    };

    modelViewer.addEventListener('ar-status', handleArStatus);
    return () => modelViewer.removeEventListener('ar-status', handleArStatus);
  }, []);

  return (
    // Main container for the AR view, styled to fill the screen.
    <div className="relative w-screen overflow-hidden text-white bg-black h-dvh">
      {/* Exit button positioned at the top-right corner. */}
      <button
        onClick={handleExitAR}
        className="absolute z-50 p-2 transition-colors rounded-full top-4 right-4 bg-black/20 hover:bg-black/40 backdrop-blur-sm"
        aria-label="Close"
      >
        <X />
      </button>

      {/* Reset button, visible only when an AR session is active. */}
      {arSessionStarted && (
        <button
          onClick={handleResetAR}
          className="absolute z-50 p-2 transition-colors rounded-full top-4 left-4 bg-black/20 hover:bg-black/40 backdrop-blur-sm"
          aria-label="Reset AR"
          title="Reset Position"
        >
          <RotateCcw />
        </button>
      )}

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
            ref={modelViewerRef} // Assign ref to access the component instance
            flowerType={flowerType}
            arrangement={arrangement}
            color={color}
            modelSrc={modelSrc}
            ar={true}
            isFullScreen={true}
            showARButton={true}
          />
        </Suspense>
      </ARErrorBoundary>
    </div>
  );
}

export default ARViewerPage;
