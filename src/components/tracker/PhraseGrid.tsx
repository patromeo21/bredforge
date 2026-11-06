// ============================================================================
// STAGE E - PHASE 28: 16-STEP HEXADECIMAL STRUCTURAL DISPLAY GRID (PhraseGrid.tsx)
// ============================================================================

import React from 'react';
import { PhraseBlock, TrackerState } from '../../services/tracker/TrackerState';

export interface PhraseGridProps extends React.HTMLAttributes<HTMLDivElement> {
  phrase?: PhraseBlock;
  activeRowIndex?: number;
  selectedRowIndex?: number;
  onSelectRow?: (rowIndex: number) => void;
  [key: string]: any;
}

export const PhraseGrid: React.FC<PhraseGridProps> = ({
  phrase,
  activeRowIndex = -1,
  selectedRowIndex = 0,
  onSelectRow,
  ...restProps
}) => {
  // Ensure we always have exactly 16 steps to display
  const steps: PhraseBlock = phrase && phrase.length === 16 
    ? phrase 
    : Array.from({ length: 16 }, (_, i) => ({
        step: i + 1,
        padId: null,
        vol: 1.0,
        fxType: 'bypass',
        fxParam: null,
      }));

  return (
    <div
      {...restProps}
      className="flex flex-col w-full font-mono text-xs select-none gap-1 overflow-y-auto pr-1"
    >
      {/* Column Headers */}
      <div className="grid grid-cols-6 gap-2 px-3 py-2 bg-zinc-900 border-b border-emerald-500/30 font-bold text-emerald-400">
        <div className="text-center">STEP</div>
        <div className="text-center">NOTE</div>
        <div className="text-center">PAD HEX</div>
        <div className="text-center">VOL</div>
        <div className="text-center">FX TYPE</div>
        <div className="text-center">FX PARAM</div>
      </div>

      {/* 16 Structural Step Rows */}
      {steps.map((stepItem, idx) => {
        const isPlayhead = activeRowIndex === idx;
        const isSelected = selectedRowIndex === idx;
        const isBeatInterval = idx % 4 === 0;

        // Convert padId to 2-character uppercase Hex string or '---'
        const hexPadId = stepItem.padId !== null && stepItem.padId >= 0 && stepItem.padId <= 63
          ? stepItem.padId.toString(16).toUpperCase().padStart(2, '0')
          : '--';

        const noteName = TrackerState.getNoteNameFromPadId(stepItem.padId);

        let rowStyle = 'bg-transparent text-emerald-500';
        if (isPlayhead) {
          rowStyle = 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_#10b981]';
        } else if (isSelected) {
          rowStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50';
        } else if (isBeatInterval) {
          rowStyle = 'bg-zinc-900/60 text-emerald-500/90';
        }

        return (
          <div
            key={stepItem.step || idx}
            onClick={() => onSelectRow && onSelectRow(idx)}
            className={`grid grid-cols-6 gap-2 px-3 py-2 rounded items-center transition-colors cursor-pointer ${rowStyle}`}
          >
            {/* Step Number (Hex 00-0F) */}
            <div className="text-center font-bold tracking-wider">
              {isPlayhead ? '▶ ' : ''}{idx.toString(16).toUpperCase().padStart(2, '0')}
            </div>

            {/* Note Name */}
            <div className="text-center tracking-wider font-semibold">
              {noteName}
            </div>

            {/* Pad Hex ID */}
            <div className="text-center tracking-widest font-mono">
              {hexPadId}
            </div>

            {/* Volume */}
            <div className="text-center">
              {stepItem.vol.toFixed(1)}
            </div>

            {/* FX Type */}
            <div className="text-center uppercase text-[10px] tracking-tight">
              {stepItem.fxType}
            </div>

            {/* FX Param */}
            <div className="text-center">
              {stepItem.fxParam !== null ? stepItem.fxParam.toFixed(2) : '--'}
            </div>
          </div>
        );
      })}
    </div>
  );
};