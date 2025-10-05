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

const ARProvider = React.forwardRef(({ children }, ref) => {
  const { gl, camera, scene } = useThree();
  const arToolkitContextRef = useRef(null);
  const isARScriptLoaded = useARScript();

  React.useImperativeHandle(ref, () => ({
    initAR: (onCameraStreamReady) => {
      if (!isARScriptLoaded || !window.THREEx || arToolkitContextRef.current) {
        console.warn('AR.js not ready or already initialized.');
        return;
      }

      const arToolkitContext = new window.THREEx.ArToolkitContext({
        cameraParametersUrl: '/data/camera_para.dat',
        detectionMode: 'mono',
      });

      arToolkitContext.init(() => {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
      });

      arToolkitContextRef.current = arToolkitContext;

     const arToolkitSource = new window.THREEx.ArToolkitSource({ sourceType: 'webcam' });

      arToolkitSource.init(() => {
        arToolkitSource.domElement.addEventListener('loadedmetadata', () => {
          onCameraStreamReady(true);
        });

        setTimeout(() => arToolkitSource.onResizeElement(), 100);
        arToolkitSource.domElement.style.position = 'absolute';
        arToolkitSource.domElement.style.top = '0px';
        arToolkitSource.domElement.style.left = '0px';
        arToolkitSource.domElement.style.zIndex = '-1';
        document.body.appendChild(arToolkitSource.domElement);

        const onRender = () => {
          if (arToolkitSource.ready === false) return;
          arToolkitContext.update(arToolkitSource.domElement);
          scene.visible = camera.visible;
        };
        gl.setAnimationLoop(onRender);

      }, (error) => {
        console.error("AR.js source initialization error:", error);
        onCameraStreamReady(false, "Could not access the camera. Please check permissions and ensure you are on a secure (HTTPS) connection.");
      });

      return () => { // Cleanup function
        gl.setAnimationLoop(null);
        if (arToolkitSource && arToolkitSource.domElement && arToolkitSource.domElement.parentElement) {
          document.body.removeChild(arToolkitSource.domElement);
        }
        arToolkitContextRef.current = null;
      };
    }
  }));

  return <ARContext.Provider value={arToolkitContextRef}>{children}</ARContext.Provider>;
});
ARProvider.displayName = 'ARProvider';

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
      {arToolkitContextRef && arToolkitContextRef.current && window.THREEx && (
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
  const [arStarted, setArStarted] = useState(false);
  const [cameraStreamReady, setCameraStreamReady] = useState(false);
  const arProviderRef = useRef(null);
  const isARScriptLoaded = useARScript();

  const onCreated = useCallback(({ gl }) => {
    try {
      gl.shadowMap.enabled = true;
      // gl.shadowMap.type = THREE.PCFSoftShadowMap; // PCFSoftShadowMap is default
      gl.outputColorSpace = THREE.SRGBColorSpace;
      setIsReady(true);
    } catch (err) {
      console.error('WebGL initialization error:', err);
      setError('Failed to initialize WebGL. Please try refreshing the page.');
    }
  }, []);

  const handleStartAR = () => {
    if (arProviderRef.current) {
      arProviderRef.current.initAR(handleCameraStreamReady);
      setArStarted(true);
    }
  };

  const handleCameraStreamReady = useCallback((success, message) => {
    if (success) setCameraStreamReady(true);
    else setError(message);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
        <div className="text-center text-red-500">
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
    if (!arStarted) {
      return (
        <div className={`relative w-full h-full ${className}`}>
          {/* Render canvas hidden to get GL context for ARProvider */}
          <div style={{ visibility: 'hidden', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <Canvas gl={{ alpha: true }} camera={{ position: [0, 0, 0] }}>
              <ARProvider ref={arProviderRef} />
            </Canvas>
          </div>
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Ready for Augmented Reality</h3>
            <p className="max-w-md mb-6 text-gray-600 dark:text-gray-300">
              Click the button below to start the AR experience. You will be asked for camera permission.
            </p>
            <button onClick={handleStartAR} disabled={!isARScriptLoaded} className="px-6 py-3 text-white transition-colors bg-pink-500 rounded-md hover:bg-pink-600 disabled:bg-gray-400">
              {isARScriptLoaded ? 'Start AR' : 'Loading AR...'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative w-full h-full ${className}`}>
        <Canvas
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
          camera={{ position: [0, 0, 0] }} // AR.js will control this
        >
          <ARProvider ref={arProviderRef}>
            <Suspense fallback={<Loader />}>
              <SceneAR flowerType={flowerType} color={color} arrangement={arrangement} />
            </Suspense>
          </ARProvider>
        </Canvas>
        {cameraStreamReady && (
          <div className="absolute inset-x-0 top-0 z-10 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <p className="px-4 py-2 text-sm text-center text-white bg-black bg-opacity-50 rounded-full">Point camera at the HIRO marker.</p>
          </div>
        )}
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
