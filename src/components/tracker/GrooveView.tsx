// ============================================================================
// BREDFORGE v1.0 — GROOVE VIEW PATTERN LAUNCHER (3,0) (GrooveView.tsx)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { PatternSequencer } from '../../services/audio/PatternSequencerEngine';

export interface PatternSlot {
  id: number;
  name: string;
  length: number;
}

export const GrooveView: React.FC = () => {
  const [activePattern, setActivePattern] = useState<number>(PatternSequencer.getActivePatternId());
  const [queuedPattern, setQueuedPattern] = useState<number | null>(PatternSequencer.getQueuedPatternId());
  const [activeBank, setActiveBank] = useState<string>('A');
  const [swing, setSwing] = useState<number>(50); // % swing

  // Optional: Poll or listen to sequencer state if needed
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePattern(PatternSequencer.getActivePatternId());
      setQueuedPattern(PatternSequencer.getQueuedPatternId());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handlePatternClick = (id: number) => {
    PatternSequencer.queuePattern(id);
    setActivePattern(PatternSequencer.getActivePatternId());
    setQueuedPattern(id);
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
            Live quantized clip triggering, scene orchestration, and groove swing control.
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
        {Array.from({ length: 16 }).map((_, idx) => {
          const isPlaying = activePattern === idx;
          const isQueued = queuedPattern === idx;

          return (
            <button
              key={idx}
              onClick={() => handlePatternClick(idx)}
              className={`flex flex-col justify-between p-3 rounded-xl border transition-all text-left relative overflow-hidden ${
                isPlaying
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/10'
                  : isQueued
                  ? 'bg-amber-500/20 border-amber-500 text-amber-200 animate-pulse'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-[10px] text-slate-500 font-bold">
                  {activeBank}-{idx.toString(16).toUpperCase().padStart(2, '0')}
                </span>
                {isPlaying && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <div className="my-2">
                <div className="font-bold text-sm tracking-tight">
                  PAT {idx.toString(16).toUpperCase().padStart(2, '0')}
                </div>
                <div className="text-[9px] text-slate-400">16 Steps</div>
              </div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">
                {isPlaying ? 'Playing' : isQueued ? 'Queued' : 'Ready'}
              </div>
            </button>
          );
        })}
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
        <div>[CLICK]: Quantized Queue / Trigger Pattern | [BANK A-D]: Switch Banks</div>
      </div>
    </div>
  );
};