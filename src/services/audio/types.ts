export type TrackKey = string;
export type SidechainPresetName = 'soft' | 'medium' | 'hard';
export type TrackEffectType = 'bitcrush' | 'phaser' | 'looper';

export interface EffectMixState {
  wet: number;
  dry: number;
  enabled: boolean;
}

export interface TrackEffectState {
  bitcrush: EffectMixState;
  phaser: EffectMixState;
  looper: EffectMixState;
}

export interface TrackGraphState {
  id: string;
  gain: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  effects: TrackEffectState;
}

export interface PlayMode = 'oneShot' | 'gate';
export type ChokeGroup = 0 | 1 | 2 | 3 | 4;

export interface PadConfig {
  padIndex: number;
  playMode: PlayMode;
  chokeGroup: ChokeGroup;
  sampleId?: string;
  gain: number;
  pitchSemiTones: number;
}

export interface ActiveVoice {
  id: string;
  padIndex: number;
  pointerId?: number;
  chokeGroup: ChokeGroup;
  sourceNode: AudioBufferSourceNode;
  gainNode: GainNode;
  startTime: number;
}

export interface EngineTrackState {
  id: string;
  name: string;
  volume: number;
  pan: number;
  isMuted: boolean;
  isSoloed: boolean;
}

export interface AudioBufferMetadata {
  id: string;
  name: string;
  duration: number;
  sampleRate: number;
  channels: number;
}

export interface TransportSnapshot {
  isPlaying: boolean;
  bpm: number;
  currentStep: number;
}

export interface PatternStep {
  stepIndex: number;
  active: boolean;
  velocity: number;
}

export interface PatternState {
  id: string;
  length: number;
  steps: PatternStep[];
}

export interface MasterEffectState {
  reverbMix: number;
  delayMix: number;
  masterFilterCutoff: number;
}

export interface SidechainPresetConfig {
  thresholdDb: number;
  kneeDb: number;
  ratio: number;
  attackMs: number;
  releaseMs: number;
}

export interface MasterEQBandState {
  type: BiquadFilterType;
  frequency: number;
  Q: number;
  gain: number;
}

export interface MasterEQState {
  bands: MasterEQBandState[];
  filterFlipEnabled: boolean;
}
