// ============================================================================
// BREDFORGE v1.0 — ASYNCHRONOUS SAMPLE & BUFFER MANAGER (SampleManager.ts)
// ============================================================================

export interface SampleSlot {
  id: string;
  name: string;
  buffer: AudioBuffer | null;
  duration: number;
}

export class SampleManager {
  private static instance: SampleManager | null = null;
  private ctx: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private metadata: Map<string, { name: string; duration: number }> = new Map();

  constructor() {
    if (SampleManager.instance) {
      return SampleManager.instance;
    }
    SampleManager.instance = this;
  }

  public static getInstance(): SampleManager {
    if (!SampleManager.instance) {
      SampleManager.instance = new SampleManager();
    }
    return SampleManager.instance;
  }

  public static getContext(): AudioContext {
    const inst = SampleManager.getInstance();
    if (!inst.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      inst.ctx = new AudioCtx();
    }
    if (inst.ctx.state === 'suspended') {
      inst.ctx.resume();
    }
    return inst.ctx;
  }

  public static async loadSampleFromUrl(id: string | number, name: string, url: string): Promise<AudioBuffer | null> {
    const inst = SampleManager.getInstance();
    const context = SampleManager.getContext();
    return inst.loadSample(id, name, url, context);
  }

  public async loadSample(id: string | number, name: string, url: string, ctx: AudioContext): Promise<AudioBuffer | null> {
    const stringId = String(id);
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      this.buffers.set(stringId, audioBuffer);
      this.metadata.set(stringId, { name, duration: audioBuffer.duration });

      console.log(`[SampleManager] Successfully loaded sample '${name}' (${stringId}), duration: ${audioBuffer.duration.toFixed(2)}s`);
      return audioBuffer;
    } catch (err) {
      console.error(`[SampleManager] Failed to load sample '${name}' from URL: ${url}`, err);
      return null;
    }
  }

  public getBuffer(id: string | number): AudioBuffer | undefined {
    return this.buffers.get(String(id));
  }

  public getMetadata(id: string | number) {
    return this.metadata.get(String(id));
  }

  public clearBuffer(id: string | number) {
    const stringId = String(id);
    this.buffers.delete(stringId);
    this.metadata.delete(stringId);
  }

  public clearAll() {
    this.buffers.clear();
    this.metadata.clear();
    console.log('[SampleManager] Cleared all audio buffers from memory.');
  }
}

export const sampleManager = SampleManager.getInstance();