// ============================================================================
// BREDFORGE v1.0 — UNIFIED SAMPLE WORKBENCH WITH AUDIO PREVIEW [REF: WRKBNCH-02]
// ============================================================================

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { audioEngine } from '../../services/AudioEngine';

export interface SliceMarker {
  id: string;
  samplePosition: number;
  normalizedPos: number;
}

interface SampleWorkbenchProps {
  audioBuffer: AudioBuffer | null;
  sampleName?: string;
  trimStart: number; // 0.0 to 1.0
  trimEnd: number;   // 0.0 to 1.0
  slices: SliceMarker[];
  onUpdateTrim: (start: number, end: number) => void;
  onUpdateSlices: (slices: SliceMarker[]) => void;
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
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);

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

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.fillStyle = '#10b981';
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

    const trimStartXPx = trimStart * width;
    const trimEndXPx = trimEnd * width;

    ctx.fillStyle = 'rgba(9, 9, 11, 0.75)';
    ctx.fillRect(0, 0, trimStartXPx, height);
    ctx.fillRect(trimEndXPx, 0, width - trimEndXPx, height);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trimStartXPx, 0);
    ctx.lineTo(trimStartXPx, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(trimEndXPx, 0);
    ctx.lineTo(trimEndXPx, height);
    ctx.stroke();

    slices.forEach((slice, idx) => {
      const sliceXPx = slice.normalizedPos * width;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(sliceXPx, 0);
      ctx.lineTo(sliceXPx, height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`S${idx + 1}`, sliceXPx + 4, 12);
    });
  }, [audioBuffer, trimStart, trimEnd, slices]);

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

  // Audition playback of current trim region
  const handleAuditionTrim = async () => {
    if (!audioBuffer) return;
    const startFrame = Math.floor(trimStart * audioBuffer.length);
    const endFrame = Math.floor(trimEnd * audioBuffer.length);
    await audioEngine.playSlice(audioBuffer, startFrame, endFrame, 0);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-zinc-300 select-none">
      
      <div className="flex justify-between items-center mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            WORKBENCH
          </span>
          <span className="text-[11px] font-bold text-zinc-200 truncate max-w-[140px]">
            {sampleName}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
          <button
            onClick={() => setActiveTool('trim')}
            className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${
              activeTool === 'trim' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            TRIM (MPC)
          </button>
          <button
            onClick={() => setActiveTool('chop')}
            className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${
              activeTool === 'chop' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CHOP (SP)
          </button>
        </div>
      </div>

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

      <div className="flex justify-between items-center mt-2 shrink-0 gap-1 text-[9px]">
        <div className="flex gap-1">
          <button
            onClick={handleAuditionTrim}
            disabled={!audioBuffer}
            className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 active:bg-emerald-500 active:text-zinc-950 border border-emerald-800 rounded font-bold text-emerald-400 cursor-pointer disabled:opacity-40"
          >
            ▶ AUDITION TRIM
          </button>
          <button
            onClick={() => onUpdateSlices([])}
            disabled={slices.length === 0}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 cursor-pointer disabled:opacity-40"
          >
            CLEAR SLICES
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
