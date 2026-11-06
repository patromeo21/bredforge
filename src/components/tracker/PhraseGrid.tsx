// ============================================================================
// BREDFORGE v1.0 — PHRASE GRID & LIVE RECORDING COMPONENT (PhraseGrid.tsx)
// ============================================================================

import React, { useState } from 'react';
import { useLiveStepRecord } from '../../hooks/useLiveStepRecord';
import { SequencerAudioBridge } from '../../services/audio/SequencerAudioBridge';

interface PhraseGridProps {
  audioBridge?: SequencerAudioBridge;
  totalRows?: number;
  activeRowIndex?: number;
}

export const PhraseGrid: React.FC<PhraseGridProps> = ({ audioBridge, totalRows = 64, activeRowIndex }) => {
  const [activeVoiceKey] = useState<string>('channel-1');
  const { isRecording, setIsRecording, activeInstrument, setActiveInstrument, recordPadHit } = useLiveStepRecord(
    {} as any,
    totalRows,
    () => {}
  );

  // Use external activeRowIndex if provided by TrackerLayout, otherwise fallback to 0
  const effectiveCursor = activeRowIndex !== undefined ? activeRowIndex : 0;

  // 4x4 interactive pad layout mapping to notes & instruments
  const padGrid = [
    { id: 0, note: 'C-4', label: 'C4 (Kick)' },
    { id: 1, note: 'D-4', label: 'D4 (Snare)' },
    { id: 2, note: 'E-4', label: 'E4 (Hat)' },
    { id: 3, note: 'F-4', label: 'F4 (Clap)' },
    { id: 4, note: 'G-4', label: 'G4 (Perc 1)' },
    { id: 5, note: 'A-4', label: 'A4 (Perc 2)' },
    { id: 6, note: 'B-4', label: 'B4 (Bass)' },
    { id: 7, note: 'C-5', label: 'C5 (Lead)' },
    { id: 8, note: 'C#3', label: 'C#3 (Sub)' },
    { id: 9, note: 'D#3', label: 'D#3 (Sub 2)' },
    { id: 10, note: 'F#3', label: 'F#3 (Chord)' },
    { id: 11, note: 'G#3', label: 'G#3 (Chord 2)' },
    { id: 12, note: 'A#3', label: 'A#3 (FX 1)' },
    { id: 13, note: 'C#4', label: 'C#4 (FX 2)' },
    { id: 14, note: 'D#4', label: 'D#4 (FX 3)' },
    { id: 15, note: 'F#4', label: 'F#4 (FX 4)' },
  ];

  const handlePadTouch = (pad: { id: number; note: string }) => {
    // 1. Trigger audio playback via audio bridge if available
    if (audioBridge) {
      audioBridge.triggerVoice(activeVoiceKey, pad.note, 64);
    }

    // 2. Invoke live recording hook method
    recordPadHit(pad.note, 64);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 select-none touch-none">
      {/* Header & Status */}
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
        <h2 className="text-lg font-mono font-bold tracking-wider text-emerald-400">
          BREDFORGE // LIVE STEP RECORDER
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={`px-3 py-1 rounded font-mono text-xs font-bold border transition-colors ${
              isRecording 
                ? 'bg-red-600 border-red-400 text-white animate-pulse' 
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {isRecording ? 'REC ACTIVE' : 'REC IDLE'}
          </button>
          <div className="font-mono text-sm bg-slate-900 px-3 py-1 rounded border border-slate-700">
            CURSOR: <span className="text-amber-400 font-bold">{String(effectiveCursor).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* 4x4 Touch Pad Grid optimized for iPad touch interaction */}
      <div className="grid grid-cols-4 gap-3 flex-1 my-auto max-w-lg mx-auto w-full">
        {padGrid.map(pad => (
          <button
            key={pad.id}
            onTouchStart={() => handlePadTouch(pad)}
            onMouseDown={() => handlePadTouch(pad)}
            className="flex flex-col items-center justify-center aspect-square bg-slate-900 border-2 border-slate-700 rounded-xl active:bg-emerald-600 active:border-emerald-400 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            <span className="font-mono text-xl font-bold text-slate-200">{pad.note}</span>
            <span className="font-sans text-xs text-slate-400 mt-1">{pad.label}</span>
          </button>
        ))}
      </div>

      {/* Footer Instructions */}
      <div className="text-center font-mono text-xs text-slate-500 mt-4">
        Tap pads to trigger sample buffers & record live sequence steps.
      </div>
    </div>
  );
};