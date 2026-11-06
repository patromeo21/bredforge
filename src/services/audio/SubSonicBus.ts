// ============================================================================
// BREDFORGE v1.0 — HYBRID SUB-SONIC COMPRESSOR & SATURATION BUS (SubSonicBus.ts)
// ============================================================================

export class SubSonicBus {
  private context: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  
  // DSP Nodes
  private compressor: DynamicsCompressorNode;
  private waveshaper: WaveShaperNode;
  private airFilter: BiquadFilterNode;
  private lowEndEnhancer: BiquadFilterNode;

  constructor(audioContext: AudioContext) {
    this.context = audioContext;

    // Create IO gain staging
    this.inputNode = this.context.createGain();
    this.outputNode = this.context.createGain();

    // 1. SP-404 Pump & Glue Compressor Node
    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-24, this.context.currentTime);
    this.compressor.knee.setValueAtTime(12, this.context.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.context.currentTime);
    this.compressor.attack.setValueAtTime(0.005, this.context.currentTime); // Fast attack
    this.compressor.release.setValueAtTime(0.180, this.context.currentTime); // Rhythmic release

    // 2. Decapitator + SP-404 Saturation WaveShaper Node
    this.waveshaper = this.context.createWaveShaper();
    this.waveshaper.curve = this.createSaturationCurve(2.5); // Drive amount

    // 3. MPC AIR High-End Spectral Warmth (High-Shelf Exciter)
    this.airFilter = this.context.createBiquadFilter();
    this.airFilter.type = 'highshelf';
    this.airFilter.frequency.setValueAtTime(12000, this.context.currentTime);
    this.airFilter.gain.setValueAtTime(3.0, this.context.currentTime); // +3dB top-end air

    // 4. Sub-Sonic Low-End Weight & Phase Alignment (Low-Shelf)
    this.lowEndEnhancer = this.context.createBiquadFilter();
    this.lowEndEnhancer.type = 'lowshelf';
    this.lowEndEnhancer.frequency.setValueAtTime(90, this.context.currentTime);
    this.lowEndEnhancer.gain.setValueAtTime(2.5, this.context.currentTime); // Thick sub weight

    // Chain Routing: Input -> LowEnd -> Compressor -> WaveShaper -> AirFilter -> Output
    this.inputNode.connect(this.lowEndEnhancer);
    this.lowEndEnhancer.connect(this.compressor);
    this.compressor.connect(this.waveshaper);
    this.waveshaper.connect(this.airFilter);
    this.airFilter.connect(this.outputNode);
  }

  // Generates asymmetrical soft-clipping curve modeling vintage tube/tape saturation
  private createSaturationCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Asymmetric hyperbolic tangent shaping for warm harmonic distortion
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public connect(destination: AudioNode | AudioDestinationNode) {
    this.outputNode.connect(destination);
  }

  public getInput(): GainNode {
    return this.inputNode;
  }

  public setDrive(amount: number) {
    this.waveshaper.curve = this.createSaturationCurve(amount);
  }
}