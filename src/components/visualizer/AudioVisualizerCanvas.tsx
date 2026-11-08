// ============================================================================
// BREDFORGE v1.0 — HIGH-DENSITY OSCILLOSCOPE CANVAS [REF: M49]
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { audioVisualizerService } from '../../services/audio/AudioVisualizerService';

export function AudioVisualizerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    // Handle high-DPI retina scaling for iPad 9th Gen
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      // Measure performance stats
      frameCount++;
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // Double-buffer background clear & grid matrix
      ctx.fillStyle = '#09090b'; // zinc-950
      ctx.fillRect(0, 0, width, height);

      // Draw subtle oscilloscope grid lines
      ctx.strokeStyle = 'rgba(39, 39, 42, 0.4)'; // zinc-800
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Fetch pre-allocated time domain data from visualizer service
      const timeData = audioVisualizerService.getByteTimeDomainData();
      if (!timeData || timeData.length === 0) return;

      // Draw high-density waveform trace
      ctx.strokeStyle = '#f59e0b'; // amber-500
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const sliceWidth = width / timeData.length;
      let x = 0;

      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0; // normalize around 1.0 center
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow for performance

      // Render diagnostic HUD overlay on canvas
      ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.font = '9px monospace';
      ctx.fillText(`FPS: ${fps} // 120HZ TARGET`, 10, 16);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-lg bg-zinc-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
      />
    </div>
  );
}

export default AudioVisualizerCanvas;