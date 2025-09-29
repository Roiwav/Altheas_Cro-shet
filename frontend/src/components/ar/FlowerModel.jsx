import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// Available flower models with their configurations
const FLOWER_MODELS = {
  rose: {
    single: { path: '/models/rose.glb' },
    bouquet: { 
      path: '/models/Rose Bouquet.glb', // Using single model for now
      scale: 1.2, // Slightly larger scale for bouquet effect
    },
    scale: 0.50,
    rotation: [0, 0, 0]
  },
  tulip: {
    single: { path: '/models/tulips.glb' },
    bouquet: { path: '/models/Tulips Bouquet.glb' },
    scale: 1,
    rotation: [0, Math.PI / 4, 0]
  },
  sunflower: {
    single: { path: '/models/sunflower.glb' },
    bouquet: {
      path: '/models/Sunflower Bouquet.glb', 
      scale:1,
    },
    scale: 1,
    rotation: [0, 0, 0]
  },
  lily: {
    single: { path: '/models/lily.glb' },
    bouquet: {
      path: '/models/Lily Bouquet.glb',
      scale: 1.2,
    },
    scale: 1,
    rotation: [0, 0, 0]
  },
  carnation: {
    single: { path: '/models/carnation.glb' },
    bouquet: { 
      path: '/models/Carnation Bouquet.glb',
      scale: 1, 
    },
    scale: 1,
    rotation: [0, 0, 0]
  },
  peony: {
    single: { path: '/models/peony.glb' },
    bouquet: {
      path: '/models/Peony Bouquet.glb', 
      scale: 1.2,
    },
    scale: 0.7,
    rotation: [0, 0, 0]
  }
};

// Material configurations
const MATERIALS = {
  petal: {
    roughness: 0.7,
    metalness: 0.1
  },
  leaf: {
    roughness: 0.8,
    metalness: 0.1
  },
  stem: {
    roughness: 0.9,
    metalness: 0.05
  },
  wrapper: {
    roughness: 0.8,
    metalness: 0.1,
    color: '#FFFFFF'
  },
  diskfloret: {
    roughness: 0.9,
    metalness: 0.1,
    color: '#654321' // A brown color for the sunflower center
  }
};

const FlowerModel = React.memo(({ 
  flowerType = 'rose', 
  arrangement = 'single',
  color = '#ff69b4',
  position = [0, 0, 0],
  castShadow = true,
  receiveShadow = true
}) => {
  const group = useRef();
  const previousKey = useRef(`${flowerType}-${arrangement}`);
  
  // Get the model config or default to rose if not found
  const modelConfig = useMemo(() => {
    const flowerData = FLOWER_MODELS[flowerType] || FLOWER_MODELS.rose;
    const arrangementData = flowerData[arrangement] || flowerData.single;
    return {
      ...flowerData, // base rotation, scale
      ...arrangementData, // override with arrangement-specific path, scale, etc.
    };
  }, [flowerType, arrangement]);
  
  // Handle WebGL context loss
  useEffect(() => {
    const handleContextLost = (event) => {
      event.preventDefault();
      console.log('WebGL Context lost. Attempting to recover...');
    };

    const handleContextRestored = () => {
      console.log('WebGL Context restored.');
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
  
  // Load the model with error handling and resource management
  const { scene, animations } = useGLTF(modelConfig.path, true, (error) => {
    console.error('Error loading model:', error);
  });
  
  const { actions } = useAnimations(animations, group);
  
  // Clean up resources when changing flower type
  useEffect(() => {
    return () => {
      // Clean up animations
      if (actions) {
        Object.values(actions).forEach(action => {
          if (action && typeof action.stop === 'function') {
            action.stop();
          }
        });
      }
      
      // Force garbage collection if possible
      if (window.gc) {
        window.gc();
      }
      
      previousKey.current = `${flowerType}-${arrangement}`;
    };
  }, [flowerType, arrangement, actions]);
  
  // Memoize materials to prevent unnecessary re-renders
  const materials = useMemo(() => {
    const createMaterial = (type) => {
      const config = MATERIALS[type] || MATERIALS.petal;
      let baseColor;
      if (type === 'petal') {
        baseColor = color;
      } else {
        baseColor = config.color || (type === 'leaf' ? '#4CAF50' : '#8BC34A');
      }

      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseColor),
        ...config,
        transparent: true,
        opacity: type === 'wrapper' ? 0.8 : 0.9
      });
    };
    
    return {
      petal: createMaterial('petal'),
      leaf: createMaterial('leaf'),
      stem: createMaterial('stem'),
      wrapper: createMaterial('wrapper'),
      diskfloret: createMaterial('diskfloret'),
    };
  }, [color]);

  // Apply materials to the model
  useEffect(() => {
    if (!scene) return;
    
    const cleanup = () => {
      // Cleanup animations and materials
      if (actions) {
        Object.values(actions).forEach(action => {
          if (action && typeof action.stop === 'function') {
            action.stop();
          }
        });
      }
      
      // Dispose of materials and geometries
      scene.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    };

    try {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = castShadow;
          child.receiveShadow = receiveShadow;
          
          const name = child.name.toLowerCase();

          // Prioritize wrapper material assignment for bouquets
          if (name.includes('diskfloret')) {
            child.material = materials.diskfloret;
          } else if (arrangement === 'bouquet' && (name.includes('wrapper') || name.includes('wrap'))) {
            child.material = materials.wrapper;
          } else if (name.includes('leaf') || name.includes('leaves')) {
            child.material = materials.leaf;
          } else if (name.includes('stem') || name.includes('branch') || name.includes('stick')) {
            child.material = materials.stem;
          } else if (name.includes('petal') || name.includes('flower') || name.includes(flowerType)) {
            child.material = materials.petal; // This is the main flower part
          } else if (arrangement === 'single') {
            // Fallback for any un-named parts, default to the selected flower color.
            // This is useful for simple single-part models.
            child.material = materials.petal;
          }
        }
      });
      
      // Scale and position the model
      if (group.current) {
        group.current.scale.set(modelConfig.scale, modelConfig.scale, modelConfig.scale);
        group.current.rotation.set(...modelConfig.rotation);
      }
      
      // Play animations if any
      if (animations?.length > 0) {
        const action = actions[animations[0]?.name];
        if (action) {
          action.reset().fadeIn(0.5).play().catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error setting up model:', error);
      cleanup();
    }

    return cleanup;
  }, [scene, materials, animations, actions, castShadow, receiveShadow, modelConfig.scale, modelConfig.rotation]);

  
  return (
    <group 
      ref={group} 
      position={position}
      rotation={modelConfig.rotation}
      scale={modelConfig.scale}
    >
      <primitive 
        object={scene} 
        dispose={null} 
      />
    </group>
  );
}, (prevProps, nextProps) => {
  // Only re-render if color or flowerType changes
  return prevProps.color === nextProps.color && 
         prevProps.flowerType === nextProps.flowerType &&
         prevProps.arrangement === nextProps.arrangement;
});

// Preload models for better UX
Object.values(FLOWER_MODELS).forEach((flower) => {
  if (flower.single?.path) useGLTF.preload(flower.single.path);
  if (flower.bouquet?.path) useGLTF.preload(flower.bouquet.path);
});

// Display name for better debugging
FlowerModel.displayName = 'FlowerModel';

export default FlowerModel;