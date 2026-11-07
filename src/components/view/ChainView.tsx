// ============================================================================
// BREDFORGE v1.0 — CHAIN VIEW (ChainView.tsx) [COORD: (2,1)]
// ============================================================================

import React from 'react';

export const ChainView: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl select-none font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-slate-100 text-sm tracking-wider">
            CHAIN VIEW // CHAIN 00
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            16 Phrase Slots with Hex Semitone Transposition Offsets
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold">
          CHAIN (2,1)
        </span>
      </div>

      {/* 16-Row Phrase Mapping Table */}
      <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-900/40 p-2">
        <div className="grid grid-cols-3 gap-4 border-b border-slate-800 pb-2 text-[10px] text-slate-500 font-bold text-center">
          <div>STEP</div>
          <div>PHRASE ID</div>
          <div>TRANSPOSE</div>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          {Array.from({ length: 16 }).map((_, stepIdx) => (
            <div key={stepIdx} className="grid grid-cols-3 gap-4 items-center text-center text-xs">
              <div className="text-slate-500 font-bold">
                {stepIdx.toString(16).toUpperCase().padStart(2, '0')}
              </div>
              <div className={`py-1 rounded border ${stepIdx < 4 ? 'bg-slate-900 border-slate-700 text-cyan-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                {stepIdx < 4 ? '01' : '--'}
              </div>
              <div className="py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
                +00
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};