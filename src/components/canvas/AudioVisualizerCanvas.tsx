// ============================================================================
// BREDFORGE v1.0 — HARDWARE SCOPE VISUALIZER [REF: M42]
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { audioVisualizerService } from '../../services/audio/AudioVisualizerService';

export function AudioVisualizerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      animationId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(39, 39, 42, 0.2)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const data = audioVisualizerService.getByteTimeDomainData();
      if (!data || data.length === 0) return;

      ctx.beginPath();
      const sliceWidth = width / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden p-2 shadow-inner">
      <canvas 
        ref={canvasRef} 
        width={500} 
        height={80} 
        className="w-full h-full rounded border border-zinc-900"
      />
      <div className="absolute top-2 left-3 text-[9px] text-amber-500/70 font-mono tracking-widest pointer-events-none">
        DSP // SCOPE OUT [REF: M42]
      </div>
    </div>
  );
}

export default AudioVisualizerCanvas;