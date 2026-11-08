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
  private buffers: Map<string, AudioBuffer> = new Map();
  private metadata: Map<string, { name: string; duration: number }> = new Map();

  public async loadSample(id: string, name: string, url: string, ctx: AudioContext): Promise<AudioBuffer | null> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      this.buffers.set(id, audioBuffer);
      this.metadata.set(id, { name, duration: audioBuffer.duration });

      console.log(`[SampleManager] Successfully loaded sample '${name}' (${id}), duration: ${audioBuffer.duration.toFixed(2)}s`);
      return audioBuffer;
    } catch (err) {
      console.error(`[SampleManager] Failed to load sample '${name}' from URL: ${url}`, err);
      return null;
    }
  }

  public getBuffer(id: string): AudioBuffer | undefined {
    return this.buffers.get(id);
  }

  public getMetadata(id: string) {
    return this.metadata.get(id);
  }

  public clearBuffer(id: string) {
    this.buffers.delete(id);
    this.metadata.delete(id);
  }

  public clearAll() {
    this.buffers.clear();
    this.metadata.clear();
    console.log('[SampleManager] Cleared all audio buffers from memory.');
  }
}

export const sampleManager = new SampleManager();