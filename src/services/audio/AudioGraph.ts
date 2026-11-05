// ============================================================================
// STAGE A - PHASE 3: DE-DUPLICATED ASYMMETRICAL SATURATION ENGINE (AudioGraph.ts)
// ============================================================================

export type SPFxType = 'djfxLooper' | 'vinylSim' | 'bitCrasher' | 'isolator' | 'saturation' | 'bypass';

export interface PadRoutingConfig {
  dryLevel: number;
  fxType: SPFxType;
  fxLevel: number;
}

export class AudioGraph {
  public ctx: AudioContext;
  public masterGain: GainNode;
  public dryGain: GainNode;
  
  public effectBuses: {
    vinylSim: GainNode;
    djfxLooper: GainNode;
    saturation: GainNode;
    echo: GainNode;
    eq: GainNode;
    vocoder: GainNode;
  };

  public saturationShaper: WaveShaperNode;
  public padMappings: Map<string, PadRoutingConfig>;

  constructor(audioCtx?: AudioContext) {
    this.ctx = audioCtx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    this.masterGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 1.0;

    this.effectBuses = {
      vinylSim: this.ctx.createGain(),
      djfxLooper: this.ctx.createGain(),
      saturation: this.ctx.createGain(),
      echo: this.ctx.createGain(),
      eq: this.ctx.createGain(),
      vocoder: this.ctx.createGain(),
    };

    Object.entries(this.effectBuses).forEach(([name, bus]) => {
      bus.gain.value = 0.0;
      if (name !== 'saturation') {
        bus.connect(this.masterGain);
      }
    });

    // ============================================================================
    // ASYMMETRICAL TUBE SATURATION WAVESHAPER INJECTION
    // ============================================================================
    this.saturationShaper = this.ctx.createWaveShaper();
    this.saturationShaper.oversample = '4x';
    const initialCurve = this.makeDecapitatorCurve(4.0);
    this.saturationShaper.curve = initialCurve as unknown as Float32Array;

    this.effectBuses.saturation.connect(this.saturationShaper);
    this.saturationShaper.connect(this.masterGain);
    // ============================================================================

    this.dryGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.padMappings = new Map();
    this.initializePadMappings();
  }

  private makeDecapitatorCurve(drive: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      const scaledX = x * drive + 0.12; 
      const distorted = (Math.sin(scaledX * deg * 90) * 0.9) + (Math.tanh(scaledX * 0.8) * 0.1);
      curve[i] = Math.max(-1, Math.min(1, distorted));
    }
    return curve;
  }

  public setSaturationDrive(driveValue: number): void {
    if (this.saturationShaper) {
      const newCurve = this.makeDecapitatorCurve(Math.max(1.0, driveValue));
      this.saturationShaper.curve = newCurve as unknown as Float32Array;
    }
  }

  private initializePadMappings(): void {
    for (let i = 0; i < 64; i++) {
      const hexKey = i.toString(16).toUpperCase().padStart(2, '0');
      this.padMappings.set(hexKey, {
        dryLevel: 1.0,
        fxType: 'bypass',
        fxLevel: 0.0,
      });
    }
  }

  public getBus(busName: keyof typeof this.effectBuses): GainNode {
    return this.effectBuses[busName];
  }

  public setBusGain(busName: keyof typeof this.effectBuses, value: number, timeConstant: number = 0.01): void {
    const bus = this.effectBuses[busName];
    if (bus) {
      bus.gain.setTargetAtTime(value, this.ctx.currentTime, timeConstant);
    }
  }

  public getPadConfig(hexId: string): PadRoutingConfig | undefined {
    return this.padMappings.get(hexId.toUpperCase());
  }

  public setPadConfig(hexId: string, config: Partial<PadRoutingConfig>): void {
    const key = hexId.toUpperCase();
    const existing = this.padMappings.get(key);
    if (existing) {
      this.padMappings.set(key, { ...existing, ...config });
    }
  }

  public async resumeContext(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // ============================================================================
  // LEGACY COMPATIBILITY STUBS FOR MasterDSPController.ts
  // ============================================================================
  public setSidechainPreset(preset: any): void {
    console.log("Legacy sidechain preset call received:", preset);
  }

  public toggleFilterFlip(state: boolean): void {
    console.log("Legacy filter flip call received:", state);
  }
}