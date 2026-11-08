// ============================================================================
// BREDFORGE v1.0 — DUAL-SCREEN WORKSPACE & M8 FLIP MATRIX [REF: M61]
// ============================================================================

import React, { useState } from 'react';
import { trackerEngine, PatternState, ParameterLock } from '../../services/tracker/TrackerEngine';
import { ParameterLockModal } from './ParameterLockModal';

type PadMode = 'performance' | 'm8_dirtywave';
type BankKey = 'A' | 'B' | 'C' | 'D';

export function DualScreenWorkspace() {
  const [pattern, setPattern] = useState<PatternState>(() => trackerEngine.generateDefaultPattern());
  const [swingPercent, setSwingPercent] = useState<number>(54); // Default swing telemetry
  const [activeModalStep, setActiveModalStep] = useState<{ row: number; col: number; lock?: ParameterLock } | null>(null);

  // Right-side 4x4 Pad States
  const [padMode, setPadMode] = useState<PadMode>('performance');
  const [activeBank, setActiveBank] = useState<BankKey>('A');
  const [isSampleEditorOpen, setIsSampleEditorOpen] = useState<boolean>(false);
  const [activePadState, setActivePadState] = useState<string | null>(null);

  const handleSaveLock = (newLock: ParameterLock) => {
    if (!activeModalStep) return;
    const { row, col } = activeModalStep;
    trackerEngine.setParameterLock(pattern, row, col, newLock);
    setPattern({
      ...pattern,
      rows: pattern.rows.map((r, rIdx) => {
        if (rIdx !== row) return r;
        return {
          ...r,
          columns: r.columns.map((c, cIdx) => (cIdx !== col ? c : { ...c, paramLock: newLock })),
        };
      }),
    });
    setActiveModalStep(null);
  };

  const triggerPad = (padIndex: number) => {
    const label = padMode === 'performance' 
      ? `Bank ${activeBank} - Pad ${padIndex + 1}` 
      : `M8 FX / Dirtywave [${padIndex + 1}]`;
    setActivePadState(label);
    setTimeout(() => setActivePadState(null), 350);
  };

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row gap-2 bg-zinc-950 p-2 font-mono select-none overflow-hidden">
      
      {/* ================================================================== */}
      {/* LEFT SIDE: INDEPENDENT TRACKER VIEW & SWING TELEMETRY HEADER      */}
      {/* ================================================================== */}
      <div className="flex-1 flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 relative overflow-hidden">
        
        {/* Tracker Header with Swing Telemetry */}
        <div className="flex justify-between items-center pb-2 mb-2 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded border border-amber-500/40">
              [M61]
            </span>
            <span className="font-bold tracking-wider text-xs text-zinc-200">
              TRACKER // STEP GRID
            </span>
          </div>

          {/* Swing Telemetry Teleprinter */}
          <div className="flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
            <span className="text-[10px] text-zinc-400">SWING:</span>
            <input
              type="range"
              min="50"
              max="75"
              value={swingPercent}
              onChange={(e) => setSwingPercent(Number(e.target.value))}
              className="w-16 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-amber-400 text-[10px] font-bold w-7 text-right">{swingPercent}%</span>
          </div>
        </div>

        {/* Scrollable Step Rows */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {pattern.rows.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center gap-2 bg-zinc-900/60 p-1.5 rounded border border-zinc-800/60">
              <span className="text-[10px] text-zinc-500 w-6 text-right font-mono">
                {(rIdx + 1).toString().padStart(2, '0')}
              </span>

              <div className="grid grid-cols-1 flex-1">
                {row.columns.map((col, cIdx) => {
                  const hasLock = col.paramLock && Object.keys(col.paramLock).length > 0;
                  return (
                    <div key={cIdx} className="flex items-center justify-between bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-500 w-8">
                          {col.note || '----'}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          INS: {col.instrumentID ?? '--'}
                        </span>
                        {hasLock && (
                          <span className="px-1 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] rounded border border-amber-500/30">
                            P-LOCK
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveModalStep({ row: rIdx, col: cIdx, lock: col.paramLock })}
                        className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded border border-zinc-700 transition-colors"
                      >
                        EDIT P-LOCK
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* RIGHT SIDE: 4X4 PERFORMANCE MATRIX & M8 DIRTYWAVE FLIP TOGGLE     */}
      {/* ================================================================== */}
      <div className="w-full md:w-[380px] flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 relative shrink-0">
        
        {/* Right Panel Header & Mode Flip Switch */}
        <div className="flex justify-between items-center pb-2 mb-2 border-b border-zinc-800 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-500 font-bold">
              {padMode === 'performance' ? `SP-404 / MPC [BANK ${activeBank}]` : 'M8 DIRTYWAVE & FX'}
            </span>
            <span className="text-xs text-zinc-200 font-bold">
              {activePadState || 'READY FOR TRIGGER'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSampleEditorOpen(!isSampleEditorOpen)}
              className={`px-2 py-1 text-[9px] font-bold rounded border transition-colors ${
                isSampleEditorOpen ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
              title="Toggle Sample Chopper / Editor Floating Window"
            >
              {isSampleEditorOpen ? 'HIDE EDIT' : 'SAMPLE EDIT'}
            </button>
            <button
              onClick={() => setPadMode(padMode === 'performance' ? 'm8_dirtywave' : 'performance')}
              className="px-2.5 py-1 bg-amber-500 text-zinc-950 text-[10px] font-bold rounded border border-amber-400 shadow-sm hover:bg-amber-400 transition-colors"
            >
              {padMode === 'performance' ? 'FLIP ➔ M8' : 'FLIP ➔ SP404'}
            </button>
          </div>
        </div>

        {/* Bank Selectors (Active only in SP-404/MPC Performance Mode) */}
        {padMode === 'performance' && (
          <div className="grid grid-cols-4 gap-1 mb-2 shrink-0">
            {(['A', 'B', 'C', 'D'] as BankKey[]).map((bank) => (
              <button
                key={bank}
                onClick={() => setActiveBank(bank)}
                className={`py-1 text-[10px] font-bold rounded border transition-colors ${
                  activeBank === bank
                    ? 'bg-amber-500 text-zinc-950 border-amber-400'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                BANK {bank}
              </button>
            ))}
          </div>
        )}

        {/* 4x4 Pad Grid Container */}
        <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-2 relative">
          {Array.from({ length: 16 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => triggerPad(idx)}
              className={`flex flex-col items-center justify-center rounded-lg border transition-all active:scale-95 ${
                padMode === 'performance'
                  ? 'bg-zinc-900 border-zinc-800 hover:border-amber-500/60 text-zinc-300'
                  : 'bg-zinc-950 border-amber-500/30 hover:border-amber-400 text-amber-400 shadow-[inset_0_0_8px_rgba(245,158,11,0.05)]'
              }`}
            >
              <span className="text-xs font-bold">{idx + 1}</span>
              <span className="text-[9px] text-zinc-500">
                {padMode === 'performance' ? `${activeBank}${idx + 1}` : `FX ${idx + 1}`}
              </span>
            </button>
          ))}

          {/* Floating Sample Edit Window Overlay (Toggable to clear screen space) */}
          {isSampleEditorOpen && (
            <div className="absolute inset-2 bg-zinc-950/95 border border-amber-500/50 rounded-lg p-3 flex flex-col justify-between shadow-2xl backdrop-blur-md z-20">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                <span className="text-[10px] text-amber-400 font-bold">SAMPLE CHOPER // M8 STYLE</span>
                <button
                  onClick={() => setIsSampleEditorOpen(false)}
                  className="w-5 h-5 flex items-center justify-center bg-zinc-900 text-zinc-400 rounded text-xs hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-2">
                <div className="w-full h-12 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">
                  [ WAVEFORM SLICE REGION A-D ]
                </div>
                <span className="text-[10px] text-zinc-400 text-center">
                  Slice transients, adjust start/end points, and assign directly to 4x4 pads.
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setIsSampleEditorOpen(false)}
                  className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded border border-zinc-700"
                >
                  CLOSE
                </button>
                <button
                  onClick={() => {
                    alert('Sample sliced and assigned to active pad!');
                    setIsSampleEditorOpen(false);
                  }}
                  className="py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-bold rounded border border-amber-400"
                >
                  ASSIGN SLICE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Parameter Lock Modal HUD Overlay */}
      {activeModalStep && (
        <ParameterLockModal
          isOpen={true}
          rowIndex={activeModalStep.row}
          colIndex={activeModalStep.col}
          currentLock={activeModalStep.lock}
          onSave={handleSaveLock}
          onClose={() => setActiveModalStep(null)}
        />
      )}

    </div>
  );
}

export default DualScreenWorkspace;