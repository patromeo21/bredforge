// ============================================================================
// STAGE E - PHASE 32 SUB: COMPACT MODULAR TRANSPORT CONTROLLER (TransportFooter.tsx)
// ============================================================================

import React from 'react';

export interface TransportFooterProps {
  activeBankIndex: number;
  setActiveBankIndex: (idx: number) => void;
  isRecording: boolean;
  setIsRecording: (rec: boolean) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onStop: () => void;
}

export const TransportFooter: React.FC<TransportFooterProps> = ({
  activeBankIndex,
  setActiveBankIndex,
  isRecording,
  setIsRecording,
  isPlaying,
  onPlayToggle,
  onStop
}) => {
  return (
    <footer className="flex justify-between items-center px-4 py-3 bg-zinc-900 border border-emerald-500/30 rounded-b shadow-[0_0_15px_rgba(16,185,129,0.1)]">
      {/* Pad Bank Selector Switches */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-emerald-600 mr-1">BANK:</span>
        {['A', 'B', 'C', 'D'].map((bankLabel, bIdx) => (
          <button
            key={bankLabel}
            onClick={() => setActiveBankIndex(bIdx)}
            className={`px-3 py-1 border text-xs font-bold rounded transition-all cursor-pointer ${
              activeBankIndex === bIdx
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                : 'bg-black/40 text-emerald-500/70 border-emerald-500/20 hover:border-emerald-500/40'
            }`}
          >
            {bankLabel}
          </button>
        ))}
      </div>

      {/* Main Tape Transport Deck Controls */}
      <div className="flex items-center gap-2">
        {/* Record Arm Key */}
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`px-4 py-1.5 border text-xs font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
            isRecording 
              ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
              : 'bg-black/50 text-red-500 border-red-900/50'
          }`}
        >
          {isRecording ? '● REC ACTIVE' : '○ RECORD'}
        </button>

        {/* Play / Pause Toggle Key */}
        <button
          onClick={onPlayToggle}
          className={`px-5 py-1.5 border text-xs font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
            isPlaying 
              ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
              : 'bg-black/50 text-emerald-500 border-emerald-500/40'
          }`}
        >
          {isPlaying ? '■ PAUSE' : '▶ PLAY'}
        </button>

        {/* Hard Reset Stop Key */}
        <button
          onClick={onStop}
          className="px-4 py-1.5 bg-black/50 hover:bg-zinc-800 text-zinc-400 border border-zinc-700/50 hover:border-zinc-500 text-xs font-bold rounded uppercase tracking-wider transition-all cursor-pointer"
        >
          ⎋ STOP
        </button>
      </div>
    </footer>
  );
};
