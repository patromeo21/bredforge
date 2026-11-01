import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Square, RefreshCw, Upload, Layers, Zap } from 'lucide-react';

interface PadState {
  id: number;
  label: string;
  bank: string;
  sampleName: string | null;
  sampleBuffer: AudioBuffer | null;
  playMode: 'oneshot' | 'gate';
  chokeGroup: number; // 0 = off, 1-4
}

export default function App() {
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [selectedPad, setSelectedPad] = useState<number>(1);
  const [triggeredVisualPad, setTriggeredVisualPad] = useState<number | null>(null);

  // Core Pad State initialization for Bank A-D (16 pads each)
  const [pads, setPads] = useState<PadState[]>(() => 
    Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      label: `PAD ${i + 1}`,
      bank: 'A',
      sampleName: null,
      sampleBuffer: null,
      playMode: 'oneshot',
      chokeGroup: 0,
    }))
  );

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef>(new Map());

  // Initialize Web Audio API context safely
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    window.addEventListener('touchstart', initAudio, { once: true });
    window.addEventListener('click', initAudio, { once: true });
    return () => {
      window.removeEventListener('touchstart', initAudio);
      window.removeEventListener('click', initAudio);
    };
  }, []);

  const currentPad = pads.find(p => p.id === selectedPad) || pads[0];

  // Polyphonic trigger handler with choke group execution
  const triggerPadAudio = (padId: number) => {
    const pad = pads.find(p => p.id === padId);
    if (!pad) return;

    // Visual trigger feedback (decoupled from audio context execution)
    setTriggeredVisualPad(padId);
    setTimeout(() => setTriggeredVisualPad(null), 120);

    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    // Choke Group Execution: Cut off playing pads in the same choke group
    if (pad.chokeGroup > 0) {
      pads.forEach(otherPad => {
        if (otherPad.chokeGroup === pad.chokeGroup && otherPad.id !== pad.id) {
          const playingSources = activeSourcesRef.current.get(otherPad.id);
          if (playingSources) {
            playingSources.forEach(src => {
              try { src.stop(); } catch (e) {}
            });
            activeSourcesRef.current.set(otherPad.id, []);
          }
        }
      });
    }

    // Polyphonic Voice Stacking Node Creation
    if (pad.sampleBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = pad.sampleBuffer;
      source.connect(ctx.destination);
      source.start(0);

      const currentSources = activeSourcesRef.current.get(pad.id) || [];
      activeSourcesRef.current.set(pad.id, [...currentSources, source]);

      source.onended = () => {
        const active = activeSourcesRef.current.get(pad.id) || [];
        activeSourcesRef.current.set(pad.id, active.filter(s => s !== source));
      };
    }
  };

  // Immediate Parameter State Updates
  const updatePadParam = (key: keyof PadState, value: any) => {
    setPads(prevPads =>
      prevPads.map(pad =>
        pad.id === selectedPad ? { ...pad, [key]: value } : pad
      )
    );
  };

  // Handle local sample file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (audioCtxRef.current && arrayBuffer) {
        audioCtxRef.current.decodeAudioData(arrayBuffer, (buffer) => {
          setPads(prev =>
            prev.map(p =>
              p.id === selectedPad
                ? { ...p, sampleName: file.name, sampleBuffer: buffer }
                : p
            )
          );
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-white select-none overflow-hidden font-sans">
      
      {/* LEFT PANE: Workspace & Waveform Canvas */}
      <div className="w-1/2 h-full border-r border-neutral-800 flex flex-col p-4 bg-neutral-900/50">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <h1 className="text-xl font-bold tracking-widest text-amber-500 uppercase">BredForge</h1>
          <span className="text-xs bg-neutral-800 px-2.5 py-1 rounded-full text-neutral-400 font-mono">Layer 4 Active</span>
        </div>

        {/* Selected Pad Sample Details Header */}
        <div className="my-4 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="text-xs text-neutral-500 uppercase font-semibold">Active Selection</div>
          <div className="text-lg font-bold text-neutral-200 mt-1">
            Bank {activeBank} - Pad {currentPad.id}
          </div>
          <div className="mt-2 text-sm text-amber-400/90 font-mono truncate">
            {currentPad.sampleName ? `[Loaded] ${currentPad.sampleName}` : '[ Empty Slot ]'}
          </div>
        </div>

        {/* Waveform Canvas Area */}
        <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center relative overflow-hidden">
          <div className="text-neutral-600 text-sm font-mono flex flex-col items-center gap-2">
            <Volume2 className="w-8 h-8 opacity-40 animate-pulse" />
            <span>Waveform Chopper & Slice Canvas</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-4 flex gap-3">
          <label className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-black font-semibold py-3 rounded-lg cursor-pointer transition">
            <Upload className="w-4 h-4" />
            <span>{currentPad.sampleName ? 'Replace Sample' : 'Load Audio File'}</span>
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* RIGHT PANE: Hardware MPC Pads & Dynamic Controls */}
      <div className="w-1/2 h-full flex flex-col p-4 bg-neutral-950">
        
        {/* Bank Selection */}
        <div className="flex gap-2 mb-4">
          {(['A', 'B', 'C', 'D'] as const).map(bank => (
            <button
              key={bank}
              onClick={() => setActiveBank(bank)}
              className={`flex-1 py-2 font-bold rounded-md transition ${
                activeBank === bank
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              BANK {bank}
            </button>
          ))}
        </div>

        {/* Dynamic Parameter Switching Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => updatePadParam('playMode', currentPad.playMode === 'oneshot' ? 'gate' : 'oneshot')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold uppercase transition ${
              currentPad.playMode === 'oneshot'
                ? 'bg-neutral-800 border-amber-500 text-amber-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            {currentPad.playMode === 'oneshot' ? <Play className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            Mode: {currentPad.playMode}
          </button>

          <button
            onClick={() => updatePadParam('chokeGroup', (currentPad.chokeGroup + 1) % 5)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold uppercase transition ${
              currentPad.chokeGroup > 0
                ? 'bg-neutral-800 border-amber-500 text-amber-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Choke: {currentPad.chokeGroup === 0 ? 'OFF' : `GRP ${currentPad.chokeGroup}`}
          </button>
        </div>

        {/* 4x4 MPC Tactile Pad Matrix */}
        <div className="flex-1 grid grid-cols-4 gap-3">
          {pads.map(pad => {
            const isSelected = selectedPad === pad.id;
            const isTriggered = triggeredVisualPad === pad.id;

            return (
              <button
                key={pad.id}
                onPointerDown={() => {
                  setSelectedPad(pad.id);
                  triggerPadAudio(pad.id);
                }}
                className={`pad-target relative rounded-xl border-2 flex flex-col items-center justify-between p-3 transition-all transform active:scale-95 ${
                  isTriggered
                    ? 'bg-amber-400 border-amber-300 shadow-xl shadow-amber-400/50 scale-95'
                    : isSelected
                    ? 'bg-neutral-800 border-amber-500 shadow-lg'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="w-full flex justify-between items-center text-[10px] font-mono text-neutral-400">
                  <span>{activeBank}{pad.id}</span>
                  {pad.chokeGroup > 0 && <span className="text-amber-500 font-bold">C{pad.chokeGroup}</span>}
                </div>

                <div className="text-xs font-bold tracking-wider text-center truncate max-w-full px-1">
                  {pad.sampleName ? pad.sampleName : pad.label}
                </div>

                <div className="w-full flex justify-center">
                  <span className={`w-2 h-2 rounded-full ${pad.sampleBuffer ? 'bg-emerald-500' : 'bg-neutral-700'}`} />
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}