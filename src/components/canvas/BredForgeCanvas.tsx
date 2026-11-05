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

export interface BredForgeCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
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
  [key: string]: any;
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
  ...restProps
}) => {
  const [internalBank, setInternalBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [sampleLoaded, setSampleLoaded] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof propActiveBank === 'number') {
      const bankMap: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      setInternalBank(bankMap[propActiveBank] || 'A');
    } else if (typeof propActiveBank === 'string' && ['A', 'B', 'C', 'D'].includes(propActiveBank)) {
      setInternalBank(propActiveBank as 'A' | 'B' | 'C' | 'D');
    }
  }, [propActiveBank]);

  // Phase 1 Touch-Latency Event Shield
  useEffect(() => {
    const padElements = document.querySelectorAll('.groove-pad-target');
    const handleTouchStart = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSampleLoaded(true);
      if (onAudioUpload) onAudioUpload(file);
      else if (sampleLoader?.loadFromFile) sampleLoader.loadFromFile(file);
    }
  };

  const handlePadClick = (padIndex: number) => {
    const bankMap = { A: 0, B: 1, C: 2, D: 3 };
    const bankNum = bankMap[internalBank];
    if (onPadTrigger) onPadTrigger(bankNum, padIndex);
    else if (sampleManager?.playPad) sampleManager.playPad(bankNum, padIndex);
  };

  return (
    <div {...restProps} className={`flex flex-col w-full max-w-md mx-auto p-4 bg-[#0a0a0a] text-zinc-100 rounded-xl select-none ${restProps.className || ''}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-lg font-bold tracking-wider text-amber-500">BredForge SP/Tracker</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-zinc-400">BPM: {bpm}</span>
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
          </div>
        </div>
        <div className="flex gap-1">
          {(['A', 'B', 'C', 'D'] as const).map((bank) => (
            <button
              key={bank}
              onClick={() => setInternalBank(bank)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                internalBank === bank ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {bank}
            </button>
          ))}
        </div>
      </div>

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
              className={`px-3 py-1 text-xs font-bold rounded ${
                isPlaying ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              PLAY
            </button>
          )}
          <button
            onClick={onStop}
            className="px-3 py-1 bg-zinc-800 hover:bg-red-900/50 hover:text-red-400 text-xs font-bold rounded text-zinc-300 border border-zinc-700"
          >
            STOP
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 16 }).map((_, index) => {
          const padDisplayNum = (index + 1).toString().padStart(2, '0');
          const isActivePad = activePad === index;
          return (
            <button
              key={index}
              onClick={() => handlePadClick(index)}
              className={`groove-pad-target aspect-square flex flex-col items-center justify-center bg-zinc-900 border-2 ${
                isActivePad ? 'border-amber-400 bg-amber-500/20' : 'border-zinc-700 hover:border-amber-500'
              } active:bg-amber-500/30 active:border-amber-400 rounded-lg transition-colors shadow-inner`}
              style={{
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
            >
              <span className="text-[10px] font-mono text-zinc-500">{internalBank}{padDisplayNum}</span>
              <span className="text-sm font-bold text-zinc-200 mt-1">{index + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};