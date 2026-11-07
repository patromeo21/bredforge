// ============================================================================
// BREDFORGE v1.0 — TRACKER PHRASE GRID WITH PLAYHEAD (PhraseGrid.tsx)
// ============================================================================

import React, { useState } from 'react';
import { usePhrasePlayback } from '../../hooks/usePhrasePlayback';

interface PhraseStep {
  step: number;
  note: string;
  velocity: string;
  instrument: string;
  fx1: string;
  fx2: string;
}

export const PhraseGrid: React.FC = () => {
  const [cursorRow, setCursorRow] = useState<number>(0);
  const [cursorCol, setCursorCol] = useState<number>(0);
  
  // Hook into SequencerAudioBridge clock via custom playback hook
  const { activeStep } = usePhrasePlayback();

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
            PHRASE GRID // CLOCK-SYNCED
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            16-Step Monospace Command Columns Linked to SequencerAudioBridge
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold">
            PLAYHEAD: STEP {activeStep.toString(16).toUpperCase().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Tracker Grid Table */}
      <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-900/40 p-2">
        <div className="grid grid-cols-6 gap-2 border-b border-slate-800 pb-2 text-[10px] text-slate-500 font-bold text-center">
          {columns.map((col, idx) => (
            <div key={col} className={cursorCol === idx ? 'text-emerald-400 underline' : ''}>
              {col}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1 mt-2">
          {steps.map((s, rowIdx) => {
            const isCursorRow = cursorRow === rowIdx;
            const isPlayheadRow = activeStep === rowIdx;

            return (
              <div
                key={s.step}
                onClick={() => setCursorRow(rowIdx)}
                className={`grid grid-cols-6 gap-2 items-center text-center py-1 rounded cursor-pointer transition-colors ${
                  isCursorRow
                    ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-bold'
                    : isPlayheadRow
                    ? 'bg-cyan-500/10 border border-cyan-500/50 text-cyan-200'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className={`font-bold ${isPlayheadRow ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {isPlayheadRow ? '▶ ' : ''}{rowIdx.toString(16).toUpperCase().padStart(2, '0')}
                </div>
                <div>{s.note}</div>
                <div>{s.velocity}</div>
                <div>{s.instrument}</div>
                <div>{s.fx1}</div>
                <div>{s.fx2}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-800">
        Cyan row indicates active audio playhead tick from SequencerAudioBridge.
      </div>
    </div>
  );
};