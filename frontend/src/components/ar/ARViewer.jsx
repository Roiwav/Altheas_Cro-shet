// components/ar/ARViewer.jsx
import React, { useRef, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { Color } from 'three';
import '@google/model-viewer';

// Defines the paths to the 3D models for each flower type and arrangement.
const MODEL_PATHS = {
  rose: { single: '/models/rose_single.glb', bouquet: '/models/rose_bouquet.glb' },
  tulip: { single: '/models/tulip_single.glb', bouquet: '/models/tulip_bouquet.glb' },
  sunflower: { single: '/models/sunflower_single.glb', bouquet: '/models/sunflower_bouquet.glb' },
  lily: { single: '/models/lily_single.glb', bouquet: '/models/lily_bouquet.glb' },
  carnation: { single: '/models/carnation_single.glb', bouquet: '/models/carnation_bouquet.glb' },
  peony: { single: '/models/peony_single.glb', bouquet: '/models/peony_bouquet.glb' },
};

/**
 * A versatile 3D model viewer component that can be used for both inline previews
 * and full-screen Augmented Reality experiences. It leverages Google's <model-viewer>.
 * @param {object} props - The component props.
 */
const ARViewer = forwardRef(({
  flowerType = 'rose',
  arrangement = 'single',
  color = '#ff69b4',
  modelSrc, // optional override
  ar = false, // Prop to control AR functionality
  showARButton = false, // New prop to control AR button visibility
  isFullScreen = false, // New prop to control layout
}, ref) => {
  // Refs to directly access the <model-viewer> and its AR button.
  const modelRef = useRef(null);
  const arButtonRef = useRef(null);
  // State to manage loading and error status of the model.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expose a function to the parent component to capture a screenshot
  useImperativeHandle(ref, () => ({
    captureScreenshot: () => {
      const modelViewer = modelRef.current;
      if (modelViewer) {
        // toDataURL() is a method on the <model-viewer> element
        return modelViewer.toDataURL();
      }
      return null;
    }
  }));

  // Memoize the model path to prevent re-computation on every render.
  const modelPath = useMemo(() => {
    if (modelSrc) return modelSrc;
    const entry = MODEL_PATHS[flowerType] || MODEL_PATHS.rose;
    return (entry && entry[arrangement]) ? entry[arrangement] : MODEL_PATHS.rose.single;
  }, [flowerType, arrangement, modelSrc]);

  // Effect to add a "press-in" animation to the AR button on touch devices.
  useEffect(() => {
    const button = arButtonRef.current;
    if (!button) return;

    const handleTouchStart = () => {
      button.style.transform = 'translateX(-50%) scale(0.95)';
      button.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; // shadow-sm
    };

    const handleTouchEnd = () => {
      button.style.transform = 'translateX(-50%) scale(1)';
      button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'; // shadow-md
    };

    button.addEventListener('touchstart', handleTouchStart, { passive: true });
    button.addEventListener('touchend', handleTouchEnd, { passive: true });
    button.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      button.removeEventListener('touchstart', handleTouchStart);
      button.removeEventListener('touchend', handleTouchEnd);
      button.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  // Effect to handle the loading and error events from the <model-viewer> element.
  useEffect(() => {
    const el = modelRef.current;
    if (!el) return;

    const handleLoad = () => {
      setIsLoading(false);
      setError(null);
      // Note: do not set element properties here to avoid Lit change-in-update warnings
      // This console log is fine and visible in your earlier logs
      console.log('3D model loaded successfully');
    };

    const handleError = (event) => {
      const message = `Failed to load 3D model from: ${modelPath}`;
      setError(message);
      setIsLoading(false);
      console.error('Model loading error:', event?.detail || event);
    };

    el.addEventListener('load', handleLoad);
    el.addEventListener('error', handleError);
    return () => {
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('error', handleError);
    };
  }, [modelPath]);

  // Effect to apply color changes to the model's materials.
  useEffect(() => {
    const modelViewer = modelRef.current;
    // The model is only ready to be manipulated after it has fully loaded.
    // We check for `!isLoading` and the presence of `modelViewer.model`.
    if (isLoading || !modelViewer || !modelViewer.model) {
      // If the model is still loading or not available, we do nothing.
      // The hook will re-run once `isLoading` changes to false.
      return;
    }

    const newColor = new Color(color);

    // This is a common pattern for <model-viewer>:
    // We create a new material and swap it out to ensure changes are applied.
    modelViewer.model.materials.forEach((material) => {
      const materialName = material.name.toLowerCase();

      // Target only the petal materials.
      if (materialName.includes('petal') || materialName.includes('flower') || materialName.includes(flowerType)) {
        // Set the base color factor directly on the material.
        // model-viewer will detect this change and update the model.
        material.pbrMetallicRoughness.setBaseColorFactor(newColor);
      }
    });
  }, [color, isLoading, flowerType]); // Rerun when color changes or after the model has loaded.

  return (
    // The main container, which is either full-screen or sized by its parent.
    <div className={isFullScreen ? "fixed inset-0 w-screen h-dvh bg-black overflow-hidden" : "w-full h-full relative overflow-hidden"}>
      {isLoading && !error && (
        <div className="absolute inset-0 z-10 grid text-white place-items-center">
          Loading 3D model...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 grid p-4 text-center text-white place-items-center">
          {error}
        </div>
      )}

      {/* The core <model-viewer> web component. */}
      <model-viewer
        ref={modelRef}
        src={modelPath}
        alt={`${flowerType} ${arrangement}`}
        ar={ar ? true : undefined}
        ar-modes="webxr scene-viewer quick-look"
        ar-placement="floor"
        ar-scale="auto"
        ar-shadows
        light-estimation
        disable-scale
        interaction-prompt="auto"
        interaction-prompt-style="wiggle" // Adds a subtle animation to encourage interaction.
        camera-controls
        touch-action="pan-y"
        camera-target="0 1m 0" // Aims the camera slightly up.
        field-of-view="30deg" // Zooms in for a fuller view.
        shadow-intensity="1"
        shadow-softness="1" // Creates softer, more realistic shadows.
        exposure="1.2"
        environment-image="neutral"
        autoplay
        className="block w-full h-full"
        style={{
          '--progress-bar-color': color,
          '--model-viewer-background-color': '#f0f2f5'
        }}
      >
        {/* The "Enter AR" button, only shown when `showARButton` is true. */}
        {showARButton && (
          <button
            ref={arButtonRef}
            slot="ar-button"
            className="absolute z-10 px-6 py-3 text-base font-bold text-white transition-transform ease-out -translate-x-1/2 border-none rounded-full shadow-md cursor-pointer left-1/2 bg-gradient-to-r from-pink-500 to-purple-600"
            style={{
              bottom: 'calc(24px + env(safe-area-inset-bottom))', // Adjust for mobile navigation bars
              transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out'
            }}
          >
            Enter AR Experience
          </button>
        )}
        {/* An invisible ground plane for shadows to be cast upon in the 3D preview. */}
        <div className="plane" slot="environment" style={{
          display: 'block', content: ' ', width: '1000px', height: '1000px', background: 'transparent', position: 'absolute', transform: 'translateY(-50%) rotateX(90deg)', top: '50%', left: '50%', marginLeft: '-500px', marginTop: '-500px'
        }}></div>
        
        {/* Instructional text displayed during the AR session. */}
        <div
          slot="ar-status"
          className="absolute left-1/2 z-10 box-border max-w-[calc(100%-32px)] -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/70 px-3 py-2 text-center text-sm text-white font-sans"
          style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }} // Adjust for mobile navigation bars
        >
          Move your phone to find a surface, then tap to place
        </div>
      </model-viewer>
    </div>
  );
});

export default ARViewer;
