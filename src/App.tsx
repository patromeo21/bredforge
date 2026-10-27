import { AudioGraph } from './AudioGraph';
import { SampleManager } from './SampleManager';
import { AudioTransport } from './Transport';
import type { EngineTrackState, MasterEffectState, TrackKey } from './types';

const audioBufferToWav = (audioBuffer: AudioBuffer) => {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const dataLength = audioBuffer.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let sampleIndex = 0; sampleIndex < audioBuffer.length; sampleIndex += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const value = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[sampleIndex]));
      view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
      offset += 2;
    }
  }

  return buffer;
};

export class AudioEngine {
  private context: AudioContext | null = null;
  private graph: AudioGraph | null = null;
  private transport = new AudioTransport();
  private sampleManager = new SampleManager();
  private buffer: AudioBuffer | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private playbackRate = 1;
  private mediaRecorder: MediaRecorder | null = null;
  private recorderDestination: MediaStreamAudioDestinationNode | null = null;
  private masterEffects: MasterEffectState = {
    drive: 1.2,
    cutoff: 12000,
    resonance: 1,
    limiter: -4,
  };

  private trackState: Record<TrackKey, EngineTrackState> = {
    vocals: { key: 'vocals', enabled: true, gain: 1, pan: 0, mute: false, solo: false, drive: 1.5, cutoff: 2000, resonance: 1 },
    drums: { key: 'drums', enabled: true, gain: 1, pan: 0, mute: false, solo: false, drive: 1.5, cutoff: 400, resonance: 1 },
    bass: { key: 'bass', enabled: true, gain: 1, pan: 0, mute: false, solo: false, drive: 1.8, cutoff: 200, resonance: 1.5 },
    other: { key: 'other', enabled: true, gain: 1, pan: 0, mute: false, solo: false, drive: 1.3, cutoff: 5000, resonance: 1 },
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
      this.applyMasterEffects();
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
    this.applyMasterEffects();
  }

  private getEffectiveTrackGain(track: TrackKey) {
    const state = this.trackState[track];
    const hasSolo = Object.values(this.trackState).some((item) => item.solo);

    if (state.mute) return 0;
    if (hasSolo && !state.solo) return 0;

    return state.gain;
  }

  private applyTrackState() {
    if (!this.graph) return;
    (Object.keys(this.trackState) as TrackKey[]).forEach((key) => {
      const state = this.trackState[key];
      this.graph.setTrackGain(key, this.getEffectiveTrackGain(key));
      this.graph.setTrackDrive(key, state.drive);
      this.graph.setTrackFilterFrequency(key, state.cutoff);
      this.graph.setTrackFilterResonance(key, state.resonance);
      this.graph.setTrackPan(key, state.pan);
    });
  }

  private applyMasterEffects() {
    if (!this.graph) return;
    this.graph.setMasterDrive(this.masterEffects.drive);
    this.graph.setMasterFilterCutoff(this.masterEffects.cutoff);
    this.graph.setMasterFilterResonance(this.masterEffects.resonance);
    this.graph.setMasterLimiter(this.masterEffects.limiter);
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

  setMasterDrive(value: number) {
    this.masterEffects.drive = value;
    this.graph?.setMasterDrive(value);
  }

  setMasterCutoff(value: number) {
    this.masterEffects.cutoff = value;
    this.graph?.setMasterFilterCutoff(value);
  }

  setMasterResonance(value: number) {
    this.masterEffects.resonance = value;
    this.graph?.setMasterFilterResonance(value);
  }

  setMasterLimiter(value: number) {
    this.masterEffects.limiter = value;
    this.graph?.setMasterLimiter(value);
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
    this.graph?.setTrackGain(track, this.getEffectiveTrackGain(track));
  }

  setTrackDrive(track: TrackKey, value: number) {
    this.trackState[track].drive = value;
    this.graph?.setTrackDrive(track, value);
  }

  setTrackFilterCutoff(track: TrackKey, value: number) {
    this.trackState[track].cutoff = value;
    this.graph?.setTrackFilterFrequency(track, value);
  }

  setTrackFilterResonance(track: TrackKey, value: number) {
    this.trackState[track].resonance = value;
    this.graph?.setTrackFilterResonance(track, value);
  }

  setTrackPan(track: TrackKey, value: number) {
    this.trackState[track].pan = value;
    this.graph?.setTrackPan(track, value);
  }

  setTrackMute(track: TrackKey, value: boolean) {
    this.trackState[track].mute = value;
    if (value) {
      this.trackState[track].solo = false;
    }
    this.applyTrackState();
  }

  setTrackSolo(track: TrackKey, value: boolean) {
    (Object.keys(this.trackState) as TrackKey[]).forEach((key) => {
      const isSelected = key === track;
      this.trackState[key].solo = isSelected ? value : false;
      if (isSelected && value) {
        this.trackState[key].mute = false;
      }
    });
    this.applyTrackState();
  }

  async toggleRecording() {
    if (!this.context || !this.graph) return false;

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
      this.recorderDestination = null;
      return false;
    }

    const destination = this.context.createMediaStreamDestination();
    this.graph.output.connect(destination);
    this.recorderDestination = destination;

    const chunks: BlobPart[] = [];
    const mediaRecorder = new MediaRecorder(destination.stream);
    this.mediaRecorder = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'bredforge-session.webm';
      anchor.click();
      URL.revokeObjectURL(url);
      this.recorderDestination = null;
      this.mediaRecorder = null;
    };

    mediaRecorder.start();
    return true;
  }

  exportWav(filename = 'bredforge-export.wav') {
    if (!this.buffer) return null;

    const wavBuffer = audioBufferToWav(this.buffer);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return filename;
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
