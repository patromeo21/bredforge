export class SampleLoader {
  private audioCtx: AudioContext;

  constructor(audioCtx: AudioContext) {
    this.audioCtx = audioCtx;
  }

  /**
   * Reads a File object (from an <input type="file"> element),
   * decodes its audio data, and returns an AudioBuffer.
   */
  public async loadAudioFile(file: File): Promise<AudioBuffer> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      return decodedBuffer;
    } catch (error) {
      console.error(`Failed to decode audio file: ${file.name}`, error);
      throw error;
    }
  }

  /**
   * Helper to trigger a native browser file picker dialog for audio files (.wav, .mp3)
   */
  public openFilePicker(onFileSelected: (file: File) => void): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/wav, audio/mp3, audio/mpeg, audio/aac';
    input.style.display = 'none';

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        onFileSelected(file);
      }
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  }
}