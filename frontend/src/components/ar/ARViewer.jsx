import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import FlowerModel from './FlowerModel';

// Loading component
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center style={{ color: 'white' }}>
      {Math.round(progress)}% loaded
    </Html>
  );
}

// Simple 3D model viewer controls
const ModelViewer = ({ autoRotate = true }) => {
  const { camera } = useThree();
  
  // Set up camera position
  useEffect(() => {
    camera.position.set(0, 0, 5);
  }, [camera]);
  
  return (
    <OrbitControls 
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      minDistance={2}
      maxDistance={10}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
    />
  );
};

// --- 3D Scene Component ---
const Scene3D = React.memo(({ flowerType, color }) => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />
      
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      <Suspense fallback={null}>
        <FlowerModel 
          key={`${flowerType}-${color}`}
          flowerType={flowerType}
          color={color}
          position={[0, 0, 0]}
          scale={1}
        />
      </Suspense>
      
      {/* Add a ground plane for shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
    </>
  );
});

// Add display name for better debugging
Scene3D.displayName = 'Scene3D';

// Error boundary for 3D content
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Error in 3D viewer:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 p-4 bg-red-50 rounded">
          Failed to load 3D model. Please try refreshing the page.
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Main 3D Model Viewer Component ---
const ARViewer = ({ 
  flowerType = 'rose',
  color = '#ff69b4',
  className = ''
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  
  
  // Handle WebGL context restoration
  useEffect(() => {
    const handleContextLost = (event) => {
      event.preventDefault();
      setError('WebGL context lost. Attempting to recover...');
      setIsReady(false);
    };

    const handleContextRestored = () => {
      setError(null);
      setIsReady(true);
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost, false);
      canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, []);
  
  // Initialize WebGL renderer with error boundaries
  const onCreated = useCallback(({ gl }) => {
    try {
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
      setIsReady(true);
    } catch (err) {
      console.error('WebGL initialization error:', err);
      setError('Failed to initialize WebGL. Please try refreshing the page.');
    }
  }, []);
  
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">WebGL Error</div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`relative w-full h-full bg-gray-100 dark:bg-gray-900 ${className}`}
      style={{
        background: 'radial-gradient(circle at center, #f9fafb 0%, #f3f4f6 100%)',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <ErrorBoundary>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true,
            stencil: false,
            depth: true
          }}
          onCreated={onCreated}
        >
          <Suspense fallback={<Loader />}>
            <Scene3D flowerType={flowerType} color={color} />
            <ModelViewer autoRotate={true} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 p-6 text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading 3D Viewer</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md">Preparing your flower model. This may take a moment...</p>
        </div>
      )}
    </div>
  );
};

// Add display name for better debugging
ARViewer.displayName = 'ARViewer';

export default React.memo(ARViewer);
