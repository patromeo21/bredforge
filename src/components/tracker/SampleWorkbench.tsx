// ============================================================================
// BREDFORGE v1.0 — UNIFIED SAMPLE WORKBENCH (TRIM + CHOP) [REF: WRKBNCH-01]
// ============================================================================

import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface SliceMarker {
  id: string;
  samplePosition: number; // Position in frames/samples
  normalizedPos: number; // 0.0 to 1.0 position
}

interface SampleWorkbenchProps {
  audioBuffer: AudioBuffer | null;
  sampleName?: string;
  trimStart: number; // 0.0 to 1.0
  trimEnd: number;   // 0.0 to 1.0
  slices: SliceMarker[];
  onUpdateTrim: (start: number, end: number) => void;
  onUpdateSlices: (slices: SliceMarker[]) => void;
  onAssignSliceToPad?: (slice: SliceMarker, padIndex: number) => void;
  onClose?: () => void;
}

export function SampleWorkbench({
  audioBuffer,
  sampleName = 'UNTITLED_SAMPLE.WAV',
  trimStart,
  trimEnd,
  slices,
  onUpdateTrim,
  onUpdateSlices,
  onClose,
}: SampleWorkbenchProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeTool, setActiveTool] = useState<'trim' | 'chop'>('trim');
  const [zoom, setZoom] = useState<number>(1);
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);

  // --------------------------------------------------------------------------
  // WAVEFORM CANVAS RENDERING ENGINE
  // --------------------------------------------------------------------------
  const renderWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    // Background Fill
    ctx.fillStyle = '#09090b'; // zinc-950
    ctx.fillRect(0, 0, width, height);

    // Grid Overlay Lines
    ctx.strokeStyle = '#18181b'; // zinc-900
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Render Waveform Data Peak-to-Peak
    ctx.fillStyle = '#10b981'; // emerald-500
    ctx.beginPath();
    ctx.moveTo(0, amp);

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }

    // Dim Area Outside Trim Points (MPC Trim Overlay)
    const trimStartXPx = trimStart * width;
    const trimEndXPx = trimEnd * width;

    ctx.fillStyle = 'rgba(9, 9, 11, 0.75)';
    ctx.fillRect(0, 0, trimStartXPx, height);
    ctx.fillRect(trimEndXPx, 0, width - trimEndXPx, height);

    // Render Trim Boundary Markers
    ctx.strokeStyle = '#f59e0b'; // amber-500
    ctx.lineWidth = 2;

    // Trim Start Marker
    ctx.beginPath();
    ctx.moveTo(trimStartXPx, 0);
    ctx.lineTo(trimStartXPx, height);
    ctx.stroke();

    // Trim End Marker
    ctx.beginPath();
    ctx.moveTo(trimEndXPx, 0);
    ctx.lineTo(trimEndXPx, height);
    ctx.stroke();

    // Render SP-Style Slice Markers
    slices.forEach((slice, idx) => {
      const sliceXPx = slice.normalizedPos * width;
      ctx.strokeStyle = '#38bdf8'; // sky-400
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);

      ctx.beginPath();
      ctx.moveTo(sliceXPx, 0);
      ctx.lineTo(sliceXPx, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Slice Number Label
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`S${idx + 1}`, sliceXPx + 4, 12);
    });
  }, [audioBuffer, trimStart, trimEnd, slices]);

  // Handle Resize & Canvas Initialization
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        renderWaveform();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderWaveform]);

  useEffect(() => {
    renderWaveform();
  }, [renderWaveform]);

  // --------------------------------------------------------------------------
  // INTERACTIVE TOUCH & DRAG HANDLERS
  // --------------------------------------------------------------------------
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioBuffer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickNormalized = Math.max(0, Math.min(1, x / rect.width));

    if (activeTool === 'trim') {
      const distToStart = Math.abs(clickNormalized - trimStart);
      const distToEnd = Math.abs(clickNormalized - trimEnd);

      if (distToStart < 0.05 && distToStart < distToEnd) {
        setDraggingHandle('start');
      } else if (distToEnd < 0.05) {
        setDraggingHandle('end');
      }
    } else if (activeTool === 'chop') {
      // Add a manual slice marker at point
      const newSlice: SliceMarker = {
        id: `slice_${Date.now()}`,
        samplePosition: Math.floor(clickNormalized * audioBuffer.length),
        normalizedPos: clickNormalized,
      };
      const updated = [...slices, newSlice].sort((a, b) => a.normalizedPos - b.normalizedPos);
      onUpdateSlices(updated);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingHandle || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPos = Math.max(0, Math.min(1, x / rect.width));

    if (draggingHandle === 'start' && newPos < trimEnd - 0.02) {
      onUpdateTrim(newPos, trimEnd);
    } else if (draggingHandle === 'end' && newPos > trimStart + 0.02) {
      onUpdateTrim(trimStart, newPos);
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingHandle(null);
  };

  // Auto Transient Chopper Algorithm
  const handleAutoChop = () => {
    if (!audioBuffer) return;
    const channelData = audioBuffer.getChannelData(0);
    const threshold = 0.25;
    const newSlices: SliceMarker[] = [];
    const minDistanceSamples = audioBuffer.sampleRate * 0.1; // 100ms spacing minimum

    let lastSlicePos = -minDistanceSamples;

    for (let i = 0; i < channelData.length; i += 256) {
      if (Math.abs(channelData[i]) > threshold && i - lastSlicePos > minDistanceSamples) {
        const normalized = i / channelData.length;
        if (normalized >= trimStart && normalized <= trimEnd) {
          newSlices.push({
            id: `slice_auto_${i}`,
            samplePosition: i,
            normalizedPos: normalized,
          });
          lastSlicePos = i;
        }
      }
    }

    onUpdateSlices(newSlices);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-zinc-300 select-none">
      
      {/* Top Header & Context Switcher */}
      <div className="flex justify-between items-center mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            WORKBENCH
          </span>
          <span className="text-[11px] font-bold text-zinc-200 truncate max-w-[140px]">
            {sampleName}
          </span>
        </div>

        {/* Mode Toggle Controls */}
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
          <button
            onClick={() => setActiveTool('trim')}
            className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${
              activeTool === 'trim'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            TRIM (MPC)
          </button>
          <button
            onClick={() => setActiveTool('chop')}
            className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${
              activeTool === 'chop'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CHOP (SP)
          </button>
        </div>
      </div>

      {/* Interactive Waveform Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 min-h-[90px] bg-zinc-950 rounded border border-zinc-800 relative overflow-hidden cursor-crosshair"
      >
        {!audioBuffer ? (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600">
            NO AUDIO BUFFER LOADED
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="w-full h-full block"
          />
        )}
      </div>

      {/* Workbench Action Toolbar */}
      <div className="flex justify-between items-center mt-2 shrink-0 gap-1 text-[9px]">
        <div className="flex gap-1">
          <button
            onClick={handleAutoChop}
            disabled={!audioBuffer}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 active:bg-amber-500 active:text-zinc-950 border border-zinc-800 rounded font-bold text-amber-400 cursor-pointer disabled:opacity-40"
          >
            AUTO-TRANSIENT
          </button>
          <button
            onClick={() => onUpdateSlices([])}
            disabled={slices.length === 0}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 cursor-pointer disabled:opacity-40"
          >
            CLEAR SLICES ({slices.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[8px] text-zinc-500">
            TRIM: {(trimStart * 100).toFixed(0)}%–{(trimEnd * 100).toFixed(0)}%
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 font-bold rounded cursor-pointer"
            >
              HIDE
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

export default SampleWorkbench;
