// ============================================================================
// BREDFORGE v1.0 — AUDIO VISUALIZER CANVAS [REF: VISUALIZER-CANVAS-01]
// ============================================================================

import React, { useRef, useEffect, useState } from 'react';
import { audioVisualizerService, VisualizerMode } from '../../services/AudioVisualizerService';

export function AudioVisualizerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('waveform');
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Handle high-DPI scaling for crisp rendering on retina/iPad screens
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Render single frame
      audioVisualizerService.renderFrame(canvas, ctx, mode);
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mode]);

  const toggleMode = () => {
    const nextMode: VisualizerMode = mode === 'waveform' ? 'frequency' : 'waveform';
    setMode(nextMode);
    audioVisualizerService.setMode(nextMode);
  };

  return (
    <div className="flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl p-2 gap-2 font-mono text-xs select-none shadow-lg">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] text-amber-500 font-bold tracking-wider">
          SPECTRUM ANALYSER // {mode.toUpperCase()}
        </span>
        <button
          onClick={toggleMode}
          className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 hover:border-amber-500 text-zinc-300 rounded text-[10px] transition-colors cursor-pointer"
        >
          SWITCH VIEW
        </button>
      </div>

      <div className="relative w-full h-24 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-900 shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
}

export default AudioVisualizerCanvas;
