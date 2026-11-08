// ============================================================================
// BREDFORGE v1.0 — REAL-TIME AUDIO ANALYSER SERVICE (AudioVisualizerService.ts)
// ============================================================================

export class AudioVisualizerService {
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array = new Uint8Array(0);

  public attach(ctx: AudioContext, destinationNode: AudioNode): AnalyserNode {
    if (this.analyser) return this.analyser;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256; // Optimized for 60fps canvas rendering
    this.analyser.smoothingTimeConstant = 0.8;

    destinationNode.connect(this.analyser);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    console.log('[AudioVisualizerService] Attached analyser node to audio destination.');
    return this.analyser;
  }

  public getByteFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.dataArray);
    }
    return this.dataArray;
  }

  public getByteTimeDomainData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.dataArray);
    }
    return this.dataArray;
  }
}

export const audioVisualizerService = new AudioVisualizerService();