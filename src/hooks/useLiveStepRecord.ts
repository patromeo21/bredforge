// ============================================================================
// BREDFORGE v1.0 — LIVE STEP RECORDING HOOK (useLiveStepRecord.ts)
// ============================================================================

import { useState, useCallback } from 'react';
import { TrackerStep, SequencerEngine } from '../services/audio/SequencerEngine';

export function useLiveStepRecord(
  sequencer: SequencerEngine | null,
  steps: TrackerStep[],
  setSteps: React.Dispatch<React.SetStateAction<TrackerStep[]>>
) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeInstrument, setActiveInstrument] = useState<number>(1);

  const recordPadHit = useCallback((note: string, velocity: number = 64) => {
    if (!isRecording || !sequencer) return;

    const status = sequencer.getStatus();
    if (!status.isPlaying) return;

    const currentRow = status.currentStep;

    setSteps(prevSteps => {
      const updated = [...prevSteps];
      if (updated[currentRow]) {
        updated[currentRow] = {
          ...updated[currentRow],
          stepIndex: currentRow,
          note: note,
          instrument: activeInstrument,
          volume: velocity,
        };
      }
      return updated;
    });

    console.log(`[LiveRecord] Recorded note ${note} to row ${currentRow.toString(16).toUpperCase()}`);
  }, [isRecording, sequencer, activeInstrument, setSteps]);

  return {
    isRecording,
    setIsRecording,
    activeInstrument,
    setActiveInstrument,
    recordPadHit,
  };
}