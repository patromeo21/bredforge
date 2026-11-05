import React, { useEffect, useState, useRef } from 'react';
import { PatternState } from '../../services/tracker/TrackerEngine';

export interface SampleManager {
  getBuffer?: (id: string | number) => AudioBuffer | null;
  loadSample?: (file: File) => Promise<any>;
  playPad?: (bankIndex: number, padIndex: number) => void;
  [key: string]: any;
}

export interface SampleLoader {
  loadFromFile?: (file: File) => Promise<any>;
  [key: string]: any;
}

export interface BredForgeCanvasProps {
  audioCtx: AudioContext | null;
  sampleManager: SampleManager | null;
  sampleLoader: SampleLoader | null;
  patternState?: PatternState;
  activeBank?: number | string;
  activePad?: number | null;
  isPlaying?: boolean;
  isRecording?: boolean;
  bpm?: number;
  onPlay?: () => void;
  onStop: () => void;
  onPadTrigger?: (bankIndex: number, padIndex: number) => void;
  onAudioUpload?: (file: File) => void;
}

export const BredForgeCanvas: React.FC<BredForgeCanvasProps> = ({
  audioCtx,
  sampleManager,
  sampleLoader,
  patternState,
  activeBank: propActiveBank = 'A',
  activePad = null,
  isPlaying = false,
  isRecording = false,
  bpm = 120,
  onPlay,
  onStop,
  onPadTrigger,
  onAudioUpload,
}) => {
  const [internalBank, setInternalBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [sampleLoaded, setSampleLoaded] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync prop active bank if passed as number or string from App.tsx
  useEffect(() => {
    if (typeof propActiveBank === 'number') {
      const bankMap: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      setInternalBank(bankMap[propActiveBank] || 'A');
    } else if (typeof propActiveBank === 'string' && ['A', 'B', 'C', 'D'].includes(propActiveBank)) {
      setInternalBank(propActiveBank as 'A' | 'B' | 'C' | 'D');
    }
  }, [propActiveBank]);

  // ============================================================================
  // SURGICAL PHASE 1 INJECTION: THE TOUCH-LATENCY EVENT SHIELD
  // ============================================================================
  // Scans exclusively for performance pad elements (.groove-pad-target) and
  // cancels WebKit 300ms double-tap zoom delay without interfering with native inputs.
  useEffect(() => {
    const padElements = document.querySelectorAll('.groove-pad-target');

    const handleTouchStart = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault(); // Bypass Mobile WebKit 300ms zoom/tap delay
      }
    };

    padElements.forEach((el) => {
      el.addEventListener('touchstart', handleTouchStart as EventListener, { passive: false });
    });

    return () => {
      padElements.forEach((el) => {
        el.removeEventListener('touchstart', handleTouchStart as EventListener);
      });
    };
  }, [internalBank]);
  // ============================================================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSampleLoaded(true);
      if (onAudioUpload) {
        onAudioUpload(file);
      } else if (sampleLoader?.loadFromFile) {
        sampleLoader.loadFromFile(file);
      }
    }
  };

  const handlePadClick = (padIndex: number) => {
    const bankMap = { A: 0, B: 1, C: 2, D: 3 };
    const bankNum = bankMap[internalBank];
    
    if (onPadTrigger) {
      onPadTrigger(bankNum, padIndex);
    } else if (sampleManager?.playPad) {
      sampleManager.playPad(bankNum, padIndex);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto p-4 bg-[#0a0a0a] text-zinc-100 rounded-xl select-none">
      {/* Header & Bank Selector */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-lg font-bold tracking-wider text-amber-500">BredForge SP/Tracker</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-zinc-400">BPM: {patternState?.bpm ?? bpm}</span>
            <span className={`w-2 h-2 rounded-full ${isPlaying || patternState?.isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
          </div>
        </div>
        
        <div className="flex gap-1">
          {(['A', 'B', 'C', 'D'] as const).map((bank) => (
            <button
              key={bank}
              onClick={() => setInternalBank(bank)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                internalBank === bank
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {bank}
            </button>
          ))}
        </div>
      </div>

      {/* File Upload & Transport Bar */}
      <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded text-zinc-200 border border-zinc-700 transition-colors"
          >
            Import Audio
          </button>
          <span className="text-[10px] text-zinc-400 truncate max-w-[100px]">
            {sampleLoaded ? 'Loaded' : 'No File'}
          </span>
        </div>

        <div className="flex gap-1.5">
          {onPlay && (
            <button
              onClick={onPlay}