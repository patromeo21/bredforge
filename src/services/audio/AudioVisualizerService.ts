// ============================================================================
// BREDFORGE v1.0 — AUDIO VISUALIZER SERVICE (AudioVisualizerService.ts)
// ============================================================================

export class AudioVisualizerService {
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private timeDataArray: Uint8Array;

  constructor(ctx: AudioContext, fftSize: number = 512) {
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.analyser.smoothingTimeConstant = 0.8;
    
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    this.timeDataArray = new Uint8Array(bufferLength);
  }

  public getAnalyserNode(): AnalyserNode {
    return this.analyser;
  }

  public getFrequencyData(): Uint8Array {
    this.analyser.getByteFrequencyData(this.dataArray as any);
    return this.dataArray;
  }

  public getTimeDomainData(): Uint8Array {
    this.analyser.getByteTimeDomainData(this.timeDataArray as any);
    return this.timeDataArray;
  }

  public calculateRMS(): number {
    const timeData = this.getTimeDomainData();
    let sumSquares = 0;
    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128; // Normalize around 0
      sumSquares += normalized * normalized;
    }
    return Math.sqrt(sumSquares / timeData.length);
  }
}