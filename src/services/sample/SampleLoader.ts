export class SampleLoader {
  private audioCtx: AudioContext;

  constructor(audioCtx: AudioContext) {
    this.audioCtx = audioCtx;
  }

  /**
   * Reads a File object, validates format, decodes audio, and returns an AudioBuffer.
   */
  public async loadAudioFile(file: File): Promise<AudioBuffer> {
    // Reject Ableton analysis files (.asd) or non-audio metadata
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

  /**
   * Helper to trigger a native browser file picker dialog for valid audio files
   */
  public openFilePicker(onFileSelected: (file: File) => void): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/wav, audio/mp3, audio/mpeg, audio/aac, .wav, .mp3, .m4a';
    input.style.display = 'none';

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        if (file.name.endsWith('.asd')) {
          alert('Skipped .asd file: Ableton analysis files cannot be played as audio.');
          document.body.removeChild(input);
          return;
        }
        onFileSelected(file);
      }
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  }
}