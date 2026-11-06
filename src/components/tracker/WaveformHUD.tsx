// ============================================================================
// NATIVE CANVAS AUDIO RENDERING HUD (WaveformHUD.tsx)
// ============================================================================

import React, { useRef, useEffect, useCallback } from 'react';

export interface WaveformHUDProps extends React.HTMLAttributes<HTMLDivElement> {
  audioBuffer?: AudioBuffer | Float32Array | null;
  sampleStart?: number; // 0.0 to 1.0
  sampleEnd?: number;   // 0.0 to 1.0
  zoomLevel?: number;
  panOffset?: number;
  onRangeChange?: (start: number, end: number) => void;
  [key: string]: any;
}

export const WaveformHUD: React.FC<WaveformHUDProps> = ({
  audioBuffer,
  sampleStart = 0.0,
  sampleEnd = 1.0,
  zoomLevel = 1.0,
  panOffset = 0.0,
  onRangeChange,
  ...restProps
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render authentic Float32Array audio peaks onto HTML5 canvas
  const renderWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#090d16'; // Deep background
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#10b981'; // Emerald accent line
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    let channelData: Float32Array | null = null;
    if (audioBuffer instanceof Float32Array) {
      channelData = audioBuffer;
    } else if (audioBuffer && typeof audioBuffer.getChannelData === 'function') {
      channelData = audioBuffer.getChannelData(0);
    }

    if (channelData && channelData.length > 0) {
      const len = channelData.length;
      const visibleSamples = Math.floor(len / zoomLevel);
      const startSample = Math.floor(panOffset * len);
      const step = Math.max(1, Math.floor(visibleSamples / width));

      const sliceWidth = width / width;
      let x = 0;

      for (let i = 0; i < width; i++) {
        const dataIndex = Math.min(len - 1, startSample + (i * step));
        const val = channelData[dataIndex] || 0;
        const y = (height / 2) + (val * (height / 2) * 0.9);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
    } else {
      // Fallback grid graticule if no active audio buffer is loaded
      ctx.strokeStyle = '#1f2937';
      ctx.beginPath();
      for (let x = 0; x < width; x += 30) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 20) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Synthetic baseline sine wave preview
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      for (let i = 0; i < width; i++) {
        const y = (height / 2) + Math.sin(i * 0.05) * (height * 0.3);
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
    }

    ctx.stroke();

    // Render Start & End Marker Overlays
    const startX = sampleStart * width;
    const endX = sampleEnd * width;

    ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
    ctx.fillRect(startX, 0, Math.max(2, endX - startX), height);

    ctx.strokeStyle = '#22c55e'; // Green Start Marker
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    ctx.strokeStyle = '#ef4444'; // Red End Marker
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();
  }, [audioBuffer, sampleStart, sampleEnd, zoomLevel, panOffset]);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderWaveform();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderWaveform]);

  return (
    <div
      {...restProps}
      className="flex flex-col w-full bg-zinc-950 border border-emerald-500/30 rounded p-3 font-mono text-xs select-none gap-2"
    >
      <div className="flex justify-between items-center text-emerald-400">
        <span className="font-bold tracking-wider">AUDIO WAVEFORM HUD</span>
        <span className="text-[10px] text-emerald-600">
          START: {(sampleStart * 100).toFixed(1)}% | END: {(sampleEnd * 100).toFixed(1)}%
        </span>
      </div>

      <div className="w-full h-32 bg-black border border-emerald-500/20 rounded relative overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={120}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};