import React, { useRef, useEffect, useState } from 'react';
import '@google/model-viewer';

export default function ARViewer({ 
  flowerType = 'rose', 
  arrangement = 'single', 
  color = '#ff69b4',
  modelSrc 
}) {
  const modelRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const modelViewer = modelRef.current;
    
    if (modelViewer) {
      // Listen for model load events
      const handleLoad = () => {
        setIsLoading(false);
        console.log('3D model loaded successfully');
      };

      const handleError = (event) => {
        setError('Failed to load 3D model');
        setIsLoading(false);
        console.error('Model loading error:', event);
      };

      modelViewer.addEventListener('load', handleLoad);
      modelViewer.addEventListener('error', handleError);

      return () => {
        modelViewer.removeEventListener('load', handleLoad);
        modelViewer.removeEventListener('error', handleError);
      };
    }
  }, []);

  // Generate model path based on flower configuration
  const getModelPath = () => {
    if (modelSrc) return modelSrc;
    // Adjust path to your actual model files
    return `/models/${flowerType}_${arrangement}.glb`;
  };

  // Generate iOS USDZ path (optional, for iOS AR Quick Look)
  const getIOSModelPath = () => {
    return `/models/${flowerType}_${arrangement}.usdz`;
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          color: '#fff',
          background: 'rgba(0,0,0,0.7)',
          padding: '20px',
          borderRadius: '10px'
        }}>
          Loading 3D model...
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          color: '#fff',
          background: 'rgba(255,0,0,0.8)',
          padding: '15px',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      )}

      <model-viewer
        ref={modelRef}
        src={getModelPath()}
        ios-src={getIOSModelPath()}
        alt={`A ${color} ${flowerType} in ${arrangement} arrangement`}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="auto"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        environment-image="neutral"
        exposure="1"
        ar-placement="floor"
        style={{
          width: '100%',
          height: '100%',
          '--progress-bar-color': color
        }}
      >
        {/* Custom AR button slot */}
        <button 
          slot="ar-button"
          style={{
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
            transform: 'translateX(-50%)'
          }}
        >
          View in Your Space
        </button>
      </model-viewer>
    </div>
  );
}
