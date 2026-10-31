// src/services/audio/SampleManager.ts
// Decoupled Sample Management & AudioBuffer Decoding Engine

class SampleManagerEngine {
  private ctx: AudioContext | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();

  // Initialize or resume the AudioContext instance
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

  // Load and decode an ArrayBuffer into an AudioBuffer cache
  public async loadSample(bank: string, padIndex: number, file: File): Promise<AudioBuffer | null> {
    try {
      const context = this.getContext();
      const arrayBuffer = await file.arrayBuffer();
      const decodedData = await context.decodeAudioData(arrayBuffer);
      
      const key = `${bank}_${padIndex}`;
      this.bufferCache.set(key, decodedData);
      console.log(`[SampleManager] Successfully cached AudioBuffer for ${key} (${decodedData.duration.toFixed(2)}s)`);
      return decodedData;
    } catch (err) {
      console.error(`[SampleManager] Error decoding audio file for Bank ${bank} Pad ${padIndex + 1}:`, err);
      return null;
    }
  }

  // Retrieve decoded buffer
  public getBuffer(bank: string, padIndex: number): AudioBuffer | undefined {
    return this.bufferCache.get(`${bank}_${padIndex}`);
  }

  // Check if a sample buffer is present
  public hasBuffer(bank: string, padIndex: number): boolean {
    return this.bufferCache.has(`${bank}_${padIndex}`);
  }

  // Clear a pad buffer assignment
  public removeBuffer(bank: string, padIndex: number): void {
    this.bufferCache.delete(`${bank}_${padIndex}`);
  }
}

export const SampleManager = new SampleManagerEngine();
