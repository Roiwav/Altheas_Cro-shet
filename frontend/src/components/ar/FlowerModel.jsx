import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
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
    roughness: 0.9, // Increased roughness for a soft, matte look
    metalness: 0.0, // Non-metallic
  },
  leaf: {
    roughness: 0.95, // Very rough, diffuse surface
    metalness: 0.0,
    color: '#4CAF50', // A standard green for leaves
  },
  stem: {
    roughness: 0.95,
    metalness: 0.0,
    color: '#8BC34A', // A lighter green for stems
  },
  wrapper: {
    roughness: 0.4, // Kept a bit shiny for a plastic/cellophane look
    metalness: 0.0, // Still non-metallic
    color: '#FFFFFF'
  },
  diskfloret: {
    roughness: 0.95,
    metalness: 0.0,
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
          
          // Clone the original material to preserve texture maps (like normal maps)
          const originalMaterial = child.material;
          if (!originalMaterial) return;

          const newMaterial = originalMaterial.clone();
          newMaterial.side = THREE.DoubleSide; // Ensure both sides render

          const name = child.name.toLowerCase();

          // Prioritize non-petal parts first to ensure they always have the correct color.
          if (arrangement === 'bouquet' && (name.includes('wrapper') || name.includes('wrap'))) {
            // Wrappers are always white and semi-transparent
            newMaterial.color.set(MATERIALS.wrapper.color);
            newMaterial.transparent = true;
            newMaterial.opacity = 0.8;
            newMaterial.roughness = MATERIALS.wrapper.roughness;
          } else if (name.includes('leaf') || name.includes('leaves')) {
            newMaterial.color.set(MATERIALS.leaf.color);
            newMaterial.roughness = MATERIALS.leaf.roughness;
            newMaterial.metalness = MATERIALS.leaf.metalness;
          } else if (name.includes('stem') || name.includes('branch') || name.includes('stick')) {
            newMaterial.color.set(MATERIALS.stem.color);
            newMaterial.roughness = MATERIALS.stem.roughness;
            newMaterial.metalness = MATERIALS.stem.metalness;
          } else if (name.includes('diskfloret')) {
            // Special case for sunflower center
            newMaterial.color.set(MATERIALS.diskfloret.color);
            newMaterial.roughness = MATERIALS.diskfloret.roughness;
            newMaterial.metalness = MATERIALS.diskfloret.metalness;
            child.material = newMaterial;
          } else if (name.includes('petal') || name.includes('flower') || name.includes(flowerType)) {
            // Modify the cloned material to set the color while preserving the original texture maps for a rough look.
            newMaterial.color.set(color);
            newMaterial.roughness = MATERIALS.petal.roughness;
            newMaterial.metalness = MATERIALS.petal.metalness;
            child.material = newMaterial;
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
  }, [scene, color, arrangement, flowerType, animations, actions, castShadow, receiveShadow, modelConfig.scale, modelConfig.rotation]);

  // Add a gentle swaying animation for a more dynamic feel
  useFrame(({ clock }) => {
    if (group.current) {
      const elapsedTime = clock.getElapsedTime();
      // Gentle sway on Z-axis (back and forth)
      group.current.rotation.z = modelConfig.rotation[2] + Math.sin(elapsedTime * 0.7) * 0.05;
      // Gentle rotation on Y-axis (turning)
      group.current.rotation.y = modelConfig.rotation[1] + Math.cos(elapsedTime * 0.5) * 0.05;
    }
  });

  
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