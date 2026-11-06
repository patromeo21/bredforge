// ============================================================================
// BREDFORGE v1.0 — SEQUENCER CURSOR HOOK (useSequencerCursor.ts)
// ============================================================================

import { useState, useEffect } from 'react';
import { SequencerEngine } from '../services/audio/SequencerEngine';

export function useSequencerCursor(sequencer: SequencerEngine | null): number {
  const [activeRow, setActiveRow] = useState<number>(0);

  useEffect(() => {
    if (!sequencer) return;

    // Subscribe to real-time step ticks from the engine with explicit parameter typing
    const unsubscribe = sequencer.subscribeCursor((step: number) => {
      setActiveRow(step);
    });

    return () => {
      unsubscribe();
    };
  }, [sequencer]);

  return activeRow;
}