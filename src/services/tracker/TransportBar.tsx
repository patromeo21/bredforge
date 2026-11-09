// ============================================================================
// BREDFORGE v1.0 — MASTER TRANSPORT & CLOCK BAR [REF: TRANSPORT-BAR-01]
// ============================================================================

import React, { useState, useEffect } from 'react';
import { transportService } from '../../services/TransportService';

export function TransportBar() {
  const [isPlaying, setIsPlaying] = useState<boolean>(transportService.getIsPlaying());
  const [bpm, setBpm] = useState<number>(transportService.getBpm());
  const [activeRow, setActiveRow] = useState<number>(0);

  useEffect(() => {
    // Subscribe to play/stop state changes
    const unsubState = transportService.subscribeState((playing) => {
      setIsPlaying(playing);
    });

    // Subscribe to high-speed clock ticks for row/step progression
    const unsubTicks = (_, row) => {
      setActiveRow(row);
    };
    const unsubscribeTicks = transportService.subscribeTicks(unsubTicks);

    return () => {
      unsubState();
      unsubscribeTicks();
    };
  }, []);

  const handleTogglePlay = () => {
    transportService.toggle();
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBpm(val);
    transportService.setBpm(val);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl font-mono text-xs gap-3 select-none">
      
      {/* Play/Stop & Status */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <button
          onClick={handleTogglePlay}
          className={`px-4 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
            isPlaying
              ? 'bg-rose-500 text-zinc-950 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
              : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
          }`}
        >
          {isPlaying ? '■ STOP' : '▶ PLAY'}
        </button>

        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-500">CLOCK:</span>
          <span className={`text-xs font-bold ${isPlaying ? 'text-amber-400' : 'text-zinc-600'}`}>
            {isPlaying ? `ROW ${activeRow < 10 ? `0${activeRow}` : activeRow}` : 'IDLE'}
          </span>
        </div>
      </div>

      {/* BPM Controls */}
      <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 w-full sm:w-auto justify-between">
        <span className="text-[10px] text-zinc-400 tracking-wider">TEMPO (BPM)</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={handleBpmChange}
            className="w-24 accent-amber-500 cursor-pointer"
          />
          <input
            type="number"
            min="40"
            max="300"
            value={bpm}
            onChange={handleBpmChange}
            className="w-12 bg-zinc-900 text-amber-400 font-bold text-center py-0.5 rounded border border-zinc-800 outline-none"
          />
        </div>
      </div>

    </div>
  );
}

export default TransportBar;
