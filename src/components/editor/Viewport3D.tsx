import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useStore } from '../../store/useStore';
import { RefreshCw, Maximize2, Loader2, Play, Square } from 'lucide-react';

export default function Viewport3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  
  // Track multiple models in the scene
  const sceneModelsRef = useRef<{ [id: string]: THREE.Object3D }>({});
  
  // Execution Context Refs
  const userScriptRef = useRef<Function | null>(null);
  const engineContextRef = useRef<any>(null);

  const { activeModelUrl, sceneObjects, activeCode } = useStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize Engine
  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Engine Context
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // slate-900
    scene.fog = new THREE.FogExp2('#0f172a', 0.05);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // performance optimization
    renderer.shadowMap.enabled = true;
    
    // Clear previous canvas if any (Strict React 18 Effect Handling)
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Save refs for resize and cleanup
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // --- Add Default Scene Elements ---
    
    // Grid Helper
    const gridHelper = new THREE.GridHelper(20, 20, '#334155', '#1e293b');
    scene.add(gridHelper);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.4);
    scene.add(ambientLight);

    // Directional Light
    const dirLight = new THREE.DirectionalLight('#ffffff', 1);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Default Player/Cube
    if (!activeModelUrl) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ 
        color: '#8b5cf6', // purple-500
        roughness: 0.4,
        metalness: 0.1,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.y = 0.5;
      cube.castShadow = true;
      modelRef.current = cube;
      scene.add(cube);
    }

    // Add OrbitControls for user interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Create Engine Context for user scripts
    engineContextRef.current = {
      scene,
      camera,
      THREE,
      getModel: () => modelRef.current,
      getSceneObjects: () => sceneModelsRef.current,
      getDeltaTime: () => 0.016, // Simplified for demo
    };

    // Render Loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      controls.update();

      // Execute user script if playing
      if (userScriptRef.current) {
        try {
          userScriptRef.current(engineContextRef.current);
        } catch (e) {
          console.error('Error executing user script:', e);
          userScriptRef.current = null; // Stop execution on error
        }
      } else {
        // Rotate model slightly if it's the default cube and not playing
        if (modelRef.current && !activeModelUrl && sceneObjects.length === 0) {
          modelRef.current.rotation.x += 0.01;
          modelRef.current.rotation.y += 0.01;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    
    // Also trigger resize via ResizeObserver for flexbox changes
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      if (rendererRef.current && rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
      
      // Memory Cleanup
      renderer.dispose();
    };
  }, []);

  // Handle activeModelUrl Changes (Single Object Preview Mode)
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Clear current main model
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    if (activeModelUrl) {
      setIsLoadingModel(true);
      const loader = new GLTFLoader();
      
      loader.load(
        activeModelUrl,
        (gltf) => {
          const model = gltf.scene;
          
          // Center and scale model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          
          // Normalize scale to fit in view
          const scale = 2 / maxDim;
          model.scale.setScalar(scale);
          
          // Center position
          model.position.sub(center.multiplyScalar(scale));
          
          // Add shadows
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          sceneRef.current?.add(model);
          modelRef.current = model;
          setIsLoadingModel(false);
          
          // Reset camera
          if (controlsRef.current && cameraRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            cameraRef.current.position.set(0, 2, 5);
            controlsRef.current.update();
          }
        },
        undefined,
        (error) => {
          console.error('Error loading 3D model:', error);
          setIsLoadingModel(false);
        }
      );
    } else if (sceneObjects.length === 0) {
      // Re-add default cube ONLY if no scene objects and no active preview model
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ 
        color: '#8b5cf6', 
        roughness: 0.4,
        metalness: 0.1,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.y = 0.5;
      cube.castShadow = true;
      sceneRef.current.add(cube);
      modelRef.current = cube;
    }
  }, [activeModelUrl, sceneObjects.length]);

  // Handle Scene Graph Changes (Multiple Objects Mode)
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // 1. Remove objects that are no longer in the state
    Object.keys(sceneModelsRef.current).forEach((id) => {
      const existsInState = sceneObjects.some(obj => obj.id === id);
      if (!existsInState) {
        sceneRef.current?.remove(sceneModelsRef.current[id]);
        delete sceneModelsRef.current[id];
      }
    });

    // 2. Add new objects
    sceneObjects.forEach((obj) => {
      // If we already loaded it, just update position/rotation
      if (sceneModelsRef.current[obj.id]) {
        const model = sceneModelsRef.current[obj.id];
        model.position.set(obj.position[0], obj.position[1], obj.position[2]);
        model.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
        model.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
        return;
      }

      // Otherwise load it
      setIsLoadingModel(true);
      const loader = new GLTFLoader();
      
      loader.load(
        obj.url,
        (gltf) => {
          const model = gltf.scene;
          
          model.position.set(obj.position[0], obj.position[1], obj.position[2]);
          model.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
          model.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
          
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          sceneModelsRef.current[obj.id] = model;
          sceneRef.current?.add(model);
          setIsLoadingModel(false);
        },
        undefined,
        (error) => {
          console.error(`Error loading scene object ${obj.name}:`, error);
          setIsLoadingModel(false);
        }
      );
    });
    
  }, [sceneObjects]);

  const handleReset = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      cameraRef.current.position.set(0, 2, 5);
      controlsRef.current.update();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      // Stop
      setIsPlaying(false);
      userScriptRef.current = null;
      handleReset(); // Reset model position
    } else {
      // Play
      if (activeCode) {
        try {
          // In a production app, use an iframe sandbox or web worker.
          // For this demo IDE, we use new Function with injected scope.
          
          // We inject 'engine' which contains { scene, camera, THREE, getModel, getDeltaTime }
          const wrappedCode = `
            return function(engine) {
              const model = engine.getModel();
              if (!model) return;
              
              const THREE = engine.THREE;
              const dt = engine.getDeltaTime();
              
              // Run user code inside this scope
              ${activeCode}
              
              // Call an update function if user defined one
              if (typeof update === 'function') {
                update(dt, model, THREE);
              }
            }
          `;
          
          const scriptFunc = new Function(wrappedCode)();
          userScriptRef.current = scriptFunc;
          setIsPlaying(true);
        } catch (err) {
          console.error('Failed to compile script:', err);
          alert('Erro de compilação no script gerado. Verifique o console.');
        }
      } else {
        setIsPlaying(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative w-full h-full group bg-slate-950 overflow-hidden">
      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-purple-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-sm font-medium animate-pulse">Carregando modelo 3D ultra-realista...</p>
        </div>
      )}

      {/* 3D Container */}
      <div ref={containerRef} className="w-full h-full outline-none" />

      {/* Engine Overlay UI */}
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={togglePlay}
          className={`flex items-center gap-2 px-3 py-2 backdrop-blur-sm rounded-lg transition shadow-lg border border-slate-700 ${
            isPlaying 
              ? 'bg-red-900/80 text-red-400 hover:bg-red-800' 
              : 'bg-green-900/80 text-green-400 hover:bg-green-800'
          }`}
          title={isPlaying ? "Parar Simulação" : "Executar Script"}
        >
          {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          <span className="text-sm font-bold">{isPlaying ? 'Stop' : 'Play'}</span>
        </button>

        <button 
          onClick={handleReset}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-sm rounded-lg text-slate-300 hover:text-white transition shadow-lg border border-slate-700"
          title="Resetar Cena"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button 
          onClick={toggleFullscreen}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-sm rounded-lg text-slate-300 hover:text-white transition shadow-lg border border-slate-700"
          title="Tela Cheia"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Dev Stats Overlay */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1 pointer-events-none">
        <div className="px-2 py-1 bg-slate-900/80 backdrop-blur text-xs font-mono text-green-400 rounded border border-slate-700/50">
          FPS: 60
        </div>
        <div className="px-2 py-1 bg-slate-900/80 backdrop-blur text-xs font-mono text-blue-400 rounded border border-slate-700/50">
          Render: WebGL2
        </div>
      </div>
    </div>
  );
}
