import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useProgress, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, SSAO, ToneMapping } from '@react-three/postprocessing';
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

// --- Dynamic Lighting Component ---
const DynamicLighting = () => {
  const lightRef = useRef();

  useFrame(({ clock }) => {
    if (lightRef.current) {
      // Gently move the light in a circular path to create dynamic shadows
      const elapsedTime = clock.getElapsedTime();
      lightRef.current.position.x = 10 + Math.sin(elapsedTime * 0.2) * 3;
      lightRef.current.position.z = 5 + Math.cos(elapsedTime * 0.2) * 3;
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        ref={lightRef}
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
    </>
  );
};

// --- 3D Scene Component ---
const Scene3D = React.memo(({ flowerType, color, arrangement, isAREnabled }) => {
  return (
    <>
      <DynamicLighting />
      
      <Suspense fallback={null}>
        <FlowerModel 
          key={`${flowerType}-${arrangement}-${color}`}
          flowerType={flowerType}
          color={color}
          position={[0, 0, 0]}
          arrangement={arrangement}
          scale={1}
        />
      </Suspense>
      
      {/* High-quality effects. Conditionally render ground plane for non-AR mode */}
      <EffectComposer>
        <SSAO
          radius={0.4}
          intensity={20}
          luminanceInfluence={0.4}
          color="black"
        />
        <ToneMapping />
      </EffectComposer>

      {/* Environment for realistic reflections */}
      <Environment preset="city" />
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
        <div className="p-4 text-red-500 rounded bg-red-50">
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
  arrangement = 'single',
  className = '',
  isAREnabled = false
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
      gl.outputColorSpace = THREE.SRGBColorSpace;
      setIsReady(true);
    } catch (err) {
      console.error('WebGL initialization error:', err);
      setError('Failed to initialize WebGL. Please try refreshing the page.');
    }
  }, []);
  
  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
        <div className="text-center">
          <div className="mb-2 text-lg font-medium text-red-500">WebGL Error</div>
          <p className="mb-4 text-gray-600 dark:text-gray-300">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white transition-colors bg-pink-500 rounded-md hover:bg-pink-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`relative w-full ${
        isAREnabled 
          ? 'h-full' 
          : 'h-auto aspect-square max-h-[70vh] rounded-lg overflow-hidden shadow-lg'
      } ${className}`}
    >
      <ErrorBoundary>
        <Canvas
          shadows="soft"
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
          // Enable MSAA for smoother edges
          gl-antialias="true"
          gl-powerPreference="high-performance"
          frameloop="demand" // Render on-demand for better performance
        >
          <Suspense fallback={<Loader />}>
            <Scene3D 
              flowerType={flowerType} 
              color={color}
              arrangement={arrangement}
              isAREnabled={isAREnabled}
            />
            {/* Always enable viewer controls, but disable auto-rotate in AR mode for better manual control */}
            <ModelViewer autoRotate={!isAREnabled} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      {!isReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <div className="w-12 h-12 mb-4 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Loading 3D Viewer</h3>
          <p className="max-w-md text-sm text-gray-600 dark:text-gray-300">Preparing your flower model. This may take a moment...</p>
        </div>
      )}
    </div>
  );
};

// Add display name for better debugging
ARViewer.displayName = 'ARViewer';

export default React.memo(ARViewer);
