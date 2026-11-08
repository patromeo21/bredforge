// ============================================================================
// BREDFORGE v1.0 — GRID CONTROLLER WITH P-LOCK MODAL [REF: M56]
// ============================================================================

import React, { useState } from 'react';
import { trackerEngine, PatternState, ParameterLock } from '../../services/tracker/TrackerEngine';
import { ParameterLockModal } from './ParameterLockModal';

export function GridController() {
  const [pattern, setPattern] = useState<PatternState>(() => trackerEngine.generateDefaultPattern());
  const [activeModalStep, setActiveModalStep] = useState<{ row: number; col: number; lock?: ParameterLock } | null>(null);

  const handleOpenModal = (row: number, col: number) => {
    const currentLock = pattern.rows[row]?.columns[col]?.paramLock;
    setActiveModalStep({ row, col, lock: currentLock });
  };

  const handleSaveLock = (newLock: ParameterLock) => {
    if (!activeModalStep) return;
    const { row, col } = activeModalStep;

    // Update in engine
    trackerEngine.setParameterLock(pattern, row, col, newLock);

    // Force React state update
    setPattern({
      ...pattern,
      rows: pattern.rows.map((r, rIdx) => {
        if (rIdx !== row) return r;
        return {
          ...r,
          columns: r.columns.map((c, cIdx) => {
            if (cIdx !== col) return c;
            return { ...c, paramLock: newLock };
          }),
        };
      }),
    });

    setActiveModalStep(null);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono select-none overflow-hidden relative">
      
      {/* Grid Controller Header */}
      <div className="flex justify-between items-center pb-2 mb-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded border border-amber-500/40">
            [M56]
          </span>
          <span className="font-bold tracking-wider text-xs text-zinc-200">
            TRACKER // STEP GRID & P-LOCKS
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">TAP STEP TO EDIT P-LOCK</span>
      </div>

      {/* Scrollable Step Rows Container */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {pattern.rows.map((row, rIdx) => (
          <div key={rIdx} className="flex items-center gap-2 bg-zinc-900/40 p-1.5 rounded border border-zinc-800/50">
            <span className="text-[10px] text-zinc-500 w-8 text-right font-mono">
              {(rIdx + 1).toString().padStart(2, '0')}
            </span>

            <div className="grid grid-cols-1 gap-2 flex-1">
              {row.columns.map((col, cIdx) => {
                const hasLock = col.paramLock && Object.keys(col.paramLock).length > 0;
                return (
                  <div key={cIdx} className="flex items-center justify-between bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-amber-500">
                        {col.note || '----'}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        INS: {col.instrumentID ?? '--'}
                      </span>
                      {hasLock && (
                        <span className="px-1 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] rounded border border-amber-500/30">
                          P-LOCK ACTIVE
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenModal(rIdx, cIdx)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded border border-zinc-700 transition-colors"
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

export default GridController;