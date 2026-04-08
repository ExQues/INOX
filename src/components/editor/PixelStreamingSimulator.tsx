import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Settings, Loader2, Play, Maximize, AlertCircle } from 'lucide-react';

interface PixelStreamingSimulatorProps {
  isSyncing: boolean;
}

export default function PixelStreamingSimulator({ isSyncing }: PixelStreamingSimulatorProps) {
  const [metrics, setMetrics] = useState({
    fps: 60,
    latency: 12,
    bitrate: 45.2
  });

  const [booting, setBooting] = useState(true);

  // Simular métricas oscilando (Cloud Gaming feel)
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        fps: Math.floor(58 + Math.random() * 4), // 58-61 fps
        latency: Math.floor(10 + Math.random() * 8), // 10-18 ms
        bitrate: parseFloat((40 + Math.random() * 10).toFixed(1)) // 40-50 Mbps
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simular tempo de inicialização da Engine Remota (se não estiver syncando)
  useEffect(() => {
    if (!isSyncing) {
      setBooting(true);
      const timer = setTimeout(() => {
        setBooting(false);
      }, 3500); // 3.5s boot time
      return () => clearTimeout(timer);
    }
  }, [isSyncing]);

  if (isSyncing) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
        {/* Abstract background for syncing */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black"></div>
        <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-6 z-10" />
        <h2 className="text-2xl font-bold text-white tracking-widest z-10">COMPILANDO ASSETS AAA</h2>
        <p className="text-slate-400 mt-2 font-mono text-sm z-10">Enviando Blueprints e Geometria para a Unreal Engine 5...</p>
        
        {/* Progress Bar Mock */}
        <div className="w-64 h-1 bg-slate-800 rounded-full mt-8 z-10 overflow-hidden">
          <div className="h-full bg-orange-500 animate-[pulse_2s_ease-in-out_infinite] w-full origin-left scale-x-50"></div>
        </div>
      </div>
    );
  }

  if (booting) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center font-mono">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin mb-6"></div>
        <div className="text-green-500 text-sm space-y-1 w-full max-w-md">
          <p>[0.000s] Inicializando Instância de Renderização em Nuvem...</p>
          <p>[0.124s] Alocando GPU (NVIDIA RTX 4090 Virtualizada)...</p>
          <p>[0.840s] Carregando Nível "My_Project_Map.umap"...</p>
          <p>[1.200s] Compilando Shaders (Subsurface Scattering, Nanite)...</p>
          <p>[2.500s] Estabelecendo conexão WebRTC (Pixel Streaming)...</p>
          <p className="text-white mt-4 font-bold">Conectando ao Stream de Vídeo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black overflow-hidden group">
      {/* 
        The Video Background (Simulating the AAA Unreal Engine Feed).
        Using a high-quality cinematic game/environment loop placeholder. 
        Note: Using a reliable stock video of a stunning 3D environment.
      */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
        src="https://cdn.pixabay.com/video/2020/05/25/40141-424888126_large.mp4" // Placeholder sci-fi/fantasy landscape
      />
      
      {/* Fallback Overlay to explain it's a simulation to the user */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>

      {/* Top Telemetry Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
        <div className="flex gap-2">
          <div className="bg-black/60 backdrop-blur-md border border-slate-700/50 rounded px-3 py-1 flex items-center gap-2 text-xs font-mono">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-slate-300">UE5 PIXEL STREAM</span>
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-slate-700/50 rounded px-3 py-1 flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="text-orange-400 font-bold">NANITE</span> ON
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-slate-700/50 rounded px-3 py-1 flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="text-orange-400 font-bold">LUMEN</span> ON
          </div>
        </div>

        <div className="flex flex-col gap-1 items-end">
          <div className="bg-black/80 backdrop-blur-md border border-slate-700/50 rounded px-3 py-1.5 flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-green-400">
              <Activity className="w-3 h-3" />
              <span>{metrics.fps} FPS</span>
            </div>
            <div className="w-px h-3 bg-slate-700"></div>
            <div className="flex items-center gap-1.5 text-blue-400">
              <Wifi className="w-3 h-3" />
              <span>{metrics.latency} ms</span>
            </div>
            <div className="w-px h-3 bg-slate-700"></div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <span>{metrics.bitrate} Mbps</span>
            </div>
            <div className="w-px h-3 bg-slate-700"></div>
            <div className="flex items-center gap-1 text-slate-300 font-bold">
              <span>4K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls / Status */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button className="bg-slate-900/80 hover:bg-slate-800 text-white p-2 rounded-lg border border-slate-700 transition-colors shadow-lg backdrop-blur-sm">
          <Settings className="w-4 h-4" />
        </button>
        <button className="bg-slate-900/80 hover:bg-slate-800 text-white p-2 rounded-lg border border-slate-700 transition-colors shadow-lg backdrop-blur-sm">
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Crosshair / Center UI for game mode */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
        <div className="w-1 h-1 bg-white/80 rounded-full shadow-[0_0_4px_rgba(255,255,255,1)]"></div>
      </div>
      
      {/* Development Notice */}
      <div className="absolute bottom-4 left-4 bg-orange-900/40 border border-orange-500/50 text-orange-200 text-[10px] px-3 py-2 rounded font-mono flex items-center gap-2 max-w-xs backdrop-blur-md">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <div>
          <strong>SIMULAÇÃO:</strong> Você está visualizando o feed Cloud Gaming. Na versão final, este vídeo é o output ao vivo da sua máquina rodando a Unreal Engine.
        </div>
      </div>
    </div>
  );
}