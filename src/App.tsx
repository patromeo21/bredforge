import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Square, Upload, Zap, Copy, Trash2, Scissors } from 'lucide-react';

interface PadState {
  id: number;
  bank: 'A' | 'B' | 'C' | 'D';
  label: string;
  sampleName: string | null;
  sampleBuffer: AudioBuffer | null;
  playMode: 'oneshot' | 'gate';
  chokeGroup: number;
  sliceStart?: number; // normalized 0 to 1
  sliceEnd?: number;   // normalized 0 to 1
}

const createInitialPads = (): PadState[] => {
  const banks: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const allPads: PadState[] = [];

  banks.forEach((bank: 'A' | 'B' | 'C' | 'D') => {
    for (let i = 1; i <= 16; i++) {
      allPads.push({
        id: i,
        bank,
        label: `PAD ${i}`,
        sampleName: null,
        sampleBuffer: null,
        playMode: 'gate',
        chokeGroup: 0,
        sliceStart: 0,
        sliceEnd: 1,
      });
    }
  });

  return allPads;
};

export default function App() {
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [selectedPadId, setSelectedPadId] = useState<number>(1);
  const [activeTouches, setActiveTouches] = useState<Record<number, number>>({});
  
  const [copyMode, setCopyMode] = useState<boolean>(false);
  const [sourcePadForCopy, setSourcePadForCopy] = useState<PadState | null>(null);
  const [deleteMode, setDeleteMode] = useState<boolean>(false);

  const [allPads, setAllPads] = useState<PadState[]>(createInitialPads);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterLimiterRef = useRef<DynamicsCompressorNode | null>(null);
  
  // Type inference maps to prevent TSX angle bracket parser collisions
  const activeSourcesRef = useRef(new Map<string, AudioBufferSourceNode[]>());
  const gateSourcesRef = useRef(new Map<string, AudioBufferSourceNode[]>());
  const gridRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.setValueAtTime(-3, ctx.currentTime);
        limiter.knee.setValueAtTime(0, ctx.currentTime);
        limiter.ratio.setValueAtTime(20, ctx.currentTime);
        limiter.attack.setValueAtTime(0.001, ctx.currentTime);
        limiter.release.setValueAtTime(0.1, ctx.currentTime);
        limiter.connect(ctx.destination);
        masterLimiterRef.current = limiter;
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && audioCtxRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      }
    };

    window.addEventListener('touchstart', initAudio, { once: true });
    window.addEventListener('click', initAudio, { once: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('touchstart', initAudio);
      window.removeEventListener('click', initAudio);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getPadKey = (bank: string, id: number): string => `${bank}-${id}`;

  const currentPad = allPads.find((p: PadState) => p.bank === activeBank && p.id === selectedPadId) || allPads[0];
  const bankPads = allPads.filter((p: PadState) => p.bank === activeBank);

  // Render Waveform Canvas whenever selected pad or buffer changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    if (!currentPad.sampleBuffer) {
      ctx.fillStyle = '#52525b';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO SAMPLE LOADED', width / 2, height / 2);
      return;
    }

    const rawData = currentPad.sampleBuffer.getChannelData(0);
    const step = Math.ceil(rawData.length / width);
    const amp = height / 2;

    ctx.strokeStyle = '#f59e0b'; // Amber-500
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = rawData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const yMin = (1 + min) * amp;
      const yMax = (1 + max) * amp;
      ctx.moveTo(i, yMin);
      ctx.lineTo(i, yMax);
    }
    ctx.stroke();

    // Draw Slice Markers
    const startX = (currentPad.sliceStart ?? 0) * width;
    const endX = (currentPad.sliceEnd ?? 1) * width;

    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.fillRect(startX, 0, endX - startX, height);

    ctx.strokeStyle = '#ef4444'; // Red start marker
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    ctx.strokeStyle = '#22c55e'; // Green end marker
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

  }, [currentPad.sampleBuffer, currentPad.sliceStart, currentPad.sliceEnd]);

  const getPadIdFromCoordinates = (clientX: number, clientY: number): number | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    const colWidth = rect.width / 4;
    const rowHeight = rect.height / 4;

    const col = Math.floor(relX / colWidth);
    const row = Math.floor(relY / rowHeight);

    if (col < 0 || col > 3 || row < 0 || row > 3) return null;

    return row * 4 + col + 1;
  };

  const triggerPadAction = (targetPad: PadState) => {
    if (deleteMode) {
      setAllPads((prev: PadState[]) =>
        prev.map((p: PadState) =>
          p.bank === targetPad.bank && p.id === targetPad.id
            ? { ...p, sampleName: null, sampleBuffer: null, playMode: 'gate', chokeGroup: 0, sliceStart: 0, sliceEnd: 1 }
            : p
        )
      );
      return;
    }

    if (copyMode) {
      if (!sourcePadForCopy) {
        if (!targetPad.sampleBuffer) return;
        setSourcePadForCopy(targetPad);
      } else {
        setAllPads((prev: PadState[]) =>
          prev.map((p: PadState) =>
            p.bank === targetPad.bank && p.id === targetPad.id
              ? {
                  ...p,
                  sampleName: sourcePadForCopy.sampleName,
                  sampleBuffer: sourcePadForCopy.sampleBuffer,
                  playMode: sourcePadForCopy.playMode,
                  chokeGroup: sourcePadForCopy.chokeGroup,
                  sliceStart: sourcePadForCopy.sliceStart,
                  sliceEnd: sourcePadForCopy.sliceEnd,
                }
              : p
          )
        );
      }
      return;
    }

    setSelectedPadId(targetPad.id);
    const padKey = getPadKey(targetPad.bank, targetPad.id);

    const ctx = audioCtxRef.current;
    if (!ctx || !masterLimiterRef.current) return;
    if (ctx.state === 'suspended') ctx.resume();

    const sourcesMap = activeSourcesRef.current;
    const gateMap = gateSourcesRef.current;

    if (targetPad.playMode === 'gate') {
      const existingGateVoices = gateMap.get(padKey) || [];
      existingGateVoices.forEach((src: AudioBufferSourceNode) => {
        try { src.stop(0); } catch (err) {}
      });
      gateMap.set(padKey, []);
    }

    if (targetPad.chokeGroup > 0) {
      allPads.forEach((otherPad: PadState) => {
        if (
          otherPad.chokeGroup === targetPad.chokeGroup &&
          !(otherPad.bank === targetPad.bank && otherPad.id === targetPad.id)
        ) {
          const otherKey = getPadKey(otherPad.bank, otherPad.id);
          const playingSources = sourcesMap.get(otherKey);
          if (playingSources) {
            playingSources.forEach((src: AudioBufferSourceNode) => {
              try { src.stop(); } catch (err) {}
            });
            sourcesMap.set(otherKey, []);
          }
          const otherGates = gateMap.get(otherKey);
          if (otherGates) {
            otherGates.forEach((src: AudioBufferSourceNode) => {
              try { src.stop(0); } catch (err) {}
            });
            gateMap.set(otherKey, []);
          }
        }
      });
    }

    if (targetPad.sampleBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = targetPad.sampleBuffer;
      source.connect(masterLimiterRef.current);

      const bufferDuration = targetPad.sampleBuffer.duration;
      const sStart = (targetPad.sliceStart ?? 0) * bufferDuration;
      const sEnd = (targetPad.sliceEnd ?? 1) * bufferDuration;
      const sDuration = Math.max(0.05, sEnd - sStart);

      source.start(0, sStart, sDuration);

      const currentSources = sourcesMap.get(padKey) || [];
      sourcesMap.set(padKey, [...currentSources, source]);

      if (targetPad.playMode === 'gate') {
        const gateList = gateMap.get(padKey) || [];
        gateMap.set(padKey, [...gateList, source]);
      }

      source.onended = () => {
        const active = sourcesMap.get(padKey) || [];
        sourcesMap.set(padKey, active.filter((s: AudioBufferSourceNode) => s !== source));
      };
    }
  };

  const releasePadAction = (padId: number) => {
    if (copyMode || deleteMode) return;
    const targetPad = allPads.find((p: PadState) => p.bank === activeBank && p.id === padId);
    if (!targetPad) return;

    const padKey = getPadKey(targetPad.bank, targetPad.id);
    if (targetPad.playMode === 'gate') {
      const gateList = gateSourcesRef.current.get(padKey) || [];
      gateList.forEach((src: AudioBufferSourceNode) => {
        try { src.stop(0); } catch (err) {}
      });
      gateSourcesRef.current.set(padKey, []);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    const padId = getPadIdFromCoordinates(e.clientX, e.clientY);
    if (padId === null) return;

    setActiveTouches((prev: Record<number, number>) => ({ ...prev, [e.pointerId]: padId }));

    const targetPad = allPads.find((p: PadState) => p.bank === activeBank && p.id === padId);
    if (targetPad) {
      triggerPadAction(targetPad);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const padId = getPadIdFromCoordinates(e.clientX, e.clientY);
    const prevPadId = activeTouches[e.pointerId];

    if (padId !== prevPadId) {
      if (prevPadId !== undefined) {
        releasePadAction(prevPadId);
      }
      if (padId !== null) {
        setActiveTouches((prev: Record<number, number>) => ({ ...prev, [e.pointerId]: padId }));
        const targetPad = allPads.find((p: PadState) => p.bank === activeBank && p.id === padId);
        if (targetPad) {
          triggerPadAction(targetPad);
        }
      } else {
        setActiveTouches((prev: Record<number, number>) => {
          const updated = { ...prev };
          delete updated[e.pointerId];
          return updated;
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const padId = activeTouches[e.pointerId];
    if (padId !== undefined) {
      releasePadAction(padId);
      setActiveTouches((prev: Record<number, number>) => {
        const updated = { ...prev };
        delete updated[e.pointerId];
        return updated;
      });
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const updatePadParam = (key: keyof PadState, value: any) => {
    setAllPads((prevPads: PadState[]) =>
      prevPads.map((pad: PadState) =>
        pad.bank === activeBank && pad.id === selectedPadId
          ? { ...pad, [key]: value }
          : pad
      )
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (audioCtxRef.current && arrayBuffer) {
        audioCtxRef.current.decodeAudioData(
          arrayBuffer, 
          (buffer: AudioBuffer) => {
            setAllPads((prev: PadState[]) =>
              prev.map((p: PadState) =>
                p.bank === activeBank && p.id === selectedPadId
                  ? { ...p, sampleName: file.name, sampleBuffer: buffer, sliceStart: 0, sliceEnd: 1 }
                  : p
              )
            );
          },
          (err: DOMException) => {
            console.error("Audio decoding error:", err);
          }
        );
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const getChokeLabel = (group: number): string => {
    if (group === 0) return 'OFF';
    return `GROUP ${group}`;
  };

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row h-[100dvh] w-screen bg-neutral-950 text-white select-none overflow-hidden font-sans m-0 p-0 touch-none">
      
      {/* LEFT PANE: Workspace & Waveform Chopper Canvas */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col p-2.5 bg-neutral-900/40 shrink-0">
        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 shrink-0">
          <h1 className="text-lg font-bold tracking-widest text-amber-500 uppercase">BredForge</h1>
          <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded-full text-amber-400 font-mono">Layer 5 Active</span>
        </div>

        {/* Selected Pad Details & File Input */}
        <div className="my-2 p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg shrink-0 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[9px] text-neutral-500 uppercase font-semibold">Active Selection</div>
              <div className="text-xs md:text-sm font-bold text-neutral-200">
                Bank {activeBank} - Pad {currentPad.id}
              </div>
            </div>
            <label className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-black text-[11px] font-semibold px-2.5 py-1.5 rounded-md cursor-pointer transition shadow-md shrink-0">
              <Upload className="w-3 h-3" />
              <span>{currentPad.sampleName ? 'Replace' : 'Load Sample'}</span>
              <input 
                type="file" 
                accept="audio/*,audio/wav,audio/mp3,audio/aac,audio/m4a,audio/x-m4a,.wav,.mp3,.m4a" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>

          <div className="text-[11px] text-amber-400/90 font-mono truncate bg-neutral-950 p-1.5 rounded border border-neutral-800/80">
            {currentPad.sampleName ? `[Loaded] ${currentPad.sampleName}` : '[ Empty Slot ]'}
          </div>
        </div>

        {/* Layer 5: Waveform Canvas & Slice Controls */}
        <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col p-2 relative overflow-hidden min-h-[50px]">
          <div className="flex justify-between items-center mb-1 shrink-0">
            <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
              <Scissors className="w-3 h-3 text-amber-500" /> Waveform Chopper
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const s = Math.max(0, (currentPad.sliceStart ?? 0) - 0.05);
                  updatePadParam('sliceStart', s);
                }}
                className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded text-[9px] font-mono text-amber-400 border border-neutral-700"
              >
                [ Start -
              </button>
              <button 
                onClick={() => {
                  const s = Math.min((currentPad.sliceEnd ?? 1) - 0.05, (currentPad.sliceStart ?? 0) + 0.05);
                  updatePadParam('sliceStart', s);
                }}
                className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded text-[9px] font-mono text-amber-400 border border-neutral-700"
              >
                Start + ]
              </button>
              <button 
                onClick={() => {
                  const e = Math.max((currentPad.sliceStart ?? 0) + 0.05, (currentPad.sliceEnd ?? 1) - 0.05);
                  updatePadParam('sliceEnd', e);
                }}
                className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded text-[9px] font-mono text-emerald-400 border border-neutral-700"
              >
                [ End -
              </button>
              <button 
                onClick={() => {
                  const e = Math.min(1, (currentPad.sliceEnd ?? 1) + 0.05);
                  updatePadParam('sliceEnd', e);
                }}
                className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded text-[9px] font-mono text-emerald-400 border border-neutral-700"
              >
                End + ]
              </button>
            </div>
          </div>

          <div className="flex-1 w-full bg-neutral-950 rounded border border-neutral-900 relative overflow-hidden">
            <canvas 
              ref={canvasRef} 
              width={500} 
              height={150} 
              className="w-full h-full object-fill"
            />
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Hardware MPC Pads & Parameters */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col p-2.5 bg-neutral-950 overflow-hidden">
        
        {/* Bank Selection Tabs */}
        <div className="flex gap-2 mb-2 shrink-0">
          {(['A', 'B', 'C', 'D'] as const).map((bank: 'A' | 'B' | 'C' | 'D') => (
            <button
              key={bank}
              onClick={() => setActiveBank(bank)}
              className={`flex-1 py-1 font-bold text-xs rounded-md transition ${
                activeBank === bank
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              BANK {bank}
            </button>
          ))}
        </div>

        {/* Dynamic Parameter Controls */}
        <div className="grid grid-cols-4 gap-1.5 mb-2 shrink-0">
          <button
            onClick={() => updatePadParam('playMode', currentPad.playMode === 'oneshot' ? 'gate' : 'oneshot')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition ${
              currentPad.playMode === 'oneshot'
                ? 'bg-neutral-800 border-amber-500 text-amber-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            {currentPad.playMode === 'oneshot' ? <Play className="w-3 h-3" /> : <Square className="w-3 h-3" />}
            {currentPad.playMode}
          </button>

          <button
            onClick={() => updatePadParam('chokeGroup', (currentPad.chokeGroup + 1) % 5)}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition ${
              currentPad.chokeGroup > 0
                ? 'bg-neutral-800 border-amber-500 text-amber-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            <Zap className="w-3 h-3" />
            {getChokeLabel(currentPad.chokeGroup)}
          </button>

          {/* Latched COPY Button */}
          <button
            onClick={() => {
              setCopyMode(!copyMode);
              setDeleteMode(false);
              setSourcePadForCopy(null);
            }}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition ${
              copyMode
                ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/30 animate-pulse'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Copy className="w-3 h-3" />
            {copyMode ? (sourcePadForCopy ? 'Copying...' : 'Select Source') : 'Copy'}
          </button>

          {/* Latched DELETE Button */}
          <button
            onClick={() => {
              setDeleteMode(!deleteMode);
              setCopyMode(false);
              setSourcePadForCopy(null);
            }}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition ${
              deleteMode
                ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/30 animate-pulse'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Trash2 className="w-3 h-3" />
            {deleteMode ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        {/* Unified Touch Matrix Container (Zero Dead-Space Canvas Grid) */}
        <div
          ref={gridRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="grid grid-cols-4 grid-rows-4 gap-1.5 flex-1 min-h-0 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800 [touch-action:none] [-webkit-touch-callout:none] [user-select:none]"
        >
          {bankPads.map((pad: PadState) => {
            const padKey = getPadKey(pad.bank, pad.id);
            const isSelected = selectedPadId === pad.id;
            const isTriggered = Object.values(activeTouches).includes(pad.id);
            const isCopySource = sourcePadForCopy?.bank === pad.bank && sourcePadForCopy?.id === pad.id;

            return (
              <div
                key={padKey}
                className={`relative rounded-xl border-2 flex flex-col items-center justify-between p-1.5 transition-all w-full h-full min-h-[45px] overflow-hidden pointer-events-none ${
                  deleteMode
                    ? 'border-red-500 bg-red-950/20 animate-pulse'
                    : isCopySource
                    ? 'bg-amber-600 border-amber-300 animate-bounce shadow-xl'
                    : isTriggered
                    ? 'bg-amber-400 border-amber-300 shadow-xl shadow-amber-400/50 scale-95'
                    : isSelected
                    ? 'bg-neutral-800 border-amber-500 shadow-lg'
                    : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                <div className="w-full flex justify-between items-center text-[9px] font-mono text-neutral-400 shrink-0">
                  <span>{pad.bank}{pad.id}</span>
                  {pad.chokeGroup > 0 && <span className="text-amber-500 font-bold">C{pad.chokeGroup}</span>}
                </div>

                <div className="text-[10px] md:text-xs font-bold tracking-wider text-center truncate max-w-full px-1 my-auto">
                  {pad.sampleName ? pad.sampleName : pad.label}
                </div>

                <div className="w-full flex justify-center shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${pad.sampleBuffer ? 'bg-emerald-500' : 'bg-neutral-700'}`} />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}