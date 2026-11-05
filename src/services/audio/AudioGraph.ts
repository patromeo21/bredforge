// ============================================================================
// STAGE A - PHASE 2: HIGH-FIDELITY PARALLEL GRAPH INITIALIZATION (UPDATED)
// ============================================================================

export type SPFxType = 'djfxLooper' | 'vinylSim' | 'bitCrasher' | 'isolator' | 'bypass';

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

  public padMappings: Map<string, PadRoutingConfig>;

  constructor(audioCtx?: AudioContext) {
    // Initialize or bind existing AudioContext safely
    this.ctx = audioCtx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Master & Dry Gain Nodes
    this.masterGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 1.0;

    // Pre-instantiate parallel processing channels (Effect Buses) at boot time
    this.effectBuses = {
      vinylSim: this.ctx.createGain(),
      djfxLooper: this.ctx.createGain(),
      saturation: this.ctx.createGain(),
      echo: this.ctx.createGain(),
      eq: this.ctx.createGain(),
      vocoder: this.ctx.createGain(),
    };

    // Default effect bus gains to 0.0 (bypass/muted until triggered) and route to master
    Object.values(this.effectBuses).forEach((bus) => {
      bus.gain.value = 0.0;
      bus.connect(this.masterGain);
    });

    // Connect Dry line to Master, Master to Destination
    this.dryGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Initialize 64-Pad Continuous Hex Dispatcher Mapping (00 to 3F)
    this.padMappings = new Map();
    this.initializePadMappings();
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