// ============================================================================
// BREDFORGE v1.0 — 60FPS CANVAS AUDIO VISUALIZER (AudioVisualizerCanvas.tsx)
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { AudioVisualizerService } from '../../services/audio/AudioVisualizerService';

interface AudioVisualizerCanvasProps {
  visualizerService?: AudioVisualizerService;
  width?: number;
  height?: number;
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerCanvasProps> = ({
  visualizerService,
  width = 400,
  height = 120,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Handle high-DPI scaling for Retina / iPad displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      // Clear canvas with deep industrial background
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, width, height);

      if (!visualizerService) {
        // Draw idle line if no service connected
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      // 1. Render Frequency Spectrum (Bars)
      const freqData = visualizerService.getFrequencyData();
      const barWidth = (width / freqData.length) * 2.2;
      let x = 0;

      for (let i = 0; i < freqData.length; i++) {
        const barHeight = (freqData[i] / 255) * (height * 0.75);

        // Cyberpunk gradient: Emerald to Amber
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#059669'); // emerald-600
        gradient.addColorStop(0.7, '#10b981'); // emerald-500
        gradient.addColorStop(1, '#f59e0b'); // amber-500

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight - 10, barWidth - 1, barHeight);

        x += barWidth + 1;
      }

      // 2. Render Oscilloscope Waveform Overlay
      const timeData = visualizerService.getTimeDomainData();
      ctx.strokeStyle = '#34d399'; // emerald-400
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = width / timeData.length;
      let currX = 0;

      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const currY = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(currX, currY);
        } else {
          ctx.lineTo(currX, currY);
        }
        currX += sliceWidth;
      }
      ctx.stroke();

      // 3. Render Peak VU Level Indicator
      const rms = visualizerService.calculateRMS();
      const vuWidth = Math.min(width, rms * width * 1.5);
      
      ctx.fillStyle = rms > 0.85 ? '#ef4444' : '#10b981'; // Red on clip, emerald normal
      ctx.fillRect(0, height - 4, vuWidth, 4);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [visualizerService, width, height]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="block w-full h-auto"
      />
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded font-mono text-[10px] text-emerald-400 tracking-wider">
        60FPS // VISUALIZER
      </div>
    </div>
  );
};