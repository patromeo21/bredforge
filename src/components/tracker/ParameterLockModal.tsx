// ============================================================================
// BREDFORGE v1.0 — STEP PARAMETER LOCK MODAL [REF: M55]
// ============================================================================

import React, { useState } from 'react';
import { ParameterLock } from '../../services/tracker/TrackerEngine';

interface ParameterLockModalProps {
  isOpen: boolean;
  rowIndex: number;
  colIndex: number;
  currentLock?: ParameterLock;
  onSave: (lock: ParameterLock) => void;
  onClose: () => void;
}

export function ParameterLockModal({
  isOpen,
  rowIndex,
  colIndex,
  currentLock,
  onSave,
  onClose,
}: ParameterLockModalProps) {
  const [pitchOffset, setPitchOffset] = useState<number>(currentLock?.pitchOffset ?? 0);
  const [filterCutoff, setFilterCutoff] = useState<number>(currentLock?.filterCutoff ?? 10000);
  const [saturationAmount, setSaturationAmount] = useState<number>(currentLock?.saturationAmount ?? 0);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      pitchOffset,
      filterCutoff,
      saturationAmount,
    });
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-2xl flex flex-col gap-4">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
          <div>
            <span className="text-[10px] text-amber-500 font-bold block">AUTOMATION P-LOCK</span>
            <span className="text-xs text-zinc-200 font-bold">
              ROW {rowIndex + 1} // TRACK {colIndex + 1}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Controls Container */}
        <div className="flex flex-col gap-3 py-1">
          
          {/* Pitch Offset Control */}
          <div className="flex flex-col gap-1 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/60">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-400">PITCH OFFSET (SEMITONES)</span>
              <span className="text-amber-400 font-bold">{pitchOffset > 0 ? `+${pitchOffset}` : pitchOffset}</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={pitchOffset}
              onChange={(e) => setPitchOffset(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 touch-none"
            />
          </div>

          {/* Filter Cutoff Control */}
          <div className="flex flex-col gap-1 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/60">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-400">FILTER CUTOFF (HZ)</span>
              <span className="text-amber-400 font-bold">{filterCutoff} Hz</span>
            </div>
            <input
              type="range"
              min="100"
              max="20000"
              step="100"
              value={filterCutoff}
              onChange={(e) => setFilterCutoff(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 touch-none"
            />
          </div>

          {/* Saturation Send Control */}
          <div className="flex flex-col gap-1 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/60">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-400">SATURATION DRIVE</span>
              <span className="text-amber-400 font-bold">{saturationAmount}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={saturationAmount}
              onChange={(e) => setSaturationAmount(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 touch-none"
            />
          </div>

        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
          <button
            onClick={onClose}
            className="py-2 text-xs font-bold bg-zinc-900 text-zinc-400 rounded border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="py-2 text-xs font-bold bg-amber-500 text-zinc-950 rounded border border-amber-400 hover:bg-amber-400 transition-colors shadow-[0_0_12px_rgba(245,158,11,0.25)]"
          >
            APPLY P-LOCK
          </button>
        </div>

      </div>
    </div>
  );
}

export default ParameterLockModal;