import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useProgress, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, SSAO, ToneMapping } from '@react-three/postprocessing';
import FlowerModel from './FlowerModel';

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
        <SSAO radius={0.4} intensity={20} luminanceInfluence={0.4} color="black" />
        <ToneMapping />
      </EffectComposer>
      <Environment preset="city" />
    </>
  );
});
Scene3D.displayName = 'Scene3D';

// A simple component that attaches its group to an external parent (MindAR anchor)
function AttachToExternal({ externalGroup, children }) {
  const local = useRef();
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    if (!externalGroup || !local.current) return;
    externalGroup.add(local.current);
    return () => {
      externalGroup.remove(local.current);
    };
  }, [externalGroup]);

  return <group ref={local}>{children}</group>;
}

// AR payload rendered by R3F but parented to MindAR anchor
const SceneAR = React.memo(({ flowerType, color, arrangement, anchorGroup }) => {
  return (
    <>
      <AttachToExternal externalGroup={anchorGroup}>
        <Suspense fallback={null}>
          <FlowerModel
            key={`${flowerType}-${arrangement}-${color}`}
            flowerType={flowerType}
            color={color}
            position={[0, 0, 0]}
            arrangement={arrangement}
            scale={0.5}
          />
        </Suspense>
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
      </AttachToExternal>
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

  // MindAR runtime refs
  const containerRef = useRef(null);
  const mindarRef = useRef(null);
  const mindarAnchorGroup = useRef(null);
  const mindarCamera = useRef(null);
  const mindarRenderer = useRef(null);
  const [anchorGroupState, setAnchorGroupState] = useState(null);

  // WebGL context restore handling
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

  // Initialize MindAR when AR enabled
  useEffect(() => {
    let stopped = false;

    const startMindAR = async () => {
      if (!isAREnabled || !containerRef.current) return;

      try {
        // Access MindAR from the global window object (loaded via script tag in index.html)
        const { MindARThree } = window;

        const mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: './assets/ar/targets.mind',
          maxTrack: 1,
          filterMinCF: 0.0001,
          filterBeta: 0.001,
          missTolerance: 5,
          warmupTolerance: 5
        });

        const { renderer, scene, camera } = mindarThree;

        // Create one anchor and expose its group
        const anchor = mindarThree.addAnchor(0);
        mindarRef.current = mindarThree;
        mindarAnchorGroup.current = anchor.group;
        mindarCamera.current = camera;
        mindarRenderer.current = renderer;
        setAnchorGroupState(anchor.group);

        await mindarThree.start();

        // MindAR controls the render loop; R3F can still render its Canvas separately
        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
        });
      } catch (e) {
        console.error(e);
        setError('Failed to start AR. Check camera permissions and target file.');
      }
    };

    const stopMindAR = async () => {
      setAnchorGroupState(null);
      if (mindarRef.current) {
        try {
          await mindarRef.current.stop();
        } catch {}
        if (mindarRef.current.renderer) {
          mindarRef.current.renderer.setAnimationLoop(null);
        }
      }
      mindarRef.current = null;
      mindarAnchorGroup.current = null;
      mindarCamera.current = null;
      mindarRenderer.current = null;
    };

    if (isAREnabled) {
      startMindAR();
    } else {
      stopMindAR();
    }

    return () => {
      if (isAREnabled) {
        // cleanup on unmount or toggle off
        (async () => {
          try {
            await stopMindAR();
          } catch {}
        })();
      }
    };
  }, [isAREnabled]);

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
    return (
      <div className={`relative w-full h-full ${className}`}>
        <ErrorBoundary>
          {/* MindAR renders into this container; it creates its own canvas */}
          <div ref={containerRef} className="relative w-full h-full" />
          {/* R3F Canvas overlays to render the model, parented to the MindAR anchor */}
          <Canvas
            orthographic={false}
            shadows="soft"
            dpr={[1, 2]}
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ antialias: true, powerPreference: 'high-performance', alpha: true, stencil: false, depth: true }}
            onCreated={onCreated}
          >
            <Suspense fallback={null}>
              <SceneAR flowerType={flowerType} color={color} arrangement={arrangement} anchorGroup={anchorGroupState} />
            </Suspense>
          </Canvas>
        </ErrorBoundary>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <p className="px-4 py-2 text-sm text-center text-white bg-black bg-opacity-50 rounded-full">
            Point the camera at the target image.
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
