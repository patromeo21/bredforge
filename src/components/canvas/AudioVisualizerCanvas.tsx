// ============================================================================
// BREDFORGE v1.0 — 120FPS OSCILLOSCOPE & AUDIO VISUALIZER [REF: VIZ-01]
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../services/AudioEngine';

export interface AudioVisualizerCanvasProps {
  width?: number;
  height?: number;
  lineColor?: string; // e.g. '#f59e0b' (amber) or '#34d399' (emerald)
}

export function AudioVisualizerCanvas({
  width = 300,
  height = 80,
  lineColor = '#f59e0b',
}: AudioVisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const analyser = audioEngine.getAnalyser();

    const bufferLength = analyser ? analyser.frequencyBinCount : 1024;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      ctx.fillStyle = '#09090b'; // zinc-950 background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        dataArray.fill(128);
      }

      ctx.lineWidth = 2;
      ctx.strokeStyle = lineColor;
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Retro scanlines
      ctx.fillStyle = 'rgba(245, 158, 11, 0.03)';
      for (let gy = 0; gy < canvas.height; gy += 4) {
        ctx.fillRect(0, gy, canvas.width, 1);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [lineColor]);

  return (
    <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 shadow-inner w-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full block"
      />
      <div className="absolute top-1 left-2 text-[8px] font-mono text-zinc-500 tracking-widest pointer-events-none">
        OSC // 120FPS PHOSPHOR
      </div>
    </div>
  );
}

export default AudioVisualizerCanvas;
