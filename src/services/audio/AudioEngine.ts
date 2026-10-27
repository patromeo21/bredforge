export class SampleManager {
  async decodeFile(file: File, context: AudioContext): Promise<AudioBuffer> {
    const raw = await file.arrayBuffer();
    return context.decodeAudioData(raw.slice(0));
  }

  getMetadata(buffer: AudioBuffer, fileName?: string) {
    return {
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      numberOfChannels: buffer.numberOfChannels,
      fileName
    };
  }
}
