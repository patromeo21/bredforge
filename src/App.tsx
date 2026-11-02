import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Square, Upload, Zap, Copy, Trash2 } from 'lucide-react';

interface PadState {
  id: number;
  bank: 'A' | 'B' | 'C' | 'D';
  label: string;
  sampleName: string | null;
  sampleBuffer: AudioBuffer | null;
  playMode: 'oneshot' | 'gate';
  chokeGroup: number; // 0 = off, 1-4 global choke groups
}

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
        playMode: 'gate',
        chokeGroup: 0,
      });
    }
  });

  return allPads;
};

export default function App() {
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [selectedPadId, setSelectedPadId] = useState<number>(1);
  const [triggeredVisualKeys, setTriggeredVisualKeys] = useState<Record<string, boolean>>({});
  
  const [copyMode, setCopyMode] = useState<boolean>(false);
  const [sourcePadForCopy, setSourcePadForCopy] = useState<PadState | null>(null);
  const [deleteMode, setDeleteMode] = useState<boolean>(false);

  const [allPads, setAllPads] = useState<PadState[]>(createInitialPads);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef(new Map<string, AudioBufferSourceNode[]>());
  const gateSourcesRef = useRef(new Map<string, AudioBufferSourceNode[]>());

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

  const getPadKey = (bank: string, id: number) => `${bank}-${id}`;

  const currentPad = allPads.find(p => p.bank === activeBank && p.id === selectedPadId) || allPads[0];
  const bankPads = allPads.filter(p => p.bank === activeBank);

  const handlePadInteraction = (targetPad: PadState, e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    // LATCHED DELETE MODE: Clears target pad without disarming Delete mode
    if (deleteMode) {
      setAllPads(prev =>
        prev.map(p =>
          p.bank === targetPad.bank && p.id === targetPad.id
            ? { ...p, sampleName: null, sampleBuffer: null, playMode: 'gate', chokeGroup: 0 }
            : p
        )
      );
      return;
    }

    // LATCHED COPY MODE: Allows continuous copying to multiple target pads
    if (copyMode) {
      if (!sourcePadForCopy) {
        if (!targetPad.sampleBuffer) {
          return; // Ignore empty source pads
        }
        setSourcePadForCopy(targetPad);
      } else {
        setAllPads(prev =>
          prev.map(p =>
            p.bank === targetPad.bank && p.id === targetPad.id
              ? {
                  ...p,
                  sampleName: sourcePadForCopy.sampleName,
                  sampleBuffer: sourcePadForCopy.sampleBuffer,
                  playMode: sourcePadForCopy.playMode,
                  chokeGroup: sourcePadForCopy.chokeGroup,
                }
              : p
          )
        );
      }
      return;
    }

    setSelectedPadId(targetPad.id);
    const padKey = getPadKey(targetPad.bank, targetPad.id);
    setTriggeredVisualKeys(prev => ({ ...prev, [padKey]: true }));

    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const sourcesMap = activeSourcesRef.current;
    const gateMap = gateSourcesRef.current;

    if (targetPad.playMode === 'gate') {
      const existingGateVoices = gateMap.get(padKey) || [];
      existingGateVoices.forEach(src => {
        try { src.stop(0); } catch (err) {}
      });
      gateMap.set(padKey, []);
    }

    if (targetPad.chokeGroup > 0) {
      allPads.forEach(otherPad => {
        if (
          otherPad.chokeGroup === targetPad.chokeGroup &&
          !(otherPad.bank === targetPad.bank && otherPad.id === targetPad.id)
        ) {
          const otherKey = getPadKey(otherPad.bank, otherPad.id);
          const playingSources = sourcesMap.get(otherKey);
          if (playingSources) {
            playingSources.forEach(src => {
              try { src.stop(); } catch (err) {}
            });
            sourcesMap.set(otherKey, []);
          }
          const otherGates = gateMap.get(otherKey);
          if (otherGates) {
            otherGates.forEach(src => {
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
      source.connect(ctx.destination);
      source.start(0);

      const currentSources = sourcesMap.get(padKey) || [];
      sourcesMap.set(padKey, [...currentSources, source]);

      if (targetPad.playMode === 'gate') {
        const gateList = gateMap.get(padKey) || [];
        gateMap.set(padKey, [...gateList, source]);
      }

      source.onended = () => {
        const active = sourcesMap.get(padKey) || [];
        sourcesMap.set(padKey, active.filter(s => s !== source));
      };
    }
  };

  const handlePadPointerUp = (targetPad: PadState) => {
    if (copyMode || deleteMode) return;
    const padKey = getPadKey(targetPad.bank, targetPad.id);
    setTriggeredVisualKeys(prev => ({ ...prev, [padKey]: false }));

    if (targetPad.playMode === 'gate') {
      const gateList = gateSourcesRef.current.get(padKey) || [];
      gateList.forEach(src => {
        try {
          src.stop(0);
        } catch (err) {}
      });
      gateSourcesRef.current.set(padKey, []);
    }
  };

  const updatePadParam = (key: keyof PadState, value: any) => {
    setAllPads(prevPads =>
      prevPads.map(pad =>
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
    e.target.value = '';
  };

  const getChokeLabel = (group: number) => {
    if (group === 0) return 'OFF';
    return `GROUP ${group}`;
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-neutral-950 text-white select-none overflow-hidden font-sans m-0 p-0">
      
      {/* LEFT PANE: Workspace & Integrated File Uploader */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col p-2.5 bg-neutral-900/40 shrink-0">
        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 shrink-0">
          <h1 className="text-lg font-bold tracking-widest text-amber-500 uppercase">BredForge</h1>
          <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-400 font-mono">Layer 4 Active</span>
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

        {/* Waveform Canvas Placeholder */}
        <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center relative overflow-hidden min-h-[50px]">
          <div className="text-neutral-600 text-xs font-mono flex flex-col items-center gap-1">
            <Volume2 className="w-5 h-5 opacity-40 animate-pulse" />
            <span>Waveform Chopper & Slice Canvas</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Hardware MPC Pads & Parameters */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col p-2.5 bg-neutral-950 overflow-hidden">
        
        {/* Bank Selection Tabs */}
        <div className="flex gap-2 mb-2 shrink-0">
          {(['A', 'B', 'C', 'D'] as const).map(bank => (
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

        {/* 4x4 MPC Matrix Grid */}
        <div className="grid grid-cols-4 grid-rows-4 gap-2 flex-1 min-h-0">
          {bankPads.map(pad => {
            const padKey = getPadKey(pad.bank, pad.id);
            const isSelected = selectedPadId === pad.id;
            const isTriggered = triggeredVisualKeys[padKey];
            const isCopySource = sourcePadForCopy?.bank === pad.bank && sourcePadForCopy?.id === pad.id;

            return (
              <button
                key={padKey}
                onPointerDown={(e) => handlePadInteraction(pad, e)}
                onPointerUp={() => handlePadPointerUp(pad)}
                onPointerCancel={() => handlePadPointerUp(pad)}
                onLostPointerCapture={() => handlePadPointerUp(pad)}
                className={`pad-target relative rounded-xl border-2 flex flex-col items-center justify-between p-1.5 transition-all transform active:scale-95 w-full h-full min-h-[45px] overflow-hidden [touch-action:none] [-webkit-touch-callout:none] [user-select:none] ${
                  deleteMode
                    ? 'border-red-500 bg-red-950/20 hover:bg-red-900/30 animate-pulse'
                    : isCopySource
                    ? 'bg-amber-600 border-amber-300 animate-bounce shadow-xl'
                    : isTriggered
                    ? 'bg-amber-400 border-amber-300 shadow-xl shadow-amber-400/50 scale-95'
                    : isSelected
                    ? 'bg-neutral-800 border-amber-500 shadow-lg'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
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
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}