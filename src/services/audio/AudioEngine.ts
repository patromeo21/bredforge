import { AudioGraph } from './AudioGraph';
import { SampleManager } from './SampleManager';
import { AudioTransport } from './Transport';
import type { EngineTrackState, TrackKey } from './types';

export class AudioEngine {
  private context: AudioContext | null = null;
  private graph: AudioGraph | null = null;
  private transport = new AudioTransport();
  private sampleManager = new SampleManager();
  private buffer: AudioBuffer | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private playbackRate = 1;

  private trackState: Record<TrackKey, EngineTrackState> = {
    vocals: { key: 'vocals', enabled: true, gain: 1, pan: 0, mute: false, solo: false },
    drums: { key: 'drums', enabled: true, gain: 1, pan: 0, mute: false, solo: false },
    bass: { key: 'bass', enabled: true, gain: 1, pan: 0, mute: false, solo: false },
    other: { key: 'other', enabled: true, gain: 1, pan: 0, mute: false, solo: false },
  };

  constructor() {
    this.ensureContext();
  }

  private ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
      this.graph = new AudioGraph(this.context);
      this.transport.attachContext(this.context);
      this.applyTrackState();
    }
  }

  async loadFile(file: File) {
    this.ensureContext();
    if (!this.context) {
      throw new Error('AudioContext is unavailable in this browser.');
    }

    this.stop();
    this.buffer = await this.sampleManager.decodeFile(file, this.context);
    if (!this.graph) {
      this.graph = new AudioGraph(this.context);
    }
    this.applyTrackState();
  }

  private applyTrackState() {
    if (!this.graph) return;
    (Object.keys(this.trackState) as TrackKey[]).forEach((key) => {
      const state = this.trackState[key];
      this.graph.setTrackGain(key, state.gain);
      this.graph.setTrackPan(key, state.pan);
    });
  }

  async play(offset = 0) {
    this.ensureContext();
    if (!this.context || !this.buffer || !this.graph) return;

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    if (this.activeSource) {
      this.stop();
    }

    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.playbackRate.value = this.playbackRate;
    this.graph.connectSource(source);
    this.activeSource = source;
    await this.transport.start(source, offset);
  }

  pause() {
    this.transport.pause();
    this.activeSource = null;
  }

  stop() {
    this.transport.stop();
    this.activeSource = null;
  }

  seek(time: number) {
    this.transport.seek(time);
    this.activeSource = null;
  }

  setMasterVolume(value: number) {
    this.graph?.setMasterVolume(value);
  }

  setPlaybackRate(value: number) {
    const nextValue = Math.max(0.5, Math.min(2, value));
    this.playbackRate = nextValue;

    if (this.activeSource) {
      this.activeSource.playbackRate.value = nextValue;
    }
  }

  setTrackGain(track: TrackKey, value: number) {
    this.trackState[track].gain = value;
    this.graph?.setTrackGain(track, value);
  }

  setTrackPan(track: TrackKey, value: number) {
    this.trackState[track].pan = value;
    this.graph?.setTrackPan(track, value);
  }

  getCurrentTime() {
    return this.transport.getCurrentTime();
  }

  getDuration() {
    return this.buffer?.duration ?? 0;
  }

  isLoaded() {
    return !!this.buffer;
  }

  getTrackCount() {
    return Object.keys(this.trackState).length;
  }

  isPlaying() {
    return this.transport.isPlaying();
  }

  getAnalyser() {
    return this.graph?.analyser ?? null;
  }
}

export const audioEngine = new AudioEngine();
