// ============================================================================
// BREDFORGE v1.0 — SONG VIEW MATRIX (SongView.tsx) [COORD: (1,1)]
// ============================================================================

import React from 'react';

export const SongView: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl select-none font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-slate-100 text-sm tracking-wider">
            SONG MATRIX VIEW
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            8 Vertical Track Columns Mapping 2-Digit Hex Chain IDs
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold">
          SONG (1,1)
        </span>
      </div>

      {/* Song Track Columns */}
      <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-900/40 p-2">
        <div className="grid grid-cols-9 gap-2 border-b border-slate-800 pb-2 text-[10px] text-slate-500 font-bold text-center">
          <div>ROW</div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>TRK {i + 1}</div>
          ))}
        </div>

        <div className="flex flex-col gap-1 mt-2">
          {Array.from({ length: 16 }).map((_, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-9 gap-2 items-center text-center text-xs">
              <div className="text-slate-500 font-bold">
                {rowIdx.toString(16).toUpperCase().padStart(2, '0')}
              </div>
              {Array.from({ length: 8 }).map((_, colIdx) => (
                <div
                  key={colIdx}
                  className={`py-1 rounded border ${
                    rowIdx === 0
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  {rowIdx === 0 ? (colIdx * 2).toString(16).toUpperCase().padStart(2, '0') : '--'}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};