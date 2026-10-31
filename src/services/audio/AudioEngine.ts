// src/services/audio/AudioEngine.ts
// Complete AudioEngine implementation satisfying all App.tsx method calls.

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private bufferMap: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private startTimeMap: Map<string, number> = new Map();
  private masterVolume: number = 0.85;

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public async loadFile(key: string, file: File): Promise<AudioBuffer | null> {
    try {
      const context = this.getContext();
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await context.decodeAudioData(arrayBuffer);
      this.bufferMap.set(key, decoded);
      return decoded;
    } catch (err) {
      console.error('[AudioEngine] Failed to load file:', err);
      return null;
    }
  }

  public isLoaded(key: string): boolean {
    return this.bufferMap.has(key);
  }

  public play(key: string, options?: { rate?: number; volume?: number }): void {
    const context = this.getContext();
    const buffer = this.bufferMap.get(key);
    if (!buffer) return;

    try {
      this.pause(key);
      const source = context.createBufferSource();
      source.buffer = buffer;
      
      if (options?.rate) {
        source.playbackRate.setValueAtTime(options.rate, context.currentTime);
      }

      const gain = context.createGain();
      gain.gain.setValueAtTime(options?.volume ?? this.masterVolume, context.currentTime);

      source.connect(gain);
      gain.connect(context.destination);
      
      source.start(0);
      this.activeSources.set(key, source);
      this.startTimeMap.set(key, context.currentTime);

      source.onended = () => {
        this.activeSources.delete(key);
      };
    } catch (err) {
      console.error('[AudioEngine] Playback error:', err);
    }
  }

  public pause(key: string): void {
    const source = this.activeSources.get(key);
    if (source) {
      try {
        source.stop();
      } catch {}
      this.activeSources.delete(key);
    }
  }

  public setMasterVolume(val: number): void {
    this.masterVolume = val;
  }

  public setPlaybackRate(key: string, rate: number): void {
    const source = this.activeSources.get(key);
    if (source && source.playbackRate) {
      const context = this.getContext();
      source.playbackRate.setValueAtTime(rate, context.currentTime);
    }
  }

  public getCurrentTime(key: string): number {
    const context = this.ctx;
    if (!context) return 0;
    const startTime = this.startTimeMap.get(key);
    if (startTime === undefined) return 0;
    return context.currentTime - startTime;
  }

  public getDuration(key: string): number {
    const buffer = this.bufferMap.get(key);
    return buffer ? buffer.duration : 0;
  }
}

export const audioEngine = new AudioEngine();
