// ============================================================================
// BREDFORGE v1.0 — M8 INSTRUMENT ABSTRACTION LAYER & ENGINE ROUTER [REF: INS-01]
// ============================================================================

export type InstrumentEngineType = 'sampler' | 'wavsynth' | 'macrosynth' | 'fm' | 'hypersynth';

export interface BaseInstrumentConfig {
  id: number;           // 1 to 255 (M8 style)
  name: string;
  engineType: InstrumentEngineType;
  volume: number;       // 0 - 100
  pan: number;          // -50 to 50
  targetMixerChannel: number; // 1 to 8 (Routes to our 8-Channel Decoupled Mixer)
}

export interface SamplerInstrument extends BaseInstrumentConfig {
  engineType: 'sampler';
  sampleId: string;
  playbackMode: 'oneshot' | 'gate' | 'loop';
  startPoint: number;   // 0 - 100%
  endPoint: number;     // 0 - 100%
  attack: number;
  release: number;
}

export interface SynthInstrument extends BaseInstrumentConfig {
  engineType: 'wavsynth' | 'macrosynth' | 'fm' | 'hypersynth';
  algorithm: number;    // Engine-specific algorithm/model index
  waveShape: string;    // e.g., 'sine', 'saw', 'square', 'custom-wavetable'
  cutoff: number;       // Filter cutoff Hz
  resonance: number;    // Filter Q
  envAttack: number;
  envDecay: number;
  envSustain: number;
  envRelease: number;
}

export type M8Instrument = SamplerInstrument | SynthInstrument;

export class InstrumentManager {
  private instruments: Map<number, M8Instrument> = new Map();

  constructor() {
    this.initializeDefaultInstruments();
  }

  private initializeDefaultInstruments() {
    // Default Instrument 1: Kick Sampler -> Routes to Mixer Channel 1
    this.instruments.set(1, {
      id: 1,
      name: 'DEFAULT KICK',
      engineType: 'sampler',
      volume: 90,
      pan: 0,
      targetMixerChannel: 1,
      sampleId: 'sample-kick-01',
      playbackMode: 'oneshot',
      startPoint: 0,
      endPoint: 100,
      attack: 0.005,
      release: 0.2,
    });

    // Default Instrument 2: FM Bass Synth -> Routes to Mixer Channel 5
    this.instruments.set(2, {
      id: 2,
      name: 'SUB FM BASS',
      engineType: 'fm',
      volume: 85,
      pan: 0,
      targetMixerChannel: 5,
      algorithm: 1,
      waveShape: 'sine',
      cutoff: 1200,
      resonance: 4,
      envAttack: 0.01,
      envDecay: 0.3,
      envSustain: 0.5,
      envRelease: 0.1,
    });
  }

  public getInstrument(id: number): M8Instrument | undefined {
    return this.instruments.get(id);
  }

  public setInstrument(instrument: M8Instrument): void {
    this.instruments.set(instrument.id, instrument);
  }

  public getAllInstruments(): M8Instrument[] {
    return Array.from(this.instruments.values());
  }

  public routeToMixer(instrumentId: number): number {
    const inst = this.instruments.get(instrumentId);
    return inst ? inst.targetMixerChannel : 1; // Fallback to Channel 1
  }
}

// Singleton export for global tracker & audio graph bindings
export const globalInstrumentManager = new InstrumentManager();