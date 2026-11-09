// ============================================================================
// BREDFORGE v1.0 — SONG VIEW COMPONENT (MASTER ARRANGEMENT) [REF: SONG-01]
// ============================================================================

import React, { useState } from 'react';

export interface SongRow {
  rowIndex: number;
  track1: string;
  track2: string;
  track3: string;
  track4: string;
  fxCommand: string;
}

interface SongViewProps {
  songName?: string;
  tempo?: number;
  initialRows?: SongRow[];
}

export function SongView({
  songName = 'BRED_MASTER_SONG_01',
  tempo = 124.0,
  initialRows,
}: SongViewProps) {
  const [activeRow, setActiveRow] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [rows, setRows] = useState<SongRow[]>(
    initialRows ||
      Array.from({ length: 16 }, (_, idx) => ({
        rowIndex: idx,
        track1: idx < 8 ? `CHAIN 0${idx % 2}` : '--------',
        track2: idx >= 2 && idx < 10 ? `CHAIN 02` : '--------',
        track3: idx >= 4 && idx < 12 ? `CHAIN 03` : '--------',
        track4: '--------',
        fxCommand: idx === 7 ? 'LPF SWEEP' : idx === 15 ? 'MASTER END' : '---',
      }))
  );

  const handleCycleChain = (rowIndex: number, trackKey: 'track1' | 'track2' | 'track3' | 'track4') => {
    const chainOptions = ['--------', 'CHAIN 00', 'CHAIN 01', 'CHAIN 02', 'CHAIN 03'];
    setRows((prev) => {
      const next = [...prev];
      const currentRow = { ...next[rowIndex] };
      const currentVal = currentRow[trackKey];
      const currIdx = chainOptions.indexOf(currentVal);
      const nextVal = chainOptions[(currIdx + 1) % chainOptions.length];
      currentRow[trackKey] = nextVal;
      next[rowIndex] = currentRow;
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-3 gap-3 select-none overflow-hidden border border-zinc-800 rounded-lg">
      
      <div className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-lg shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            SONG VIEW // {songName}
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            {tempo.toFixed(1)} BPM
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
              isPlaying
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {isPlaying ? '■ PAUSE TIMELINE' : '▶ PLAY ARRANGEMENT'}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-lg p-2.5 flex flex-col min-h-0 overflow-hidden">
        
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 px-2">
          <span className="w-10">ROW</span>
          <span className="w-24 text-center">TRK 1 (DRUMS)</span>
          <span className="w-24 text-center">TRK 2 (BASS)</span>
          <span className="w-24 text-center">TRK 3 (SYNTH)</span>
          <span className="w-24 text-center">TRK 4 (VOCAL)</span>
          <span className="flex-1 text-right">MASTER FX</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {rows.map((row, idx) => (
            <div
              key={idx}
              onClick={() => setActiveRow(idx)}
              className={`flex items-center justify-between px-3 py-2 rounded text-xs border cursor-pointer transition-all ${
                activeRow === idx
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <span className="w-10 text-zinc-600 font-bold flex items-center gap-1">
                {isPlaying && activeRow === idx ? '▶' : ''}
                {idx < 10 ? `0${idx}` : idx}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCycleChain(idx, 'track1');
                }}
                className="w-24 px-2 py-1 bg-zinc-900 hover:bg-amber-500/20 text-amber-400 border border-zinc-800 rounded text-center text-[11px] font-bold cursor-pointer"
              >
                {row.track1}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCycleChain(idx, 'track2');
                }}
                className="w-24 px-2 py-1 bg-zinc-900 hover:bg-amber-500/20 text-sky-400 border border-zinc-800 rounded text-center text-[11px] font-bold cursor-pointer"
              >
                {row.track2}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCycleChain(idx, 'track3');
                }}
                className="w-24 px-2 py-1 bg-zinc-900 hover:bg-amber-500/20 text-emerald-400 border border-zinc-800 rounded text-center text-[11px] font-bold cursor-pointer"
              >
                {row.track3}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCycleChain(idx, 'track4');
                }}
                className="w-24 px-2 py-1 bg-zinc-900 hover:bg-amber-500/20 text-purple-400 border border-zinc-800 rounded text-center text-[11px] font-bold cursor-pointer"
              >
                {row.track4}
              </button>

              <span className="flex-1 text-right text-zinc-300 text-[11px] pr-2">
                {row.fxCommand}
              </span>
            </div>
          ))}
        </div>

      </div>

      <div className="flex justify-between items-center text-[9px] text-zinc-500 px-1 shrink-0">
        <span>Click any track slot to assign or cycle through recorded chains.</span>
        <span className="text-emerald-400 font-bold">MASTER ARRANGEMENT TIMELINE READY</span>
      </div>

    </div>
  );
}

export default SongView;
