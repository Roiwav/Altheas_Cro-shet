// components/ar/ARViewer.jsx
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Color } from 'three';
import '@google/model-viewer';

// Map to actual files used elsewhere so AR uses the same assets
const MODEL_PATHS = {
  rose: { single: '/models/rose_single.glb', bouquet: '/models/rose_bouquet.glb' },
  tulip: { single: '/models/tulip_single.glb', bouquet: '/models/tulip_bouquet.glb' },
  sunflower: { single: '/models/sunflower_single.glb', bouquet: '/models/sunflower_bouquet.glb' },
  lily: { single: '/models/lily_single.glb', bouquet: '/models/lily_bouquet.glb' },
  carnation: { single: '/models/carnation_single.glb', bouquet: '/models/carnation_bouquet.glb' },
  peony: { single: '/models/peony_single.glb', bouquet: '/models/peony_bouquet.glb' },
};

export default function ARViewer({
  flowerType = 'rose',
  arrangement = 'single',
  color = '#ff69b4',
  modelSrc, // optional override
  showARButton = false, // New prop to control AR button visibility
  isFullScreen = false, // New prop to control layout
}) {
  const modelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resolve src once; do not keep setting attributes during runtime
  const modelPath = useMemo(() => {
    if (modelSrc) return modelSrc;
    const entry = MODEL_PATHS[flowerType] || MODEL_PATHS.rose;
    return (entry && entry[arrangement]) ? entry[arrangement] : MODEL_PATHS.rose.single;
  }, [flowerType, arrangement, modelSrc]);

  // Style objects are memoized so they do not trigger updates in Lit
  const containerStyle = useMemo(() => (isFullScreen ? {
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      background: '#000',
      overflow: 'hidden',
    } : {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
    }), [isFullScreen]);

  const modelViewerStyle = useMemo(() => ({
    width: '100%',
    height: '100%',
    display: 'block',
    '--progress-bar-color': color,
  }), [color]);

  const arButtonStyle = useMemo(() => ({
    backgroundColor: color,
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '24px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
  }), [color]);

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

  // Effect to update material color when the color prop changes
  useEffect(() => {
    const modelViewer = modelRef.current;
    if (!modelViewer || !modelViewer.model) return;

    const applyColor = () => {
      const newColor = new Color(color);
      modelViewer.model.materials.forEach((material) => {
        const materialName = material.name.toLowerCase();
        // Only apply color to materials that are part of the flower petals.
        // This relies on the 3D model's materials being named appropriately (e.g., 'petal', 'flower_material').
        if (materialName.includes('petal') || materialName.includes('flower') || materialName.includes(flowerType)) {
          const pbr = material.pbrMetallicRoughness;
          if (pbr) {
            // Discard the original texture to apply a solid color, but keep other maps (like normalMap).
            pbr.baseColorTexture.texture?.dispose();
            pbr.baseColorTexture.texture = null;
            pbr.setBaseColorFactor([newColor.r, newColor.g, newColor.b, 1]);
          }
        }
      });
    };

    // If the model is already loaded, apply color immediately.
    // Otherwise, the 'load' event listener will handle it.
    if (!isLoading) {
      applyColor();
    }

  }, [color, isLoading]); // Rerun when color changes or model finishes loading

  return (
    <div style={containerStyle}>
      {isLoading && !error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            zIndex: 3,
          }}
        >
          Loading 3D model...
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            padding: 16,
            textAlign: 'center',
            zIndex: 3,
          }}
        >
          {error}
        </div>
      )}

      <model-viewer
        ref={modelRef}
        src={modelPath}
        alt={`${flowerType} ${arrangement}`}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="auto"
        interaction-prompt="auto"
        interaction-prompt-style="wiggle"
        camera-controls
        camera-orbit="15deg 75deg 105%"
        touch-action="pan-y"
        shadow-intensity="1"
        exposure="1.2"
        environment-image="neutral"
        autoplay
        style={modelViewerStyle}
      >
        {showARButton && (
          <button slot="ar-button" style={arButtonStyle}>
            View in AR
          </button>
        )}
      </model-viewer>
    </div>
  );
}
