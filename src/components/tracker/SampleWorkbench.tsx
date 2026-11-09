// ============================================================================
// BREDFORGE v1.0 — INTERACTIVE SAMPLE WORKBENCH & SLICER [REF: WORKBENCH-01]
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { audioEngine } from '../../services/AudioEngine';

export type SliceMarker = number;

export interface SampleWorkbenchProps {
  audioBuffer?: AudioBuffer | null;
  trimStart?: number; // 0.0 to 1.0 normalized
  trimEnd?: number;   // 0.0 to 1.0 normalized
  slices?: SliceMarker[];  // Array of normalized slice positions (0.0 to 1.0)
  onUpdateTrim?: (start: number, end: number) => void;
  onUpdateSlices?: (slices: SliceMarker[]) => void;
}

export function SampleWorkbench({
  audioBuffer = null,
  trimStart = 0.0,
  trimEnd = 1.0,
  slices = [0.25, 0.5, 0.75],
  onUpdateTrim = () => {},
  onUpdateSlices = () => {},
}: SampleWorkbenchProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [localStart, setLocalStart] = useState<number>(trimStart);
  const [localEnd, setLocalEnd] = useState<number>(trimEnd);
  const [localSlices, setLocalSlices] = useState<SliceMarker[]>(slices);
  const [activeSlice, setActiveSlice] = useState<number | null>(null);
  const [sampleName, setSampleName] = useState<string>('BRED_BREAK_01.WAV');

  // Sync props if updated externally
  useEffect(() => {
    setLocalStart(trimStart);
    setLocalEnd(trimEnd);
    setLocalSlices(slices);
  }, [trimStart, trimEnd, slices]);

  // Render Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#09090b'; // zinc-950
    ctx.fillRect(0, 0, width, height);

    // Get channel data or generate synthetic preview waveform if no buffer loaded
    let channelData: Float32Array;
    if (audioBuffer && audioBuffer.numberOfChannels > 0) {
      channelData = audioBuffer.getChannelData(0);
    } else {
      // Synthetic drum break preview waveform
      channelData = new Float32Array(800);
      for (let i = 0; i < 800; i++) {
        const envelope = Math.sin((i / 800) * Math.PI * 8) * Math.exp(-(i % 100) / 30);
        channelData[i] = (Math.random() * 0.6 - 0.3) + envelope * 0.8;
      }
    }

    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    // Draw Waveform centerline
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.lineTo(width, amp);
    ctx.stroke();

    // Draw Waveform bars (Amber phosphor style)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      const dataIndex = Math.floor(i * step);
      const val = channelData[dataIndex] || 0;
      const y = amp + val * amp * 0.85;

      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();

    // Draw Trim Regions (Dim out unselected regions)
    const startX = localStart * width;
    const endX = localEnd * width;

    ctx.fillStyle = 'rgba(9, 9, 11, 0.75)';
    ctx.fillRect(0, 0, startX, height);
    ctx.fillRect(endX, 0, width - endX, height);

    // Draw Trim Handles
    ctx.strokeStyle = '#34d399'; // Emerald for trim
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    // Draw Slices
    localSlices.forEach((slicePos, idx) => {
      const sliceX = slicePos * width;
      ctx.strokeStyle = activeSlice === idx ? '#60a5fa' : '#f43f5e'; // Blue when active, rose for slices
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sliceX, 0);
      ctx.lineTo(sliceX, height);
      ctx.stroke();
    });

  }, [audioBuffer, localStart, localEnd, localSlices, activeSlice]);

  const handleTrimChange = (newStart: number, newEnd: number) => {
    setLocalStart(newStart);
    setLocalEnd(newEnd);
    onUpdateTrim(newStart, newEnd);
  };

  const handleAutoSlice = (count: number) => {
    const newSlices: SliceMarker[] = [];
    const span = localEnd - localStart;
    for (let i = 1; i < count; i++) {
      newSlices.push(localStart + (span * i) / count);
    }
    setLocalSlices(newSlices);
    onUpdateSlices(newSlices);
  };

  const triggerSliceAudio = (sliceIndex: number) => {
    setActiveSlice(sliceIndex);
    audioEngine.triggerPad(sliceIndex % 16, 120);
    setTimeout(() => setActiveSlice(null), 150);
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-3 gap-3 select-none overflow-hidden border border-zinc-800 rounded-lg">
      
      {/* Workbench Header & File Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-lg gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            SAMPLE WORKBENCH // TRIM & SLICE
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            FILE: {sampleName}
          </span>
        </div>

        {/* Auto-Slice Action Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-500">AUTO-SLICE:</span>
          {[4, 8, 16].map((count) => (
            <button
              key={count}
              onClick={() => handleAutoSlice(count)}
              className="px-2 py-1 text-[9px] font-bold bg-zinc-950 text-amber-400 border border-zinc-800 hover:border-zinc-700 rounded cursor-pointer transition-all"
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Waveform Visualization Canvas Container */}
      <div className="flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 gap-2 shrink-0">
        <div className="relative w-full h-36 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 shadow-inner">
          <canvas
            ref={canvasRef}
            width={600}
            height={144}
            className="w-full h-full block cursor-crosshair"
          />
          <div className="absolute top-1 left-2 text-[8px] text-zinc-500 pointer-events-none">
            WAVEFORM VIEW // TRIM START: {(localStart * 100).toFixed(1)}% | END: {(localEnd * 100).toFixed(1)}%
          </div>
        </div>

        {/* Trim Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-zinc-400">
              <span>TRIM START</span>
              <span className="text-emerald-400">{(localStart * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.95"
              step="0.01"
              value={localStart}
              onChange={(e) => handleTrimChange(Number(e.target.value), localEnd)}
              className="accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-zinc-400">
              <span>TRIM END</span>
              <span className="text-emerald-400">{(localEnd * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.01"
              value={localEnd}
              onChange={(e) => handleTrimChange(localStart, Number(e.target.value))}
              className="accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Slices Audition Pad Grid */}
      <div className="flex-1 flex flex-col gap-2 bg-zinc-900/20 border border-zinc-800/80 rounded-xl p-3 overflow-y-auto">
        <div className="flex justify-between items-center text-[10px] text-zinc-400">
          <span className="font-bold text-amber-400">AUDITION SLICES ({localSlices.length + 1} REGIONS)</span>
          <span>TAP PAD TO AUDITION</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {Array.from({ length: 16 }).map((_, idx) => {
            const isPlaying = activeSlice === idx;
            const sliceMarker = localSlices[idx];

            return (
              <button
                key={idx}
                onClick={() => triggerSliceAudio(idx)}
                className={`flex flex-col justify-between p-3 h-20 rounded-xl border cursor-pointer transition-all ${
                  isPlaying
                    ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.4)] font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-amber-400'
                }`}
              >
                <div className="flex justify-between w-full text-[8px]">
                  <span className="text-zinc-500">{idx < 9 ? `0${idx + 1}` : idx + 1}</span>
                  <span className={isPlaying ? 'text-blue-400' : 'text-zinc-600'}>●</span>
                </div>
                <div className="flex justify-center items-center my-auto">
                  <span className="text-xs font-bold">
                    SLC {idx + 1}
                  </span>
                </div>
                <div className="text-[7px] text-zinc-500 text-center">
                  {sliceMarker !== undefined ? `${(sliceMarker * 100).toFixed(0)}%` : 'FULL'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[9px] text-zinc-500 px-1 shrink-0">
        <span>Adjust trim bounds and auto-slice waveforms for multi-pad sample mapping.</span>
        <span className="text-amber-400 font-bold">M8 SAMPLE WORKBENCH</span>
      </div>

    </div>
  );
}

export default SampleWorkbench;
