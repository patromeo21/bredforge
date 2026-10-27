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
