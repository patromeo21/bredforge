// ============================================================================
// BREDFORGE v1.0 — MULTI-ENGINE SYNTH PROCESSOR (WAVSYNTH, FM, MACRO, HYPER) [REF: SYNTH-CORE-01]
// ============================================================================

import { SynthInstrument } from './InstrumentManager';

export class SynthEngineProcessor {
  /**
   * Generates or processes audio parameters based on the active synth engine type.
   * Designed to interface cleanly with Web Audio nodes and AudioWorklets.
   */
  public static createSynthNode(
    audioCtx: AudioContext,
    instrument: SynthInstrument,
    frequency: number
  ): { inputNode: AudioNode; outputNode: AudioNode; triggerRelease: () => void } {
    
    // Create master gain for the synth voice with standard ADSR envelope
    const voiceGain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    // Apply envelope attack & decay
    const attack = instrument.envAttack || 0.01;
    const decay = instrument.envDecay || 0.2;
    const sustain = instrument.envSustain ?? 0.5;
    const release = instrument.envRelease || 0.1;

    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(0.8, now + attack);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), now + attack + decay);

    let sourceNode: OscillatorNode | AudioNode;

    switch (instrument.engineType) {
      case 'fm': {
        // 2-Operator Phase Modulation (FM) Prototype
        const carrier = audioCtx.createOscillator();
        const modulator = audioCtx.createOscillator();
        const modGain = audioCtx.createGain();

        carrier.type = (instrument.waveShape as OscillatorType) || 'sine';
        modulator.type = 'sine';

        // Set frequencies based on algorithm ratios
        carrier.frequency.setValueAtTime(frequency, now);
        modulator.frequency.setValueAtTime(frequency * 2, now); // 2:1 ratio default
        modGain.gain.setValueAtTime(instrument.algorithm * 100, now); // Depth modulation

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        carrier.connect(voiceGain);
        carrier.start(now);
        modulator.start(now);

        sourceNode = carrier;
        break;
      }

      case 'wavsynth':
      case 'macrosynth':
      case 'hypersynth':
      default: {
        // Standard high-performance Wavetable / Supersaw emulation node
        const osc = audioCtx.createOscillator();
        osc.type = instrument.engineType === 'hypersynth' ? 'sawtooth' : ((instrument.waveShape as OscillatorType) || 'sawtooth');
        osc.frequency.setValueAtTime(frequency, now);

        osc.connect(voiceGain);
        osc.start(now);
        sourceNode = osc;
        break;
      }
    }

    // Optional Filter Stage
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(instrument.cutoff || 2000, now);
    filter.Q.setValueAtTime(instrument.resonance || 1, now);

    voiceGain.connect(filter);

    const triggerRelease = () => {
      const releaseTime = audioCtx.currentTime;
      voiceGain.gain.cancelScheduledValues(releaseTime);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, releaseTime);
      voiceGain.gain.linearRampToValueAtTime(0.0001, releaseTime + release);

      // Stop sources after release window
      setTimeout(() => {
        try {
          if ('stop' in sourceNode && typeof (sourceNode as OscillatorNode).stop === 'function') {
            (sourceNode as OscillatorNode).stop();
          }
        } catch {
          // Ignore if already stopped
        }
      }, release * 1000 + 50);
    };

    return {
      inputNode: sourceNode,
      outputNode: filter, // Routes directly into our Mixer bus
      triggerRelease,
    };
  }
}