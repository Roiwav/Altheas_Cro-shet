import React, { useRef, useEffect, useState } from 'react';
import '@google/model-viewer';
import { Cube } from 'lucide-react';

export default function ARViewer({ 
  flowerType = 'rose', 
  arrangement = 'single', 
  color = '#ff69b4',
  modelSrc 
}) {
  const modelRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelPath, setModelPath] = useState('');

  // IMPORTANT: Place GLB files in /public folder
  // Files in /public are served at root URL
  const getModelPath = () => {
    if (modelSrc) return modelSrc;
    // If files are in /public/models/ directory
    // Access them without '/public' prefix
    return `/models/${flowerType}_${arrangement}.glb`;
  };

  // Generate iOS USDZ path (optional, for iOS AR Quick Look)
  const getIOSModelPath = () => {
    return `/models/${flowerType}_${arrangement}.usdz`;
  };

  useEffect(() => {
    const path = getModelPath();
    setModelPath(path);
    
    const modelViewer = modelRef.current;
    
    if (modelViewer) {
      const handleLoad = () => {
        setIsLoading(false);
        setError(null);
        console.log('3D model loaded successfully');
      };

      const handleError = (event) => {
        const errorMessage = `Failed to load 3D model from: ${path}`;
        setError(errorMessage);
        setIsLoading(false);
        console.error('Model loading error:', event.detail || event);
      };

      // Add event listeners
      modelViewer.addEventListener('load', handleLoad);
      modelViewer.addEventListener('error', handleError);

      // Cleanup
      return () => {
        modelViewer.removeEventListener('load', handleLoad);
        modelViewer.removeEventListener('error', handleError);
      };
    }
  }, [flowerType, arrangement, modelSrc]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {isLoading && !error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          color: '#fff',
          background: 'rgba(0,0,0,0.7)',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '10px' }}>Loading 3D model...</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            {modelPath}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          color: '#fff',
          background: 'rgba(255,0,0,0.9)',
          padding: '20px',
          borderRadius: '10px',
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
            Model Loading Failed
          </div>
          <div style={{ fontSize: '14px', marginBottom: '10px' }}>
            {error}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            Please ensure the GLB file exists in /public/models/
          </div>
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
        <button 
          slot="ar-button"
          className="absolute z-10 flex items-center gap-2 px-6 py-3 text-base font-semibold text-white transition-all duration-300 ease-in-out -translate-x-1/2 border-none rounded-full shadow-lg bottom-6 left-1/2 hover:scale-105 hover:shadow-xl active:scale-100"
          style={{ backgroundColor: color }}
        >
          <Cube className="w-5 h-5" />
          <span>View in your space</span>
        </button>
      </model-viewer>
    </div>
  );
}
