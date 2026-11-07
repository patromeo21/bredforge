// ============================================================================
// BREDFORGE v1.0 — GROOVE VIEW PATTERN LAUNCHER (3,0) (GrooveView.tsx)
// ============================================================================

import React, { useState } from 'react';

export interface PatternSlot {
  id: number;
  name: string;
  length: number;
  isQueued: boolean;
  isPlaying: boolean;
}

export const GrooveView: React.FC = () => {
  const [patterns, setPatterns] = useState<PatternSlot[]>(
    Array.from({ length: 16 }).map((_, idx) => ({
      id: idx,
      name: `PAT ${idx.toString(16).toUpperCase().padStart(2, '0')}`,
      length: 16,
      isQueued: false,
      isPlaying: idx === 0,
    }))
  );

  const [activeBank, setActiveBank] = useState<string>('A');
  const [swing, setSwing] = useState<number>(50); // % swing

  const handlePatternClick = (id: number) => {
    setPatterns((prev) =>
      prev.map((p) => ({
        ...p,
        isQueued: p.id === id ? !p.isQueued : false,
        isPlaying: p.id === id ? true : p.isPlaying,
      }))
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl select-none font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-slate-100 text-sm tracking-wider">
            GROOVE VIEW // PATTERN LAUNCHER (3,0)
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            Live clip triggering, scene orchestration, and groove swing control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 border border-slate-800 rounded p-1 gap-1">
            {['A', 'B', 'C', 'D'].map((bank) => (
              <button
                key={bank}
                onClick={() => setActiveBank(bank)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  activeBank === bank
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {bank}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pattern Grid (4x4 Matrix) */}
      <div className="grid grid-cols-4 gap-3 flex-1 overflow-auto p-1">
        {patterns.map((pat) => (
          <button
            key={pat.id}
            onClick={() => handlePatternClick(pat.id)}
            className={`flex flex-col justify-between p-3 rounded-xl border transition-all text-left relative overflow-hidden ${
              pat.isPlaying
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/10'
                : pat.isQueued
                ? 'bg-amber-500/20 border-amber-500 text-amber-200 animate-pulse'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] text-slate-500 font-bold">
                {activeBank}-{pat.id.toString(16).toUpperCase().padStart(2, '0')}
              </span>
              {pat.isPlaying && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <div className="my-2">
              <div className="font-bold text-sm tracking-tight">{pat.name}</div>
              <div className="text-[9px] text-slate-400">{pat.length} Steps</div>
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">
              {pat.isPlaying ? 'Playing' : pat.isQueued ? 'Queued' : 'Ready'}
            </div>
          </button>
        ))}
      </div>

      {/* Groove & Swing Controls Footer */}
      <div className="flex justify-between items-center border-t border-slate-800 pt-3 text-[10px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>SWING: <strong className="text-slate-200">{swing}%</strong></span>
          <input
            type="range"
            min="50"
            max="75"
            value={swing}
            onChange={(e) => setSwing(Number(e.target.value))}
            className="w-24 accent-emerald-500 cursor-pointer"
          />
        </div>
        <div>[CLICK]: Queue/Launch Pattern | [BANK A-D]: Switch Banks</div>
      </div>
    </div>
  );
};