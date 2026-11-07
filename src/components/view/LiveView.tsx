// ============================================================================
// BREDFORGE v1.0 — LIVE PERFORMANCE VIEW (LiveView.tsx) [COORD: (0,1)]
// ============================================================================

import React from 'react';

export const LiveView: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl select-none font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-slate-100 text-sm tracking-wider">
            LIVE PERFORMANCE MATRIX
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            8-Track Chain Queuing, Instant Mute/Solo & Punch-In FX Bus
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
          LIVE (0,1)
        </span>
      </div>

      {/* 8 Track Launcher Grid */}
      <div className="grid grid-cols-8 gap-2 flex-1">
        {Array.from({ length: 8 }).map((_, trkIdx) => (
          <div
            key={trkIdx}
            className="flex flex-col justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-center"
          >
            <div className="text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1">
              TRK 0{trkIdx + 1}
            </div>
            <div className="my-4 flex flex-col gap-1 items-center">
              <span className="text-[9px] text-slate-500">CHAIN</span>
              <span className="text-sm font-bold text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 w-full">
                {(trkIdx * 2).toString(16).toUpperCase().padStart(2, '0')}
              </span>
            </div>
            <div className="flex gap-1 justify-center text-[9px] font-bold">
              <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-500">
                M
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-500">
                S
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};