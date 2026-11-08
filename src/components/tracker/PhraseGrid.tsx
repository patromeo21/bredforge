// ============================================================================
// BREDFORGE v1.0 — TRACKER PHRASE GRID & STEP VIEW [REF: M44]
// ============================================================================

import React, { useEffect, useState } from 'react';
import { trackerSequenceEngine } from '../../services/audio/TrackerSequenceEngine';

export function PhraseGrid() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(trackerSequenceEngine.getBpm());

  useEffect(() => {
    trackerSequenceEngine.setOnStep((step) => {
      setActiveStep(step);
    });
  }, []);

  const togglePlayback = () => {
    // Requires an active AudioContext instance from user gesture
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();

    if (isPlaying) {
      trackerSequenceEngine.stop();
      setIsPlaying(false);
    } else {
      trackerSequenceEngine.start(ctx);
      setIsPlaying(true);
    }
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    trackerSequenceEngine.setBpm(newBpm);
  };

  // Generate 16 visible rows for demonstration of a pattern block
  const rows = Array.from({ length: 16 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 shadow-inner font-mono text-xs select-none">
      {/* Tracker Header / Transport Bar */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayback}
            className={`px-3 py-1.5 rounded font-bold transition-all ${
              isPlaying
                ? 'bg-amber-500 text-zinc-950 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {isPlaying ? 'STOP [■]' : 'PLAY [▶]'}
          </button>
          <span className="text-zinc-400 text-[10px]">TRACKER // PHRASE 00</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[10px]">BPM</span>
          <input
            type="number"
            min="40"
            max="300"
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="w-14 bg-zinc-900 border border-zinc-700 text-amber-400 text-center rounded px-1 py-0.5 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Tracker Step Grid */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        <div className="grid grid-cols-5 text-[10px] text-zinc-500 pb-1 px-2 border-b border-zinc-900">
          <span>STEP</span>
          <span>NOTE</span>
          <span>INST</span>
          <span>FX</span>
          <span>VAL</span>
        </div>

        {rows.map((row) => {
          const isCurrent = isPlaying && activeStep % 16 === row;
          return (
            <div
              key={row}
              className={`grid grid-cols-5 items-center px-2 py-1.5 rounded transition-colors ${
                isCurrent
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
                  : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900'
              }`}
            >
              <span className="text-zinc-500">{row.toString().padStart(2, '0')}</span>
              <span className="text-zinc-200">C-4</span>
              <span className="text-amber-500/80">01</span>
              <span className="text-zinc-400">--</span>
              <span className="text-zinc-500">00</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PhraseGrid;