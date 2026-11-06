// ============================================================================
// STAGE E - PHASE 31: LIVE STEP-INPUT EDITOR & SELECTION MATRIX (GridController.tsx)
// ============================================================================

import React from 'react';
import { ProjectStateSchema, SPFxType } from '../../services/tracker/TrackerState';

export type TrackerColumn = 'NOTE' | 'VOL' | 'FX1' | 'FX2';

export interface GridSelectionState {
  rowIndex: number;
  columnIndex: TrackerColumn;
}

/**
 * Immutable grid cell editor function supporting step-entry programming.
 * Automatically increments rowIndex by 1 if autoAdvance is true.
 */
export function handleGridCellEdit(
  currentState: ProjectStateSchema,
  selection: GridSelectionState,
  incomingValue: any,
  autoAdvance: boolean = true
): { updatedState: ProjectStateSchema; nextSelection: GridSelectionState } {
  const activePhraseKey = currentState.activePhrase || '01';
  const currentPhrase = currentState.phrases[activePhraseKey] || Array.from({ length: 16 }, (_, i) => ({
    step: i + 1,
    padId: null,
    vol: 1.0,
    fxType: 'bypass',
    fxParam: null,
  }));

  const targetRowIndex = Math.max(0, Math.min(15, selection.rowIndex));

  const updatedPhrase = currentPhrase.map((stepItem, idx) => {
    if (idx === targetRowIndex) {
      const updatedStep = { ...stepItem };
      switch (selection.columnIndex) {
        if (selection.columnIndex === 'NOTE') {
          updatedStep.padId = incomingValue;
        } else if (selection.columnIndex === 'VOL') {
          updatedStep.vol = typeof incomingValue === 'number' ? Math.max(0.0, Math.min(1.0, incomingValue)) : 1.0;
        } else if (selection.columnIndex === 'FX1') {
          updatedStep.fxType = typeof incomingValue === 'string' ? incomingValue : 'bypass';
        } else if (selection.columnIndex === 'FX2') {
          updatedStep.fxParam = typeof incomingValue === 'number' ? incomingValue : null;
        }
      }
      return updatedStep;
    }
    return stepItem;
  });

  const updatedState: ProjectStateSchema = {
    ...currentState,
    phrases: {
      ...currentState.phrases,
      [activePhraseKey]: updatedPhrase,
    },
    timestamp: Date.now(),
  };

  const nextRowIndex = autoAdvance ? (targetRowIndex + 1) % 16 : targetRowIndex;
  const nextSelection: GridSelectionState = {
    rowIndex: nextRowIndex,
    columnIndex: selection.columnIndex,
  };

  return { updatedState, nextSelection };
}

export interface GridControllerProps extends React.HTMLAttributes<HTMLDivElement> {
  selection: GridSelectionState;
  onSelectionChange?: (newSelection: GridSelectionState) => void;
  [key: string]: any;
}

export const GridController: React.FC<GridControllerProps> = ({
  selection,
  onSelectionChange,
  ...restProps
}) => {
  return (
    <div
      {...restProps}
      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-emerald-500/30 rounded font-mono text-xs text-emerald-400 select-none shadow-[0_0_10px_rgba(16,185,129,0.1)]"
    >
      <span className="text-emerald-600 font-bold uppercase tracking-wider">CURSOR:</span>
      <span className="font-extrabold text-emerald-300">
        ROW [{selection.rowIndex.toString(16).toUpperCase().padStart(2, '0')}]
      </span>
      <span className="text-emerald-600">/</span>
      <span className="font-extrabold text-emerald-300 tracking-widest">
        COL [{selection.columnIndex}]
      </span>
    </div>
  );
};