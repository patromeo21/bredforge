// ============================================================================
// BREDFORGE v1.0 — TRACKER PHRASE GRID (PhraseGrid.tsx) [PHASE 15 ROLLBACK]
// ============================================================================

import React, { useState } from 'react';

interface PhraseStep {
  step: number;
  note: string;     // e.g., "C-4", "---"
  velocity: string; // Hex 00-7F
  instrument: string; // Hex 00-FF
  fx1: string;      // Command FX 1
  fx2: string;      // Command FX 2
}

export const PhraseGrid: React.FC = () => {
  const [cursorRow, setCursorRow] = useState<number>(0);
  const [cursorCol, setCursorCol] = useState<number>(0);

  // Initialize 16-step M8 phrase pattern
  const [steps] = useState<PhraseStep[]>(
    Array.from({ length: 16 }).map((_, idx) => ({
      step: idx,
      note: idx % 4 === 0 ? 'C-4' : '---',
      velocity: idx % 4 === 0 ? '64' : '--',
      instrument: idx % 4 === 0 ? '00' : '--',
      fx1: idx === 0 ? 'V08' : '---',
      fx2: '---',
    }))
  );

  const columns = ['STEP', 'NOTE', 'VEL', 'INST', 'FX1', 'FX2'];

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl select-none font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-slate-100 text-sm tracking-wider">
            PHRASE GRID // PATTERN 01
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            16-Step Monospace Command Columns (Note, Velocity, Instrument, FX)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-bold animate-pulse">
            [ROLLBACK: PHASE 15]
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
            PHRASE (3,1)
          </span>
        </div>
      </div>

      {/* Tracker Grid Table */}
      <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-900/40 p-2">
        {/* Column Headers */}
        <div className="grid grid-cols-6 gap-2 border-b border-slate-800 pb-2 text-[10px] text-slate-500 font-bold text-center">
          {columns.map((col, idx) => (
            <div key={col} className={cursorCol === idx ? 'text-emerald-400 underline' : ''}>
              {col}
            </div>
          ))}
        </div>

        {/* 16 Step Rows */}
        <div className="flex flex-col gap-1 mt-2">
          {steps.map((s, rowIdx) => {
            const isCurrentRow = cursorRow === rowIdx;
            return (
              <div
                key={s.step}
                onClick={() => setCursorRow(rowIdx)}
                className={`grid grid-cols-6 gap-2 items-center text-center py-1 rounded cursor-pointer transition-colors ${
                  isCurrentRow
                    ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-bold'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                {/* Step Index */}
                <div className="text-slate-500 font-bold">
                  {rowIdx.toString(16).toUpperCase().padStart(2, '0')}
                </div>
                {/* Note */}
                <div className={isCurrentRow && cursorCol === 1 ? 'bg-emerald-500 text-slate-950 px-1 rounded' : ''}>
                  {s.note}
                </div>
                {/* Velocity */}
                <div className={isCurrentRow && cursorCol === 2 ? 'bg-emerald-500 text-slate-950 px-1 rounded' : ''}>
                  {s.velocity}
                </div>
                {/* Instrument */}
                <div className={isCurrentRow && cursorCol === 3 ? 'bg-emerald-500 text-slate-950 px-1 rounded' : ''}>
                  {s.instrument}
                </div>
                {/* FX 1 */}
                <div className={isCurrentRow && cursorCol === 4 ? 'bg-emerald-500 text-slate-950 px-1 rounded' : ''}>
                  {s.fx1}
                </div>
                {/* FX 2 */}
                <div className={isCurrentRow && cursorCol === 5 ? 'bg-emerald-500 text-slate-950 px-1 rounded' : ''}>
                  {s.fx2}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-800">
        Use ARROWS to navigate steps/columns. EDIT + ARROWS to modify values.
      </div>
    </div>
  );
};