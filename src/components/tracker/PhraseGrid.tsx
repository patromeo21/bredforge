// ============================================================================
// BREDFORGE v1.0 — HIGH-CONTRAST PHRASE GRID (PhraseGrid.tsx)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { SequencerEngine, TrackerStep } from '../../services/audio/SequencerEngine';

interface PhraseGridProps {
  sequencer: SequencerEngine | null;
  steps: TrackerStep[];
  activeRowIndex?: number; // Optional prop override from parent layout
  onStepSelect?: (stepIndex: number) => void;
}

export const PhraseGrid: React.FC<PhraseGridProps> = ({
  sequencer,
  steps,
  activeRowIndex,
  onStepSelect
}) => {
  const [internalActiveRow, setInternalActiveRow] = useState<number>(0);
  const [selectedRow, setSelectedRow] = useState<number>(0);

  // Subscribe to real-time audio clock cursor if parent didn't supply activeRowIndex
  useEffect(() => {
    if (!sequencer || activeRowIndex !== undefined) return;

    const unsubscribe = sequencer.subscribeCursor((stepIndex: number) => {
      setInternalActiveRow(stepIndex);
    });

    return () => {
      unsubscribe();
    };
  }, [sequencer, activeRowIndex]);

  const activePlaybackRow = activeRowIndex !== undefined ? activeRowIndex : internalActiveRow;

  const handleRowClick = (index: number) => {
    setSelectedRow(index);
    if (onStepSelect) {
      onStepSelect(index);
    }
  };

  return (
    <div className="w-full h-full bg-black text-white font-mono text-xs select-none overflow-y-auto border border-neutral-800">
      {/* Tracker Column Headers */}
      <div className="sticky top-0 bg-neutral-900 border-b border-neutral-700 grid grid-cols-12 px-2 py-1 text-neutral-400 font-bold uppercase tracking-wider">
        <span className="col-span-2">ROW</span>
        <span className="col-span-2">NOTE</span>
        <span className="col-span-2">INST</span>
        <span className="col-span-2">VOL</span>
        <span className="col-span-2">FX1</span>
        <span className="col-span-2">FX2</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-neutral-900">
        {steps.map((step, index) => {
          const isPlaying = index === activePlaybackRow;
          const isSelected = index === selectedRow;

          // High-contrast Dirtywave pixel styling rules
          let rowBg = 'bg-black text-neutral-300';
          if (isPlaying) {
            rowBg = 'bg-white text-black font-bold'; // Highlight playhead
          } else if (isSelected) {
            rowBg = 'bg-neutral-800 text-yellow-400 font-semibold'; // Editing cursor
          }

          const hexRow = index.toString(16).toUpperCase().padStart(2, '0');
          const instStr = step.instrument > 0 
            ? step.instrument.toString(16).toUpperCase().padStart(2, '0') 
            : '--';
          const volStr = step.volume > 0 
            ? step.volume.toString(16).toUpperCase().padStart(2, '0') 
            : '--';

          return (
            <div
              key={index}
              onClick={() => handleRowClick(index)}
              className={`grid grid-cols-12 px-2 py-0.5 cursor-pointer transition-colors ${rowBg}`}
            >
              <span className="col-span-2 opacity-60">{hexRow}</span>
              <span className="col-span-2 tracking-tight">{step.note || '---'}</span>
              <span className="col-span-2">{instStr}</span>
              <span className="col-span-2">{volStr}</span>
              <span className="col-span-2 opacity-90">{step.fx1 || '---'}</span>
              <span className="col-span-2 opacity-90">{step.fx2 || '---'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};