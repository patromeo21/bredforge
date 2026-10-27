export type TrackKey = 'vocals' | 'drums' | 'bass' | 'other';

export interface EngineTrackState {
  key: TrackKey;
  enabled: boolean;
  gain: number;
  pan: number;
  mute: boolean;
  solo: boolean;
}

export interface AudioBufferMetadata {
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  fileName?: string;
}

export interface TransportSnapshot {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export interface PatternStep {
  index: number;
  note: string | null;
  sampleId: string | null;
  velocity: number;
}

export interface PatternState {
  id: string;
  name: string;
  length: number;
  steps: PatternStep[];
}

export interface MasterEffectState {
  drive: number;
  cutoff: number;
  resonance: number;
  limiter: number;
}';
