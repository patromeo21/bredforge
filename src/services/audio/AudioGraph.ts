// ============================================================================
// STAGE C - PHASE 23: DECOUPLED SPEED & PITCH CONSTANT MODIFIERS (AudioGraph.ts)
// ============================================================================

export type SPFxType = 'djfxLooper' | 'vinylSim' | 'bitCrasher' | 'isolator' | 'saturation' | 'echo' | 'eq' | 'vocoder' | 'bypass';

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

  // Console Saturation & Pre-Filter Nodes
  public saturationPreFilter: BiquadFilterNode;
  public saturationShaper: WaveShaperNode;
  private curveCache: { N: Float32Array; A: Float32Array };

  // DJFX Loop Stutter Matrix Nodes
  public djfxDelay: DelayNode;
  public djfxFeedback: GainNode;
  public djfxGate: GainNode;

  // Resonant Echo Bus Nodes
  public echoDelay: DelayNode;
  public echoFeedback: GainNode;
  public echoFilter: BiquadFilterNode;

  // SSL G-Series Proportional-Q EQ Nodes
  public eqLow: BiquadFilterNode;
  public eqMid: BiquadFilterNode;
  public eqHigh: BiquadFilterNode;

  // Eventide H3000 Spatial Robot Vocoder Nodes
  public vocoderLeftDelay: DelayNode;
  public vocoderRightDelay: DelayNode;
  public vocoderLeftGain: GainNode;
  public vocoderRightGain: GainNode;

  // Master Brickwall Limiter & Bus Compressor Nodes
  public masterBusCompressor: DynamicsCompressorNode;
  public masterBrickwallLimiter: DynamicsCompressorNode;

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
      if (name !== 'saturation' && name !== 'djfxLooper' && name !== 'echo' && name !== 'eq' && name !== 'vocoder') {
        bus.connect(this.masterGain);
      }
    });

    // ============================================================================
    // CONSOLE SATURATION WIRING
    // ============================================================================
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
    // ============================================================================

    // ============================================================================
    // RECURSIVE DJFX LOOP-CATCHER CIRCUIT WIRING
    // ============================================================================
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
    // ============================================================================

    // ============================================================================
    // RESONANT ECHO BUS WIRING
    // ============================================================================
    this.echoDelay = this.ctx.createDelay(2.0);
    this.echoDelay.delayTime.value = 0.375;

    this.echoFeedback = this.ctx.createGain();
    this.echoFeedback.gain.value = 0.4;

    this.echoFilter = this.ctx.createBiquadFilter();
    this.echoFilter.type = 'bandpass';
    this.echoFilter.frequency.value = 1200;
    this.echoFilter.Q.value = 1.5;

    this.effectBuses.echo.connect(this.echoDelay);
    this.echoDelay.connect(this.echoFilter);
    this.echoFilter.connect(this.echoFeedback);
    this.echoFeedback.connect(this.echoDelay);
    // ============================================================================

    // ============================================================================
    // SSL G-SERIES PROPORTIONAL-Q EQ PIPELINE WIRING
    // ============================================================================
    this.eqLow = this.ctx.createBiquadFilter();
    this.eqLow.type = 'lowshelf';
    this.eqLow.frequency.value = 200;
    this.eqLow.gain.value = 0;

    this.eqMid = this.ctx.createBiquadFilter();
    this.eqMid.type = 'peaking';
    this.eqMid.frequency.value = 1500;
    this.eqMid.gain.value = 0;
    this.eqMid.Q.value = 1.0;

    this.eqHigh = this.ctx.createBiquadFilter();
    this.eqHigh.type = 'highshelf';
    this.eqHigh.frequency.value = 5000;
    this.eqHigh.gain.value = 0;

    this.effectBuses.eq.connect(this.eqLow);
    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);
    // ============================================================================

    // ============================================================================
    // SPATIAL ROBOT VOCODER MATRIX WIRING
    // ============================================================================
    this.vocoderLeftDelay = this.ctx.createDelay(0.1);
    this.vocoderLeftDelay.delayTime.value = 0.007;

    this.vocoderRightDelay = this.ctx.createDelay(0.1);
    this.vocoderRightDelay.delayTime.value = 0.011;

    this.vocoderLeftGain = this.ctx.createGain();
    this.vocoderLeftGain.gain.value = 0.707;

    this.vocoderRightGain = this.ctx.createGain();
    this.vocoderRightGain.gain.value = 0.707;

    this.effectBuses.vocoder.connect(this.vocoderLeftDelay);
    this.effectBuses.vocoder.connect(this.vocoderRightDelay);

    this.vocoderLeftDelay.connect(this.vocoderLeftGain);
    this.vocoderRightDelay.connect(this.vocoderRightGain);
    // ============================================================================

    // ============================================================================
    // MASTER DYNAMICS & BRICKWALL LIMITER STAGE
    // ============================================================================
    this.masterBusCompressor = this.ctx.createDynamicsCompressor();
    this.masterBusCompressor.threshold.value = -16.0;
    this.masterBusCompressor.knee.value = 3.0;
    this.masterBusCompressor.ratio.value = 2.5;
    this.masterBusCompressor.attack.value = 0.015;
    this.masterBusCompressor.release.value = 0.150;

    this.masterBrickwallLimiter = this.ctx.createDynamicsCompressor();
    this.masterBrickwallLimiter.threshold.value = -0.5;
    this.masterBrickwallLimiter.knee.value = 0.0;
    this.masterBrickwallLimiter.ratio.value = 20.0;
    this.masterBrickwallLimiter.attack.value = 0.001;
    this.masterBrickwallLimiter.release.value = 0.050;

    this.saturationShaper.connect(this.masterBusCompressor);
    this.djfxDelay.connect(this.masterBusCompressor);
    this.echoDelay.connect(this.masterBusCompressor);
    this.eqHigh.connect(this.masterBusCompressor);
    this.vocoderLeftGain.connect(this.masterBusCompressor);
    this.vocoderRightGain.connect(this.masterBusCompressor);

    this.dryGain.connect(this.masterBusCompressor);

    this.masterBusCompressor.connect(this.masterBrickwallLimiter);
    this.masterBrickwallLimiter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    // ============================================================================

    this.padMappings = new Map();
    this.initializePadMappings();
  }

  // ============================================================================
  // PHASE 10: UNIFIED 64-PAD CONTINUOUS HEX DISPATCHER STATIC UTILITIES
  // ============================================================================
  public static getHexIdFromBank(bankIndex: number, padIndex: number): string {
    const clampedBank = Math.max(0, Math.min(3, bankIndex));
    const clampedPad = Math.max(0, Math.min(15, padIndex));
    const continuousIndex = (clampedBank * 16) + clampedPad;
    return continuousIndex.toString(16).toUpperCase().padStart(2, '0');
  }

  public static getBankAndPadFromHex(hexId: string): { bankIndex: number; padIndex: number } {
    const parsedInt = parseInt(hexId, 16);
    const validInt = isNaN(parsedInt) ? 0 : Math.max(0, Math.min(63, parsedInt));
    const bankIndex = Math.floor(validInt / 16);
    const padIndex = validInt % 16;
    return { bankIndex, padIndex };
  }
  // ============================================================================

  // ============================================================================
  // PHASE 23: DECOUPLED SPEED & PITCH CONSTANT MODIFIERS WORKLET CONNECTOR
  // ============================================================================
  public connectStretchNode(
    source: AudioBufferSourceNode,
    originalBpm: number,
    targetBpm: number,
    semitoneOffset: number
  ): any {
    const calculatedRatio = originalBpm / targetBpm;
    const calculatedPitch = Math.pow(2, semitoneOffset / 12);

    if (source && source.playbackRate) {
      source.playbackRate.setValueAtTime(calculatedPitch, this.ctx.currentTime);
    }

    try {
      const stretchNode = new AudioWorkletNode(this.ctx, 'StretchProcessor');
      
      const stretchParam = stretchNode.parameters.get('stretchRatio');
      if (stretchParam) {
        stretchParam.setValueAtTime(calculatedRatio, this.ctx.currentTime);
      }

      source.connect(stretchNode);
      stretchNode.connect(this.masterBusCompressor);

      return stretchNode;
    } catch (error) {
      console.warn("StretchProcessor AudioWorkletNode instantiation failed, falling back to direct dry routing:", error);
      source.connect(this.dryGain);
      return source;
    }
  }
  // ============================================================================

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

  public setEchoParams(delayTime: number, feedback: number, filterFreq: number, timeConstant: number = 0.01): void {
    const now = this.ctx.currentTime;
    if (this.echoDelay) {
      this.echoDelay.delayTime.setTargetAtTime(Math.max(0.01, Math.min(2.0, delayTime)), now, timeConstant);
    }
    if (this.echoFeedback) {
      this.echoFeedback.gain.setTargetAtTime(Math.max(0.0, Math.min(0.95, feedback)), now, timeConstant);
    }
    if (this.echoFilter) {
      this.echoFilter.frequency.setTargetAtTime(Math.max(100, Math.min(10000, filterFreq)), now, timeConstant);
    }
  }

  public setEQParams(lowGain: number, midGain: number, highGain: number, timeConstant: number = 0.01): void {
    const now = this.ctx.currentTime;

    if (this.eqLow) {
      this.eqLow.gain.setTargetAtTime(Math.max(-24, Math.min(24, lowGain)), now, timeConstant);
    }

    if (this.eqMid) {
      this.eqMid.gain.setTargetAtTime(Math.max(-24, Math.min(24, midGain)), now, timeConstant);
      const dynamicQ = Math.max(0.5, Math.min(8.0, 1.0 + Math.abs(midGain) * 0.25));
      this.eqMid.Q.setTargetAtTime(dynamicQ, now, timeConstant);
    }

    if (this.eqHigh) {
      this.eqHigh.gain.setTargetAtTime(Math.max(-24, Math.min(24, highGain)), now, timeConstant);
    }
  }

  public setVocoderParams(gainLeft: number, gainRight: number, timeConstant: number = 0.01): void {
    const now = this.ctx.currentTime;

    if (this.vocoderLeftGain) {
      this.vocoderLeftGain.gain.setTargetAtTime(Math.max(0.0, Math.min(1.0, gainLeft)), now, timeConstant);
    }

    if (this.vocoderRightGain) {
      this.vocoderRightGain.gain.setTargetAtTime(Math.max(0.0, Math.min(1.0, gainRight)), now, timeConstant);
    }
  }

  public punchInEffect(targetFX: SPFxType, paramValue: number): void {
    const now = this.ctx.currentTime;
    const rampEnd = now + 0.005;

    if (targetFX === 'bypass') {
      if (this.dryGain && this.dryGain.gain) {
        this.dryGain.gain.cancelScheduledValues(now);
        this.dryGain.gain.setValueAtTime(this.dryGain.gain.value, now);
        this.dryGain.gain.linearRampToValueAtTime(1.0, rampEnd);
      }

      Object.values(this.effectBuses).forEach((bus) => {
        if (bus && bus.gain) {
          bus.gain.cancelScheduledValues(now);
          bus.gain.setValueAtTime(bus.gain.value, now);
          bus.gain.linearRampToValueAtTime(0.0, rampEnd);
        }
      });
    } else {
      if (this.dryGain && this.dryGain.gain) {
        this.dryGain.gain.cancelScheduledValues(now);
        this.dryGain.gain.setValueAtTime(this.dryGain.gain.value, now);
        this.dryGain.gain.linearRampToValueAtTime(0.0, rampEnd);
      }

      Object.entries(this.effectBuses).forEach(([name, bus]) => {
        if (bus && bus.gain) {
          bus.gain.cancelScheduledValues(now);
          bus.gain.setValueAtTime(bus.gain.value, now);
          const targetGainValue = name === targetFX ? 1.0 : 0.0;
          bus.gain.linearRampToValueAtTime(targetGainValue, rampEnd);
        }
      });

      if (targetFX === 'djfxLooper') {
        this.setDJFXParams(paramValue, 0.5, true);
      } else if (targetFX === 'saturation') {
        this.setSaturationParams(paramValue, 'N');
      } else if (targetFX === 'echo') {
        this.setEchoParams(paramValue, 0.4, 1200);
      } else if (targetFX === 'vocoder') {
        this.setVocoderParams(paramValue, paramValue);
      }
    }
  }

  private initializePadMappings(): void {
    for (let i = 0; i < 64; i++) {
      const hexKey = AudioGraph.getHexIdFromBank(Math.floor(i / 16), i % 16);
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