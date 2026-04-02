import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { RefreshCw, Maximize2 } from 'lucide-react';

export default function Viewport3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

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
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: '#8b5cf6', // purple-500
      roughness: 0.4,
      metalness: 0.1,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.y = 0.5;
    cube.castShadow = true;
    cubeRef.current = cube;
    scene.add(cube);

    // Render Loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      // Rotate cube as a placeholder game loop action
      if (cubeRef.current) {
        cubeRef.current.rotation.x += 0.01;
        cubeRef.current.rotation.y += 0.01;
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
      
      if (rendererRef.current && rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
      
      // Memory Cleanup
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  const handleReset = () => {
    if (cubeRef.current) {
      cubeRef.current.rotation.set(0, 0, 0);
      cubeRef.current.position.set(0, 0.5, 0);
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
      {/* 3D Container */}
      <div ref={containerRef} className="w-full h-full outline-none" />

      {/* Engine Overlay UI */}
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
