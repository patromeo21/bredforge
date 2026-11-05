// ============================================================================
// STAGE A - PHASE 5: BRITISH CONSOLE SATURATION ENGINE (AudioGraph.ts)
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

  public saturationPreFilter: BiquadFilterNode;
  public saturationShaper: WaveShaperNode;
  private curveCache: { N: Float32Array; A: Float32Array };

  public djfxDelay: DelayNode;
  public djfxFeedback: GainNode;
  public djfxGate: GainNode;

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
      if (name !== 'saturation' && name !== 'djfxLooper') {
        bus.connect(this.masterGain);
      }
    });

    this.saturationPreFilter = this.ctx.createBiquadFilter();
    this.saturationPreFilter.type = 'lowpass';
    this.saturationPreFilter.frequency.value = 8000;

    this.saturationShaper = this.ctx.createWaveShaper();
    this.saturationShaper.oversample = '4x';

    this.curveCache = {
      N: this.makeConsoleCurve(4.0, 'N'),
      A: this.makeConsoleCurve(4.0, 'A')
    };

    this.saturationShaper.curve = (this.curveCache.N as unknown) as any;

    this.effectBuses.saturation.connect(this.saturationPreFilter);
    this.saturationPreFilter.connect(this.saturationShaper);
    this.saturationShaper.connect(this.masterGain);

    this.djfxGate = this.ctx.createGain();
    this.djfxGate.gain.value = 1.0;

    this.djfxDelay = this.ctx.createDelay(5.0);
    this.djfxDelay.delayTime.value = 0.25;

    this.djfxFeedback = this.ctx.createGain();
    this.djfxFeedback.gain.value = 0.0;

    this.effectBuses.djfxLooper.connect(this.djfxGate);
    this.djfxGate.connect(this.djfxDelay);
    this.djfxDelay.connect(this.djfxFeedback);
    this.djfxFeedback.connect(this.djfxDelay);
    this.djfxDelay.connect(this.masterGain);

    this.dryGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.padMappings = new Map();
    this.initializePadMappings();
  }

  private makeConsoleCurve(drive: number, style: 'N' | 'A'): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      let distorted = 0;

      if (style === 'N') {
        const scaledX = x * drive + 0.12; 
        distorted = (Math.sin(scaledX * deg * 90) * 0.9) + (Math.tanh(scaledX * 0.8) * 0.1);
      } else {
        const scaledX = x * drive;
        distorted = Math.tanh(scaledX);
      }

      curve[i] = Math.max(-1, Math.min(1, distorted));
    }
    return curve;
  }

  public setSaturationParams(drive: number, style: 'N' | 'A'): void {
    if (this.saturationShaper) {
      const freshCurve = this.makeConsoleCurve(Math.max(1.0, drive), style);
      this.saturationShaper.curve = (freshCurve as unknown) as any;
    }
  }

  public setSaturationDrive(driveValue: number): void {
    this.setSaturationParams(driveValue, 'N');
  }

  public setDJFXParams(time: number, feedback: number, isGateOpen: boolean, timeConstant: number = 0.01): void {
    const now = this.ctx.currentTime;
    
    if (this.djfxDelay && this.djfxDelay.delayTime) {
      this.djfxDelay.delayTime.setTargetAtTime(Math.max(0.01, Math.min(5.0, time)), now, timeConstant);
    }

    if (this.djfxFeedback && this.djfxFeedback.gain) {
      this.djfxFeedback.gain.setTargetAtTime(Math.max(0.0, Math.min(0.98, feedback)), now, timeConstant);
    }

    if (this.djfxGate && this.djfxGate.gain) {
      this.djfxGate.gain.setTargetAtTime(isGateOpen ? 1.0 : 0.0, now, 0.005);
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

  public setSidechainPreset(preset: any): void {
    console.log("Legacy sidechain preset call received:", preset);
  }

  public toggleFilterFlip(state: boolean): void {
    console.log("Legacy filter flip call received:", state);
  }
}