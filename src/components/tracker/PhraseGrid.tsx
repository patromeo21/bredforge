// ============================================================================
// BREDFORGE v1.0 — PHRASE GRID TRACKER VIEW (PhraseGrid.tsx)
// ============================================================================

import React, { useState } from 'react';
import { SampleManager } from '../../services/audio/SampleManager';

export function PhraseGrid() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [trackSlots, setTrackSlots] = useState<{ [key: number]: string }>({
    1: 'KICK_01',
    2: 'SNARE_01',
    3: 'CHORD_01',
    4: 'LEAD_01',
  });

  // Example handler where slot index (number) is converted to a strict string ID
  const handleLoadDefaultSample = async (slotIndex: number) => {
    const stringId = `slot-${slotIndex}`;
    const name = trackSlots[slotIndex] || `SAMPLE_${slotIndex}`;
    const url = `/assets/samples/${name.toLowerCase()}.wav`;

    // Explicitly passing a string ID to satisfy strict typing
    await SampleManager.loadSampleFromUrl(stringId, name, url);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs select-none overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold">
            [1,0]
          </span>
          <span className="font-bold tracking-wider text-zinc-200">PHRASE GRID // TRACKER</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          STEP: {activeStep} / 64
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {[1, 2, 3, 4].map((trackId) => (
          <div key={trackId} className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 p-2 rounded">
            <span className="text-emerald-400 font-bold w-12">TRK {trackId}</span>
            <span className="text-zinc-300 flex-1">{trackSlots[trackId]}</span>
            <button 
              onClick={() => handleLoadDefaultSample(trackId)}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] border border-zinc-700"
            >
              LOAD BUFFER
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

export default PhraseGrid;