// ============================================================================
// BREDFORGE v1.0 — STUDIO ANALOG SATURATION & TRANSIENT BUS (SaturationBus.ts)
// ============================================================================

export class SaturationBus {
  private ctx: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private waveshaper: WaveShaperNode;
  private driveNode: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();
    this.waveshaper = this.ctx.createWaveShaper();
    this.driveNode = this.ctx.createGain();

    // Set initial drive level
    this.driveNode.gain.value = 1.2;
    this.waveshaper.curve = this.createSaturationCurve(40);

    // Route audio chain: input -> drive -> waveshaper -> output
    this.inputNode.connect(this.driveNode);
    this.driveNode.connect(this.waveshaper);
    this.waveshaper.connect(this.outputNode);
  }

  private createSaturationCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Asymmetric soft-clipping curve for tape/vinyl warmth
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public getInputNode(): AudioNode {
    return this.inputNode;
  }

  public connect(destination: AudioNode): void {
    this.outputNode.connect(destination);
  }

  public setDrive(amount: number): void {
    // Clamp drive between 1.0 (clean) and 5.0 (heavy saturation)
    const clamped = Math.max(1.0, Math.min(5.0, amount));
    this.driveNode.gain.setValueAtTime(clamped, this.ctx.currentTime);
  }

  public dispose(): void {
    this.inputNode.disconnect();
    this.driveNode.disconnect();
    this.waveshaper.disconnect();
    this.outputNode.disconnect();
  }
}