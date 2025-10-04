import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useProgress, Environment, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, SSAO, ToneMapping } from '@react-three/postprocessing';
import { NormalPass } from 'postprocessing';
import FlowerModel from './FlowerModel';
import { useARScript } from '@/hooks/useARScript';

// Loader
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center style={{ color: 'white' }}>
      {Math.round(progress)}% loaded
    </Html>
  );
}

// Simple viewer controls
const ModelViewer = ({ autoRotate = true }) => {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 5);
  }, [camera]);
  return (
    <OrbitControls
      enableZoom
      enablePan
      enableRotate
      minDistance={2}
      maxDistance={10}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
    />
  );
};

// Lighting
const DynamicLighting = () => {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      lightRef.current.position.x = 10 + Math.sin(t * 0.2) * 3;
      lightRef.current.position.z = 5 + Math.cos(t * 0.2) * 3;
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

// 3D Scene (non-AR)
const Scene3D = React.memo(({ flowerType, color, arrangement }) => {
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
      <EffectComposer>
        <primitive object={new NormalPass()} />
        <SSAO radius={0.4} intensity={20} luminanceInfluence={0.4} color="black" />
        <ToneMapping />
      </EffectComposer>
      <Environment preset="city" />
    </>
  );
});
Scene3D.displayName = 'Scene3D';

// Create a context to share the AR.js context
const ARContext = React.createContext();

// AR.js integration component
const ARProvider = ({ children }) => {
  const { gl, camera, scene } = useThree();
  const arToolkitContextRef = useRef(null);

  const isARScriptLoaded = useARScript();
  if (!isARScriptLoaded) {
    return null; // Or a loading indicator if you prefer
  }

  useEffect(() => {
    // Initialize AR.js
    const arToolkitSource = new window.THREEx.ArToolkitSource({ sourceType: 'webcam' });
    arToolkitSource.init(() => {
      setTimeout(() => arToolkitSource.onResizeElement(), 100);
    });

    const arToolkitContext = new window.THREEx.ArToolkitContext({
      cameraParametersUrl: '/data/camera_para.dat',
      detectionMode: 'mono',
    });
    arToolkitContext.init(() => {
      camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });
    arToolkitContextRef.current = arToolkitContext;

    // Update AR.js on render
    const onRender = () => {
      if (arToolkitSource.ready === false) return;
      arToolkitContext.update(arToolkitSource.domElement);
      scene.visible = camera.visible;
    };

    gl.setAnimationLoop(onRender);

    return () => {
      gl.setAnimationLoop(null);
      // Cleanup if needed, though AR.js doesn't have a clean stop method
    };
  }, [gl, camera, scene, isARScriptLoaded]);

  return <ARContext.Provider value={arToolkitContextRef}>{children}</ARContext.Provider>;
};

// AR payload rendered by R3F
const SceneAR = React.memo(({ flowerType, color, arrangement }) => {
  const markerRootRef = useRef();
  const arToolkitContextRef = React.useContext(ARContext);
  const isARScriptLoaded = useARScript();

  if (!isARScriptLoaded) {
    return null;
  }

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <group ref={markerRootRef}>
        <FlowerModel
          key={`${flowerType}-${arrangement}-${color}`}
          flowerType={flowerType}
          color={color}
          position={[0, 0.5, 0]} // Lift model slightly above marker
          arrangement={arrangement}
          scale={0.5}
        />
      </group>
      {arToolkitContextRef && arToolkitContextRef.current && (
        <primitive object={new window.THREEx.ArMarkerControls(arToolkitContextRef.current, markerRootRef.current, { type: 'pattern', patternUrl: '/data/pattern-hiro.patt' })} />
      )}
    </>
  );
});
SceneAR.displayName = 'SceneAR';

// Error boundary
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

// Main
const ARViewer = ({
  flowerType = 'rose',
  color = '#ff69b4',
  arrangement = 'single',
  className = '',
  isAREnabled = false
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const isARScriptLoaded = useARScript();

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

  if (isAREnabled) {
    if (!isARScriptLoaded) {
      return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <div className="w-12 h-12 mb-4 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Loading AR Library...</h3>
          <p className="max-w-md text-sm text-gray-600 dark:text-gray-300">Please wait a moment.</p>
        </div>
      );
    }

    return (
      <div className={`relative w-full h-full ${className}`}>
        <ErrorBoundary>
          <Canvas
            gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
            onCreated={onCreated}
            camera={{ position: [0, 0, 0] }} // AR.js will control this
          >
            <ARProvider>
              <Suspense fallback={<Loader />}>
                <SceneAR flowerType={flowerType} color={color} arrangement={arrangement} />
              </Suspense>
            </ARProvider>
          </Canvas>
        </ErrorBoundary>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <p className="px-4 py-2 text-sm text-center text-white bg-black bg-opacity-50 rounded-full">
            Point camera at the HIRO marker.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${
        isAREnabled ? 'h-full' : 'h-auto aspect-square max-h-[70vh] rounded-lg overflow-hidden shadow-lg'
      } ${className}`}
    >
      <ErrorBoundary>
        <Canvas
          shadows="soft"
          dpr={[1, 2]}
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: true, stencil: false, depth: true }}
          onCreated={onCreated}
          frameloop="demand"
        >
          <Suspense fallback={<Loader />}>
            <Scene3D flowerType={flowerType} color={color} arrangement={arrangement} />
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

ARViewer.displayName = 'ARViewer';
export default React.memo(ARViewer);
