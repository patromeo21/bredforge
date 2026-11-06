// ============================================================================
// STAGE E - PHASE 31 REPAIR: HYPER-CLEAN IMMUTABLE ENTRY MATRIX (GridController.tsx)
// ============================================================================

import React from 'react';
import { ProjectStateSchema, TrackerStep } from '../../services/tracker/TrackerState';

export type TrackerColumn = 'NOTE' | 'VOL' | 'FX1' | 'FX2';

export interface GridSelectionState {
  rowIndex: number;
  columnIndex: TrackerColumn;
}

/**
 * Immutable grid cell editor function supporting step-entry programming.
 * Uses explicit conditional assignments to prevent syntax leakage and deep-clones state.
 */
export function handleGridCellEdit(
  currentState: ProjectStateSchema,
  selection: GridSelectionState,
  incomingValue: any,
  activePhraseId: string
): ProjectStateSchema {
  const targetPhraseKey = activePhraseId || currentState.activePhrase || '01';
  const currentPhrase = currentState.phrases[targetPhraseKey] || Array.from({ length: 16 }, (_, i) => ({
    step: i + 1,
    padId: null,
    vol: 1.0,
    fxType: 'bypass',
    fxParam: null,
  }));

  const targetRowIndex = Math.max(0, Math.min(15, selection.rowIndex));

  // Deep-clone the phrase block array and target step object
  const updatedPhrase: TrackerStep[] = currentPhrase.map((stepItem, idx) => {
    if (idx === targetRowIndex) {
      const clonedStep = { ...stepItem };
      
      if (selection.columnIndex === 'NOTE') {
        clonedStep.padId = incomingValue;
      } else if (selection.columnIndex === 'VOL') {
        clonedStep.vol = typeof incomingValue === 'number' ? Math.max(0.0, Math.min(1.0, incomingValue)) : 1.0;
      } else if (selection.columnIndex === 'FX1') {
        clonedStep.fxType = typeof incomingValue === 'string' ? incomingValue : 'bypass';
      } else if (selection.columnIndex === 'FX2') {
        clonedStep.fxParam = typeof incomingValue === 'number' ? incomingValue : null;
      }

      return clonedStep;
    }
    return { ...stepItem };
  });

  const updatedState: ProjectStateSchema = {
    ...currentState,
    phrases: {
      ...currentState.phrases,
      [targetPhraseKey]: updatedPhrase,
    },
    timestamp: Date.now(),
  };

  return updatedState;
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