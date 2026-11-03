export interface AudioGraphConfig {
  sampleRate?: number;
}

export class AudioGraph {
  public ctx: AudioContext;
  public masterLimiter: DynamicsCompressorNode;
  public masterEqBands: BiquadFilterNode[] = [];
  public sidechainCompressor: DynamicsCompressorNode;
  
  // Track Parallel Leg Nodes (8 Channels x 3 Processing Slots)
  public trackBuses: GainNode[] = [];
  public trackSlots: { bitcrush: WaveShaperNode; phaser: BiquadFilterNode; looper: GainNode }[] = [];

  constructor(config?: AudioGraphConfig) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass(config);

    // 1. Master Limiter (20:1 Ratio)
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-3, this.ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(0, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(20, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.1, this.ctx.currentTime);

    // 2. Sidechain Compressor Bus
    this.sidechainCompressor = this.ctx.createDynamicsCompressor();
    this.sidechainCompressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.sidechainCompressor.ratio.setValueAtTime(2, this.ctx.currentTime);
    this.sidechainCompressor.attack.setValueAtTime(0.01, this.ctx.currentTime);
    this.sidechainCompressor.release.setValueAtTime(0.08, this.ctx.currentTime);

    // 3. 5-Band Parametric EQ (Filter-Flip Capable)
    const frequencies = [60, 250, 1000, 4000, 12000];
    this.masterEqBands = frequencies.map((freq: number, index: number) => {
      const filter = this.ctx.createBiquadFilter();
      if (index === 0) filter.type = 'lowshelf';
      else if (index === 4) filter.type = 'highshelf';
      else filter.type = 'peaking';
      
      filter.frequency.setValueAtTime(freq, this.ctx.currentTime);
      filter.gain.setValueAtTime(0, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.707, this.ctx.currentTime);
      return filter;
    });

    // Chain EQ series -> Sidechain -> Master Limiter -> Destination
    let previousNode: AudioNode = this.masterEqBands[0];
    for (let i = 1; i < this.masterEqBands.length; i++) {
      previousNode.connect(this.masterEqBands[i]);
      previousNode = this.masterEqBands[i];
    }
    previousNode.connect(this.sidechainCompressor);
    this.sidechainCompressor.connect(this.masterLimiter);
    this.masterLimiter.connect(this.ctx.destination);

    // 4. Initialize 8 Track Buses with 3 Stationary Parallel Processing Legs
    for (let t = 0; t < 8; t++) {
      const bus = this.ctx.createGain();
      bus.gain.setValueAtTime(0.8, this.ctx.currentTime);
      bus.connect(this.masterEqBands[0]);
      this.trackBuses.push(bus);

      // Bitcrush WaveShaper stub
      const bitcrush = this.ctx.createWaveShaper();
      // Phaser Biquad stub
      const phaser = this.ctx.createBiquadFilter();
      phaser.type = 'allpass';
      phaser.frequency.setValueAtTime(1000, this.ctx.currentTime);
      // Looper / Tape-stop Gain stub
      const looper = this.ctx.createGain();
      looper.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.trackSlots.push({ bitcrush, phaser, looper });
    }
  }

  public async resumeContext(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setSidechainPreset(preset: 'soft' | 'medium' | 'hard'): void {
    const t = this.ctx.currentTime;
    if (preset === 'soft') {
      this.sidechainCompressor.attack.setValueAtTime(0.02, t);
      this.sidechainCompressor.release.setValueAtTime(0.15, t);
      this.sidechainCompressor.ratio.setValueAtTime(1.5, t);
    } else if (preset === 'medium') {
      this.sidechainCompressor.attack.setValueAtTime(0.01, t);
      this.sidechainCompressor.release.setValueAtTime(0.08, t);
      this.sidechainCompressor.ratio.setValueAtTime(2.0, t);
    } else if (preset === 'hard') {
      this.sidechainCompressor.attack.setValueAtTime(0.001, t);
      this.sidechainCompressor.release.setValueAtTime(0.04, t);
      this.sidechainCompressor.ratio.setValueAtTime(3.5, t);
    }
  }

  public toggleFilterFlip(enableLowpass: boolean): void {
    const band5 = this.masterEqBands[4];
    const t = this.ctx.currentTime;
    if (enableLowpass) {
      band5.type = 'lowpass';
      band5.frequency.setValueAtTime(20000, t);
      band5.Q.setValueAtTime(0.707, t);
    } else {
      band5.type = 'highshelf';
      band5.frequency.setValueAtTime(12000, t);
      band5.gain.setValueAtTime(0, t);
    }
  }

  public createSafeFloat32Array(length: number): Float32Array<ArrayBuffer> {
    return new Float32Array(length) as Float32Array<ArrayBuffer>;
  }
}