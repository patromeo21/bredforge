import React, { useEffect, useState, useRef } from 'react';

export interface BredForgeCanvasProps {
  onPadTrigger?: (bankIndex: number, padIndex: number) => void;
  onAudioUpload?: (file: File) => void;
}

export const BredForgeCanvas: React.FC<BredForgeCanvasProps> = ({
  onPadTrigger,
  onAudioUpload,
}) => {
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [sampleLoaded, setSampleLoaded] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PHASE 1: THE TOUCH-LATENCY EVENT SHIELD
  // Injects non-destructive touch isolation specifically for performance pads
  // while leaving native file inputs and text elements completely untouched.
  useEffect(() => {
    const padElements = document.querySelectorAll('.groove-pad-target');

    const handleTouchStart = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault(); // Bypass Safari/WebKit 300ms tap delay & zoom interference
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
  }, [activeBank]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSampleLoaded(true);
      if (onAudioUpload) {
        onAudioUpload(file);
      }
    }
  };

  const handlePadClick = (padIndex: number) => {
    const bankMap = { A: 0, B: 1, C: 2, D: 3 };
    const bankNum = bankMap[activeBank];
    if (onPadTrigger) {
      onPadTrigger(bankNum, padIndex);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto p-4 bg-[#0a0a0a] text-zinc-100 rounded-xl select-none">
      {/* Header & Bank Selector */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold tracking-wider text-amber-500">BredForge SP/Tracker</h1>
        <div className="flex gap-1">
          {(['A', 'B', 'C', 'D'] as const).map((bank) => (
            <button
              key={bank}
              onClick={() => setActiveBank(bank)}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                activeBank === bank
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {bank}
            </button>
          ))}
        </div>
      </div>

      {/* File Upload Section (Preserved & Untouched by Touch Shield) */}
      <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          {sampleLoaded ? 'Sample Loaded' : 'No Sample Loaded'}
        </span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded text-zinc-200 border border-zinc-700"
        >
          Import Audio
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 4x4 Pad Grid with Touch Shield Class */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 16 }).map((_, index) => {
          const padDisplayNum = (index + 1).toString().padStart(2, '0');
          return (
            <button
              key={index}
              onClick={() => handlePadClick(index)}
              className="groove-pad-target aspect-square flex flex-col items-center justify-center bg-zinc-900 border-2 border-zinc-700 hover:border-amber-500 active:bg-amber-500/20 active:border-amber-400 rounded-lg transition-colors shadow-inner"
              style={{
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
            >
              <span className="text-xs font-mono text-zinc-500">{activeBank}{padDisplayNum}</span>
              <span className="text-sm font-bold text-zinc-200 mt-1">{index + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};