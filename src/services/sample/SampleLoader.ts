export class SampleLoader {
  private audioCtx: AudioContext;

  constructor(audioCtx: AudioContext) {
    this.audioCtx = audioCtx;
  }

  /**
   * Reads a File object, validates format, decodes audio, and returns an AudioBuffer.
   */
  public async loadAudioFile(file: File): Promise<AudioBuffer> {
    if (file.name.endsWith('.asd') || (file.type === 'application/octet-stream' && file.name.includes('.asd'))) {
      throw new Error(`Cannot load Ableton analysis file (.asd): ${file.name}`);
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      return decodedBuffer;
    } catch (error) {
      console.error(`Failed to decode audio file: ${file.name}`, error);
      throw error;
    }
  }
}