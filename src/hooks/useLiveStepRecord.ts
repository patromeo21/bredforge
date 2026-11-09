// ============================================================================
// BREDFORGE v1.0 — LIVE PAD-TO-PHRASE STEP RECORDING HOOK [REF: LIVE-REC-01]
// ============================================================================

import { useState, useCallback } from 'react';
import { SliceMarker } from '../components/tracker/SampleWorkbench';

export interface PhraseStep {
  stepIndex: number;
  note: string;
  instrument: string;
  command: string;
  description: string;
}

interface UseLiveStepRecordProps {
  isArmed: boolean;
  isPlaying: boolean;
  currentStep: number;
  onUpdateStep: (stepIndex: number, stepData: PhraseStep) => void;
}

export function useLiveStepRecord({
  isArmed,
  isPlaying,
  currentStep,
  onUpdateStep,
}: UseLiveStepRecordProps) {
  const [recordedEventsCount, setRecordedEventsCount] = useState<number>(0);

  // Triggered when a pad or slice is hit during live playback
  const recordPadHit = useCallback(
    (padId: number, bank: string, slice?: SliceMarker) => {
      if (!isArmed || !isPlaying) return;

      const note = `C-${Math.floor((padId - 1) / 4) + 1}`;
      const instrument = '01';
      const sliceIndex = slice ? slice.id.replace(/[^0-9]/g, '').slice(-2) || '01' : '01';
      const command = `S${sliceIndex.padStart(2, '0')}`;
      const description = `Pad ${bank}${padId < 10 ? `0${padId}` : padId} (Slice ${sliceIndex})`;

      const stepData: PhraseStep = {
        stepIndex: currentStep,
        note,
        instrument,
        command,
        description,
      };

      // Write directly into the active tracker step row
      onUpdateStep(currentStep, stepData);
      setRecordedEventsCount((prev) => prev + 1);

      console.log(`[LiveStepRecord] Captured Step ${currentStep} -> Note: ${note}, Cmd: ${command}`);
    },
    [isArmed, isPlaying, currentStep, onUpdateStep]
  );

  return {
    recordedEventsCount,
    recordPadHit,
  };
}

export default useLiveStepRecord;
