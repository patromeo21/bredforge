// ============================================================================
// BREDFORGE v1.0 — PHRASE PLAYBACK SYNC HOOK (usePhrasePlayback.ts)
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { PhraseAudioScheduler, PhraseStepData } from '../services/audio/PhraseAudioScheduler';

interface UsePhrasePlaybackReturn {
  activeStep: number;
}

export const usePhrasePlayback = (
  steps: PhraseStepData[] = [],
  sampleBuffer: AudioBuffer | null = null,
  audioContext: AudioContext | null = null,
  masterDestination: AudioNode | null = null
): UsePhrasePlaybackReturn => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const schedulerRef = useRef<PhraseAudioScheduler | null>(null);

  useEffect(() => {
    if (audioContext) {
      schedulerRef.current = new PhraseAudioScheduler(audioContext);
    }
  }, [audioContext]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prevStep) => {
        const nextStep = (prevStep + 1) % 16;
        const stepData = steps[nextStep];

        if (schedulerRef.current && sampleBuffer && masterDestination && stepData) {
          schedulerRef.current.triggerStep(stepData, sampleBuffer, masterDestination);
        }

        return nextStep;
      });
    }, 125); // ~120 BPM 16th-note clock

    return () => clearInterval(interval);
  }, [steps, sampleBuffer, masterDestination]);

  return { activeStep };
};