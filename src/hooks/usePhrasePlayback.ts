import { useState, useEffect, useRef } from 'react';
import { PhraseAudioScheduler, PhraseStepData } from '../services/audio/PhraseAudioScheduler';

export const usePhrasePlayback = (
  steps: PhraseStepData[],
  sampleBuffer: AudioBuffer | null,
  audioContext: AudioContext | null,
  masterDestination: AudioNode | null
) => {
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

        // Trigger sample buffer audio when playhead hits active step note
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