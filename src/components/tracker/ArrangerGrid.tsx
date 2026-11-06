// ============================================================================
// STAGE F - PAGE 2 SUB: SONG ARRANGEMENT VIEWER (ArrangerGrid.tsx)
// ============================================================================

import React from 'react';
import { ProjectStateSchema } from '../../services/tracker/TrackerState';

export interface ArrangerGridProps {
  projectState?: ProjectStateSchema;
  activeSongRowIndex?: number;
  onSelectSongRow?: (rowIdx: number) => void;
}

export const ArrangerGrid: React.FC<ArrangerGridProps> = ({
  projectState,
  activeSongRowIndex = 0,
  onSelectSongRow,
}) => {
  const songRows = [
    { step: '00', chain: 'C01', reps: '04', trans: '+00' },
    { step: '01', chain: 'C02', reps: '02', trans: '+02' },
    { step: '02', chain: 'C01', reps: '04', trans: '+00' },
    { step: '03', chain: 'C03', reps: '01', trans: '-02' },
    { step: '04', chain: '---', reps: '--', trans: '---' },
    { step: '05', chain: '---', reps: '--', trans: '---' },
    { step: '06', chain: '---', reps: '--', trans: '---' },
    { step: '07', chain: '---', reps: '--', trans: '---' },
  ];

  return (
    <div className="flex flex-col h-full bg-black/40 border border-emerald-500/20 rounded p-2 font-mono text-[11px] overflow-hidden">
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-emerald-500/20">
        <span className="text-emerald-400 font-bold tracking-wider">[ SONG TIMELINE ARRANGER ]</span>
        <span className="text-[9px] text-emerald-600">CHAIN SLOTS</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
        {songRows.map((row, idx) => {
          const isSelected = activeSongRowIndex === idx;
          return (
            <div
              key={row.step}
              onClick={() => onSelectSongRow && onSelectSongRow(idx)}
              className={`flex items-center justify-between px-3 py-1.5 rounded border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-emerald-500/70 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-emerald-600 font-bold">{row.step}</span>
                <span className="tracking-widest">CHAIN: <strong className="text-emerald-400">{row.chain}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span>REPS: {row.reps}</span>
                <span>TRANS: {row.trans}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};