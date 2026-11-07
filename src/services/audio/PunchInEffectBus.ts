// ============================================================================
// BREDFORGE v1.0 — SP-404SX PUNCH-IN DSP EFFECT BUS (PunchInEffectBus.ts)
// ============================================================================

export type PunchEffectType = 'NONE' | 'ISOLATOR' | 'DJFX_LOOPER' | 'FILTER' | 'REVERB';

export class PunchInEffectBus {
  private ctx: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  
  // DSP Effect Nodes
  private filterNode: BiquadFilterNode;
  private looperNode: GainNode; // Simulated buffer feedback loop
  private activeEffect: PunchEffectType = 'NONE';

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    
    // Create bus input and output nodes
    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();

    // Create intermediate DSP nodes
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000; // Open by default

    this.looperNode = this.ctx.createGain();
    this.looperNode.gain.value = 0.0; // Muted by default

    // Build initial dry signal chain: Input -> Output -> Destination
    this.inputNode.connect(this.outputNode);
    this.outputNode.connect(destination);
  }

  /**
   * Get the input node so sources (like SampleManager playback) can connect into the bus
   */
  public getInputNode(): AudioNode {
    return this.inputNode;
  }

  /**
   * Dynamically engage an SP-404SX Punch-In Effect
   */
  public setEffect(effect: PunchEffectType): void {
    if (this.activeEffect === effect) return;

    // Disconnect current routing
    this.inputNode.disconnect();
    this.filterNode.disconnect();
    this.looperNode.disconnect();

    this.activeEffect = effect;
    const now = this.ctx.currentTime;

    switch (effect) {
      case 'FILTER':
        // Route through Lowpass Filter (e.g., Isolator / DJ filter knob)
        this.inputNode.connect(this.filterNode);
        this.filterNode.frequency.setTargetAtTime(1000, now, 0.02); // Cutoff sweep
        this.filterNode.connect(this.outputNode);
        console.log('[PunchInEffectBus] Engaged: FILTER');
        break;

      case 'DJFX_LOOPER':
        // Route through feedback loop
        this.inputNode.connect(this.looperNode);
        this.looperNode.gain.setTargetAtTime(0.7, now, 0.01);
        this.looperNode.connect(this.outputNode);
        this.inputNode.connect(this.outputNode);
        console.log('[PunchInEffectBus] Engaged: DJFX_LOOPER');
        break;

      case 'NONE':
      default:
        // Pure dry passthrough
        this.filterNode.frequency.setTargetAtTime(20000, now, 0.02);
        this.inputNode.connect(this.outputNode);
        console.log('[PunchInEffectBus] Engaged: DRY (NONE)');
        break;
    }
  }

  public getActiveEffect(): PunchEffectType {
    return this.activeEffect;
  }
}