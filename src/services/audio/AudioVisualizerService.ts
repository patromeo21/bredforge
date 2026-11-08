// ============================================================================
// BREDFORGE v1.0 — REAL-TIME AUDIO ANALYSER SERVICE [REF: M42]
// ============================================================================

export class AudioVisualizerService {
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array = new Uint8Array(0);

  public attach(ctx: AudioContext, destinationNode: AudioNode): AnalyserNode {
    if (this.analyser) return this.analyser;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    destinationNode.connect(this.analyser);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    console.log('[AudioVisualizerService] Attached analyser node to audio destination.');
    return this.analyser;
  }

  public getAnalyserNode(): AnalyserNode | null {
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

  public getFrequencyData(array?: Uint8Array): Uint8Array {
    const target = array || this.dataArray;
    if (this.analyser) {
      this.analyser.getByteFrequencyData(target);
    }
    return target;
  }

  public getTimeDomainData(array?: Uint8Array): Uint8Array {
    const target = array || this.dataArray;
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(target);
    }
    return target;
  }

  public calculateRMS(): number {
    if (!this.analyser) return 0;
    const timeData = this.getByteTimeDomainData();
    let sumSquares = 0;
    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    return Math.sqrt(sumSquares / timeData.length);
  }
}

export const audioVisualizerService = new AudioVisualizerService();