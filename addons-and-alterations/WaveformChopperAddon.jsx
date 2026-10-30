import React, { useState, useRef, useEffect } from 'react';

/**
 * Addon Module: Interactive Waveform Chopper & Trimming Deck
 * Layout: Left-Side Bento Deck placement
 * Pure JavaScript / React JSX implementation for BredForge M8 tracker.
 */
export default function WaveformChopperAddon({ sampleData, onTrimChange }) {
  const canvasRef = useRef(null);
  const [trimStart, setTrimStart] = useState(0.0); // 0.0 to 1.0 ratio
  const [trimEnd, setTrimEnd] = useState(1.0);     // 0.0 to 1.0 ratio
  const [isDragging, setIsDragging] = useState(null); // 'start' | 'end' | null

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background (Deep Bento void-black)
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Draw simulated or actual waveform data
    ctx.strokeStyle = '#38bdf8'; // Glowing phosphor blue
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const data = sampleData || generateDummyWaveform(width);
    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      const y = (v * height / 2) + (height / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();

    // Draw Trim Regions (Dim outside selection, bright inside)
    const startPx = trimStart * width;
    const endPx = trimEnd * width;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, startPx, height);
    ctx.fillRect(endPx, 0, width - endPx, height);

    // Draw Trim Handles (Amber / M8 accent)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(startPx - 2, 0, 4, height);
    ctx.fillRect(endPx - 2, 0, 4, height);

  }, [sampleData, trimStart, trimEnd]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const startPx = trimStart * width;
    const endPx = trimEnd * width;

    if (Math.abs(clickX - startPx) < 10) {
      setIsDragging('start');
    } else if (Math.abs(clickX - endPx) < 10) {
      setIsDragging('end');
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = x / rect.width;

    if (isDragging === 'start' && ratio < trimEnd) {
      setTrimStart(ratio);
      if (onTrimChange) onTrimChange(ratio, trimEnd);
    } else if (isDragging === 'end' && ratio > trimStart) {
      setTrimEnd(ratio);
      if (onTrimChange) onTrimChange(trimStart, ratio);
    }
  };

  const handleMouseUp = () => setIsDragging(null);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-200 font-mono shadow-xl">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">Sample Chopper & Trimmer</span>
        <span className="text-[10px] text-gray-400">
          {(trimStart * 100).toFixed(1)}% - {(trimEnd * 100).toFixed(1)}%
        </span>
      </div>

      <div className="relative cursor-ew-resize">
        <canvas
          ref={canvasRef}
          width={300}
          height={80}
          className="w-full rounded bg-gray-950 border border-gray-800"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-gray-400">
        <span>Start Trim</span>
        <span>End Trim</span>
      </div>
    </div>
  );
}

function generateDummyWaveform(length) {
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr.push(Math.sin(i * 0.1) * Math.random() * 0.8);
  }
  return arr;
}
