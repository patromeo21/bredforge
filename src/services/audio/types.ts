export type PlayMode = 'oneShot' | 'gate';
export type ChokeGroup = 0 | 1 | 2 | 3 | 4;

export type TrackKey = string; // e.g. "A1", "A2", "D16"

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