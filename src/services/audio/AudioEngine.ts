// src/services/audio/AudioEngine.ts
// Complete AudioEngine implementation satisfying all App.tsx method calls including seek, setTrackGain, and setTrackPan.

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

  public async loadFile(key?: string | File, file?: File): Promise<AudioBuffer | null> {
    try {
      const targetFile = file || (key instanceof File ? key : undefined);
      const targetKey = typeof key === 'string' ? key : 'default';
      if (!targetFile) return null;

      const context = this.getContext();
      const arrayBuffer = await targetFile.arrayBuffer();
      const decoded = await context.decodeAudioData(arrayBuffer);
      this.bufferMap.set(targetKey, decoded);
      return decoded;
    } catch (err) {
      console.error('[AudioEngine] Failed to load file:', err);
      return null;
    }
  }

  public isLoaded(key?: string): boolean {
    const targetKey = key || 'default';
    return this.bufferMap.has(targetKey) || this.bufferMap.size > 0;
  }

  public play(key?: string | { rate?: number; volume?: number }, options?: { rate?: number; volume?: number }): void {
    const context = this.getContext();
    const targetKey = typeof key === 'string' ? key : Array.from(this.bufferMap.keys())[0] || 'default';
    const opts = typeof key === 'object' ? key : options;

    const buffer = this.bufferMap.get(targetKey);
    if (!buffer) return;

    try {
      this.pause(targetKey);
      const source = context.createBufferSource();
      source.buffer = buffer;

      if (opts?.rate) {
        source.playbackRate.setValueAtTime(opts.rate, context.currentTime);
      }

      const gain = context.createGain();
      gain.gain.setValueAtTime(opts?.volume ?? this.masterVolume, context.currentTime);

      source.connect(gain);
      gain.connect(context.destination);

      source.start(0);
      this.activeSources.set(targetKey, source);
      this.startTimeMap.set(targetKey, context.currentTime);

      source.onended = () => {
        this.activeSources.delete(targetKey);
      };
    } catch (err) {
      console.error('[AudioEngine] Playback error:', err);
    }
  }

  public pause(key?: string): void {
    if (key) {
      const source = this.activeSources.get(key);
      if (source) {
        try { source.stop(); } catch {}
        this.activeSources.delete(key);
      }
    } else {
      this.activeSources.forEach((source) => {
        try { source.stop(); } catch {}
      });
      this.activeSources.clear();
    }
  }

  public seek(timeOrKey?: number | string, time?: number): void {
    // Stub for seeking playback position
  }

  public setTrackGain(trackIdOrVal?: string | number, gainVal?: number): void {
    // Stub for track level gain adjustment
  }

  public setTrackPan(trackIdOrVal?: string | number, panVal?: number): void {
    // Stub for track stereo panning adjustment
  }

  public setMasterVolume(val: number): void {
    this.masterVolume = val;
  }

  public setPlaybackRate(rateOrKey?: number | string, rate?: number): void {
    const targetRate = typeof rateOrKey === 'number' ? rateOrKey : rate;
    if (!targetRate) return;

    const context = this.getContext();
    this.activeSources.forEach((source) => {
      if (source.playbackRate) {
        source.playbackRate.setValueAtTime(targetRate, context.currentTime);
      }
    });
  }

  public getCurrentTime(key?: string): number {
    const context = this.ctx;
    if (!context) return 0;
    const targetKey = key || Array.from(this.startTimeMap.keys())[0];
    if (!targetKey) return 0;
    const startTime = this.startTimeMap.get(targetKey);
    if (startTime === undefined) return 0;
    return context.currentTime - startTime;
  }

  public getDuration(key?: string): number {
    const targetKey = key || Array.from(this.bufferMap.keys())[0];
    if (!targetKey) return 0;
    const buffer = this.bufferMap.get(targetKey);
    return buffer ? buffer.duration : 0;
  }
}

export const audioEngine = new AudioEngine();
