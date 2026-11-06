// ============================================================================
// STAGE E - PHASE 27: RETRO CRT MATRIX & FIXED-GEOMETRY TRACKER BASE LAYOUT (TrackerLayout.tsx)
// ============================================================================

import React from 'react';
import { ProjectStateSchema, createInitialTrackerState } from '../../services/tracker/TrackerState';

export interface TrackerLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  projectState?: ProjectStateSchema;
  activeBpm?: number;
  activePhraseKey?: string;
  isPlaying?: boolean;
  isRecording?: boolean;
  onPlayToggle?: () => void;
  onStop?: () => void;
  onRecordToggle?: () => void;
  onBankChange?: (bankIndex: number) => void;
  [key: string]: any;
}

export const TrackerLayout: React.FC<TrackerLayoutProps> = ({
  projectState = createInitialTrackerState(),
  activeBpm = 120,
  activePhraseKey = '01',
  isPlaying = false,
  isRecording = false,
  onPlayToggle,
  onStop,
  onRecordToggle,
  onBankChange,
  ...restProps
}) => {
  return (
    <div
      {...restProps}
      className="w-screen h-screen overflow-hidden flex flex-col p-3 bg-zinc-950 text-emerald-500 font-mono select-none box-border"
    >
      {/* 1. HEADER SECTION: Global tracking information (BPM, active Phrase/Chain ID, playback loop markers) */}
      <header className="flex justify-between items-center px-4 py-3 bg-zinc-900 border border-emerald-500/30 rounded-t shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-600 uppercase tracking-widest">SYSTEM</span>
            <span className="text-sm font-bold tracking-wider">BRED-FORGE v1.0</span>
          </div>
          <div className="h-6 w-[1px] bg-emerald-500/30" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-600">BPM:</span>
            <span className="text-sm font-bold">{activeBpm}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-600">PHRASE:</span>
            <span className="text-sm font-bold">[{activePhraseKey}]</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/50 border border-emerald-500/20 rounded">
            <span className="text-xs text-emerald-600">LOOP:</span>
            <span className="text-xs font-bold text-emerald-400">01-16</span>
          </div>
          <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-800'}`} />
        </div>
      </header>

      {/* 2. MIDDLE SEQUENCER BOX: Fixed-height scroll container lined with structural vertical guides for row data columns */}
      <main className="flex-1 my-2 bg-zinc-900/80 border-x border-emerald-500/30 overflow-hidden flex flex-col p-3 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100%_24px] pointer-events-none" />
        
        {/* Column Headers */}
        <div className="grid grid-cols-6 gap-2 pb-2 mb-2 border-b border-emerald-500/20 text-xs font-bold text-emerald-400">
          <div className="text-center">ROW</div>
          <div className="text-center">NOTE</div>
          <div className="text-center">INSTRUMENT</div>
          <div className="text-center">VOLUME</div>
          <div className="text-center">FX TYPE</div>
          <div className="text-center">FX PARAM</div>
        </div>

        {/* Scrollable Sequencer Row Data Grid */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
          {Array.from({ length: 16 }).map((_, idx) => {
            const stepNum = String(idx + 1).padStart(2, '0');
            const isEven = idx % 2 === 0;
            return (
              <div
                key={idx}
                className={`grid grid-cols-6 gap-2 py-1.5 px-2 rounded items-center text-xs transition-colors ${
                  isEven ? 'bg-black/20' : 'bg-transparent'
                } hover:bg-emerald-500/10 cursor-pointer`}
              >
                <div className="text-center text-emerald-600 font-bold">{stepNum}</div>
                <div className="text-center text-zinc-400">---</div>
                <div className="text-center text-zinc-500">00</div>
                <div className="text-center text-zinc-400">--</div>
                <div className="text-center text-zinc-500">OFF</div>
                <div className="text-center text-zinc-500">00</div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 3. BOTTOM CONTROLLER PANEL: Modular layout mapping out transport macro triggers (PLAY, STOP, RECORD) alongside bank switch buttons */}
      <footer className="flex justify-between items-center px-4 py-3 bg-zinc-900 border border-emerald-500/30 rounded-b shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        {/* Bank Switch Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-600 mr-1">BANK:</span>
          {['A', 'B', 'C', 'D'].map((bankLabel, bIdx) => (
            <button
              key={bankLabel}
              onClick={() => onBankChange && onBankChange(bIdx)}
              className="px-3 py-1 bg-zinc-950 border border-emerald-500/40 hover:border-emerald-400 text-xs font-bold rounded text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              [{bankLabel}]
            </button>
          ))}
        </div>

        {/* Transport Macro Triggers */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayToggle}
            className={`px-4 py-1.5 border text-xs font-bold rounded transition-all cursor-pointer ${
              isPlaying
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_#10b981]'
                : 'bg-zinc-950 text-emerald-500 border-emerald-500/40 hover:bg-emerald-500/20'
            }`}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <button
            onClick={onStop}
            className="px-4 py-1.5 bg-zinc-950 border border-emerald-500/40 hover:border-emerald-400 text-xs font-bold rounded text-emerald-500 hover:bg-emerald-500/20 transition-all cursor-pointer"
          >
            STOP
          </button>
          <button
            onClick={onRecordToggle}
            className={`px-4 py-1.5 border text-xs font-bold rounded transition-all cursor-pointer ${
              isRecording
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_#ef4444]'
                : 'bg-zinc-950 text-red-500/70 border-red-500/30 hover:bg-red-500/10'
            }`}
          >
            {isRecording ? 'REC [ON]' : 'REC'}
          </button>
        </div>
      </footer>
    </div>
  );
};