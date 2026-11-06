// ============================================================================
// BREDFORGE v1.0 — PHRASE STEP SEQUENCER GRID WITH PLAYHEAD (PhraseGrid.tsx)
// ============================================================================

import React from 'react';

export interface PhraseGridProps {
  activeRowIndex: number; // Current step row driven by transport clock (0 - 63)
}

export const PhraseGrid: React.FC<PhraseGridProps> = ({ activeRowIndex }) => {
  // 64 Steps vertical phrase structure typical of advanced hardware trackers
  const totalRows = 64;
  const columns = ['NOTE', 'INST', 'VOL', 'FX1', 'FX2'];

  return (
    <div className="flex-1 bg-zinc-950 border border-emerald-500/30 rounded flex flex-col overflow-hidden font-mono text-[11px]">
      
      {/* Grid Column Headers */}
      <div className="grid grid-cols-6 bg-black/80 border-b border-emerald-500/30 px-2 py-1 text-[10px] text-emerald-500/80 font-bold sticky top-0 z-10">
        <span className="text-center">ROW</span>
        {columns.map((col, idx) => (
          <span key={idx} className="text-center">{col}</span>
        ))}
      </div>

      {/* Scrollable Step Rows */}
      <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-emerald-500/10">
        {Array.from({ length: totalRows }).map((_, rowIndex) => {
          const isCurrentRow = rowIndex === activeRowIndex;
          const isBeatMarker = rowIndex % 4 === 0;

          return (
            <div
              key={rowIndex}
              className={`grid grid-cols-6 items-center px-2 py-0.5 transition-colors ${
                isCurrentRow
                  ? 'bg-emerald-500/30 text-emerald-200 shadow-[inset_0_0_8px_rgba(16,185,129,0.4)] font-bold'
                  : isBeatMarker
                  ? 'bg-zinc-900/60 text-emerald-400/90'
                  : 'bg-transparent text-emerald-600/60 hover:bg-emerald-500/5'
              }`}
            >
              {/* Row Number Identifier */}
              <span className="text-center text-[10px] tracking-widest">
                {String(rowIndex).padStart(2, '0')}
              </span>

              {/* Step Sequence Columns (Note, Instrument, Volume, FX1, FX2) */}
              <span className="text-center">---</span>
              <span className="text-center">--</span>
              <span className="text-center">--</span>
              <span className="text-center">---</span>
              <span className="text-center">---</span>
            </div>
          );
        })}
      </div>

    </div>
  );
};
