// ============================================================================
// BREDFORGE v1.0 — SEQUENCER CURSOR HOOK (useSequencerCursor.ts)
// ============================================================================

import { useState, useEffect } from 'react';
import { SequencerEngine } from '../services/audio/SequencerEngine';

export function useSequencerCursor(sequencer: SequencerEngine | null) {
  const [activeRow, setActiveRow] = useState<number>(0);

  useEffect(() => {
    if (!sequencer) return;

    // Subscribe to real-time step ticks from the engine
    const unsubscribe = sequencer.subscribeCursor((step) => {
      setActiveRow(step);
    });

    return () => {
      unsubscribe();
    };
  }, [sequencer]);

  return activeRow;
}