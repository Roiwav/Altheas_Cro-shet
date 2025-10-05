import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useProgress, Environment, Ring } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, SSAO, ToneMapping } from '@react-three/postprocessing';
import { NormalPass } from 'postprocessing';
import { ARButton, XR, useHitTest, useXR } from '@react-three/xr';
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
        <primitive object={new NormalPass()} />
        <SSAO radius={0.4} intensity={20} luminanceInfluence={0.4} color="black" />
        <ToneMapping />
      </EffectComposer>
      <Environment preset="city" />
    </>
  );
});
Scene3D.displayName = 'Scene3D';

// AR Scene with placement logic
function ARScene({ flowerType, color, arrangement }) {
  const [placed, setPlaced] = useState(false);
  const [modelTransform, setModelTransform] = useState({ position: [0, 0, 0], rotation: [0, 0, 0] });
  const reticleRef = useRef();
  const { isPresenting } = useXR();

  useHitTest((hitMatrix, hit) => {
    if (hit && reticleRef.current && !placed) {
      hitMatrix.decompose(reticleRef.current.position, reticleRef.current.quaternion, reticleRef.current.scale);
      reticleRef.current.rotation.set(-Math.PI / 2, 0, 0);
    }
  });

  const placeModel = (e) => {
    if (reticleRef.current && !placed) {
      const { position, quaternion } = reticleRef.current;
      const euler = new THREE.Euler().setFromQuaternion(quaternion);
      setModelTransform({ position: position.toArray(), rotation: euler.toArray() });
      setPlaced(true);
    }
  };

  return (
    <group onSelect={placeModel}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      {!placed && isPresenting && (
        <Ring ref={reticleRef} args={[0.05, 0.1, 32]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="white" />
        </Ring>
      )}

      {placed && (
        <FlowerModel
          key={`${flowerType}-${arrangement}-${color}`}
          flowerType={flowerType}
          color={color}
          position={modelTransform.position}
          rotation={modelTransform.rotation}
          arrangement={arrangement}
          scale={0.5}
        />
      )}
    </group>
  );
}

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

  const onCreated = useCallback(({ gl }) => {
    try {
      gl.shadowMap.enabled = true;
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
          <div className="mb-2 text-lg font-medium text-red-500">Error</div>
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
        isAREnabled ? 'h-full' : 'h-auto aspect-square max-h-[70vh] rounded-lg overflow-hidden shadow-lg'
      } ${className}`}
    >
      {isAREnabled && <ARButton sessionInit={{ requiredFeatures: ['hit-test'] }} />}
      <Canvas
        shadows={!isAREnabled ? "soft" : false}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true, stencil: false, depth: true }}
        onCreated={onCreated}
        camera={!isAREnabled ? { position: [0, 0, 5], fov: 50 } : undefined}
        frameloop={isAREnabled ? 'always' : 'demand'}
      >
        {isAREnabled ? (
          <XR>
            <Suspense fallback={<Loader />}>
              <ARScene flowerType={flowerType} color={color} arrangement={arrangement} />
            </Suspense>
          </XR>
        ) : (
          <Suspense fallback={<Loader />}>
            <Scene3D flowerType={flowerType} color={color} arrangement={arrangement} />
            <ModelViewer autoRotate />
          </Suspense>
        )}
      </Canvas>

      {!isReady && !isAREnabled && (
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
