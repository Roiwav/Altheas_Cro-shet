import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// Available flower models with their configurations
const FLOWER_MODELS = {
  rose: {
    path: '/models/rose.glb',
    scale: 0.50,
    rotation: [0, 0, 0]
  },
  tulip: {
    path: '/models/tulips.glb',
    scale: 0.50,
    rotation: [0, Math.PI / 4, 0]
  },
  sunflower: {
    path: '/models/sunflower.glb',
    scale: 0.50,
    rotation: [0, 0, 0]
  },
  lily: {
    path: '/models/lily.glb',
    scale: 0.50,
    rotation: [0, 0, 0]
  },
  carnation: {
    path: '/models/carnation.glb',
    scale: 0.50,
    rotation: [0, 0, 0]
  },
  peony: {
    path: '/models/peony.glb',
    scale: 0.50,
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
  }
};

const FlowerModel = React.memo(({ 
  flowerType = 'rose', 
  color = '#ff69b4',
  position = [0, 0, 0],
  castShadow = true,
  receiveShadow = true
}) => {
  const group = useRef();
  const previousType = useRef(flowerType);
  
  // Get the model config or default to rose if not found
  const modelConfig = FLOWER_MODELS[flowerType] || FLOWER_MODELS.rose;
  
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
  const { scene, animations } = useGLTF(modelConfig.path, true, true, (error) => {
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
      
      previousType.current = flowerType;
    };
  }, [flowerType, actions]);
  
  // Memoize materials to prevent unnecessary re-renders
  const materials = useMemo(() => {
    const createMaterial = (type) => {
      const baseColor = type === 'petal' ? color : type === 'leaf' ? '#4CAF50' : '#8BC34A';
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseColor),
        ...MATERIALS[type] || MATERIALS.petal,
        transparent: true,
        opacity: 0.9
      });
    };
    
    return {
      petal: createMaterial('petal'),
      leaf: createMaterial('leaf'),
      stem: createMaterial('stem')
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
          
          // Apply appropriate material based on mesh name or geometry type
          const name = child.name.toLowerCase();
          if (name.includes('petal') || name.includes('flower')) {
            child.material = materials.petal;
          } else if (name.includes('leaf') || name.includes('leaves')) {
            child.material = materials.leaf;
          } else if (name.includes('stem') || name.includes('branch')) {
            child.material = materials.stem;
          } else {
            // Default to petal material for any other mesh
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

  const config = FLOWER_MODELS[flowerType] || FLOWER_MODELS.rose;
  
  return (
    <group 
      ref={group} 
      position={position}
      rotation={config.rotation}
      scale={config.scale}
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
         prevProps.flowerType === nextProps.flowerType;
});

// Preload models for better UX
Object.values(FLOWER_MODELS).forEach(({ path }) => {
  useGLTF.preload(path);
});

// Display name for better debugging
FlowerModel.displayName = 'FlowerModel';

export default FlowerModel;