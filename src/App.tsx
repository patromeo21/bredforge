import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Square, Upload, Zap } from 'lucide-react';

interface PadState {
  id: number;          // 1 - 16
  bank: 'A' | 'B' | 'C' | 'D';
  label: string;
  sampleName: string | null;
  sampleBuffer: AudioBuffer | null;
  playMode: 'oneshot' | 'gate';
  chokeGroup: number;  // 0 = off, 1-4
}

// Generate 64 discrete pads across 4 banks
const createInitialPads = (): PadState[] => {
  const banks: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const allPads: PadState[] = [];

  banks.forEach(bank => {
    for (let i = 1; i <= 16; i++) {
      allPads.push({
        id: i,
        bank,
        label: `PAD ${i}`,
        sampleName: null,
        sampleBuffer: null,
        playMode: 'oneshot',
        chokeGroup: 0,
      });
    }
  });

  return allPads;
};

export default function App() {
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [selectedPadId, setSelectedPadId] = useState<number>(1);
  const [triggeredVisualKey, setTriggeredVisualKey] = useState<string | null>(null);

  // 64-Pad Master Storage State
  const [allPads, setAllPads] = useState<PadState[]>(createInitialPads);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef(new Map<string, AudioBufferSourceNode[]>());

  // Initialize Web Audio API context on first touch/click
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

  // Unique identifier key per pad: e.g. "A-1", "B-12"
  const getPadKey = (bank: string, id: number) => `${bank}-${id}`;

  // Currently Active Selected Pad Object
  const currentPad = allPads.find(p => p.bank === activeBank && p.id === selectedPadId) || allPads[0];

  // Current Bank's 16 Pads
  const bankPads = allPads.filter(p => p.bank === activeBank);

  // Polyphonic Audio Trigger Engine
  const triggerPadAudio = (targetPad: PadState) => {
    const padKey = getPadKey(targetPad.bank, targetPad.id);

    // Instant decoupled UI visual flash
    setTriggeredVisualKey(padKey);
    setTimeout(() => setTriggeredVisualKey(null), 120);

    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const sourcesMap = activeSourcesRef.current;

    // Choke Group Execution within same bank context
    if (targetPad.chokeGroup > 0) {
      allPads.forEach(otherPad => {
        if (
          otherPad.bank === targetPad.bank &&
          otherPad.chokeGroup === targetPad.chokeGroup &&
          otherPad.id !== targetPad.id
        ) {
          const otherKey = getPadKey(otherPad.bank, otherPad.id);
          const playingSources = sourcesMap.get(otherKey);
          if (playingSources) {
            playingSources.forEach(src => {
              try { src.stop(); } catch (e) {}
            });
            sourcesMap.set(otherKey, []);
          }
        }
      });
    }

    // Polyphonic Buffer Node Generation
    if (targetPad.sampleBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = targetPad.sampleBuffer;
      source.connect(ctx.destination);
      source.start(0);

      const currentSources = sourcesMap.get(padKey) || [];
      sourcesMap.set(padKey, [...currentSources, source]);

      source.onended = () => {
        const active = sourcesMap.get(padKey) || [];
        sourcesMap.set(padKey, active.filter(s => s !== source));
      };
    }
  };

  // Immediate Parameter State Updates strictly targeting the selected bank & pad slot
  const updatePadParam = (key: keyof PadState, value: any) => {
    setAllPads(prevPads =>
      prevPads.map(pad =>
        pad.bank === activeBank && pad.id === selectedPadId
          ? { ...pad, [key]: value }
          : pad
      )
    );
  };

  // Sample File Loader Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (audioCtxRef.current && arrayBuffer) {
        audioCtxRef.current.decodeAudioData(arrayBuffer, (buffer) => {
          setAllPads(prev =>
            prev.map(p =>
              p.bank === activeBank && p.id === selectedPadId
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
      
      {/* LEFT PANE: Workspace & Sample Manager */}
      <div className="w-1/2 h-full border-r border-neutral-800 flex flex-col p-4 bg-neutral-900/40 min-h-0">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
          <h1 className="text-xl font-bold tracking-widest text-amber-500 uppercase">BredForge</h1>
          <span className="text-xs bg-neutral-800 px-2.5 py-1 rounded-full text-neutral-400 font-mono">Layer 4 Active</span>
        </div>

        {/* Selected Pad Sample Details Header */}
        <div className="my-3 p-4 bg-neutral-900 border border-neutral-800 rounded-lg shrink-0">
          <div className="text-xs text-neutral-500 uppercase font-semibold">Active Selection</div>
          <div className="text-lg font-bold text-neutral-200 mt-1">
            Bank {activeBank} - Pad {currentPad.id}
          </div>
          <div className="mt-2 text-sm text-amber-400/90 font-mono truncate">
            {currentPad.sampleName ? `[Loaded] ${currentPad.sampleName}` : '[ Empty Slot ]'}
          </div>
        </div>

        {/* Waveform Canvas Placeholder */}
        <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center relative overflow-hidden min-h-0">
          <div className="text-neutral-600 text-sm font-mono flex flex-col items-center gap-2">
            <Volume2 className="w-8 h-8 opacity-40 animate-pulse" />
            <span>Waveform Chopper & Slice Canvas</span>
          </div>
        </div>

        {/* Explicit File Loader Button Bar */}
        <div className="mt-3 shrink-0">
          <label className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-black font-semibold py-3 rounded-lg cursor-pointer transition">
            <Upload className="w-4 h-4" />
            <span>{currentPad.sampleName ? 'Replace Sample' : 'Load Audio File'}</span>
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* RIGHT PANE: Hardware MPC Pads & Parameters */}
      <div className="w-1/2 h-full flex flex-col p-4 bg-neutral-950 min-h-0">
        
        {/* Bank Selection Tabs */}
        <div className="flex gap-2 mb-3 shrink-0">
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

        {/* Dynamic Parameter Switching Controls */}
        <div className="grid grid-cols-2 gap-3 mb-3 shrink-0">
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

        {/* 4x4 MPC Tactile Pad Matrix (Bounded Container to Prevent iPad Clipping) */}
        <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-3 min-h-0">
          {bankPads.map(pad => {
            const padKey = getPadKey(pad.bank, pad.id);
            const isSelected = selectedPadId === pad.id;
            const isTriggered = triggeredVisualKey === padKey;

            return (
              <button
                key={padKey}
                onPointerDown={() => {
                  setSelectedPadId(pad.id);
                  triggerPadAudio(pad);
                }}
                className={`pad-target relative rounded-xl border-2 flex flex-col items-center justify-between p-2 transition-all transform active:scale-95 h-full w-full min-h-0 overflow-hidden ${
                  isTriggered
                    ? 'bg-amber-400 border-amber-300 shadow-xl shadow-amber-400/50 scale-95'
                    : isSelected
                    ? 'bg-neutral-800 border-amber-500 shadow-lg'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="w-full flex justify-between items-center text-[10px] font-mono text-neutral-400 shrink-0">
                  <span>{pad.bank}{pad.id}</span>
                  {pad.chokeGroup > 0 && <span className="text-amber-500 font-bold">C{pad.chokeGroup}</span>}
                </div>

                <div className="text-xs font-bold tracking-wider text-center truncate max-w-full px-1 my-auto">
                  {pad.sampleName ? pad.sampleName : pad.label}
                </div>

                <div className="w-full flex justify-center shrink-0">
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