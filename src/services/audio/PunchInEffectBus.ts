// ============================================================================
// BREDFORGE v1.0 — SP-404SX PUNCH-IN DSP EFFECT BUS (PunchInEffectBus.ts)
// ============================================================================

export type PunchEffectType = 
  | 'NONE' 
  | 'ISOLATOR' 
  | 'DJFX_LOOPER' 
  | 'FILTER' 
  | 'REVERB'
  | 'filterSlam'
  | 'bitcrush'
  | 'ringmod'
  | 'delay';

export type PunchInEffectType = PunchEffectType; // Alias for compatibility

export class PunchInEffectBus {
  private ctx: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  
  // DSP Effect Nodes
  private filterNode: BiquadFilterNode;
  private looperNode: GainNode;
  private activeEffect: PunchEffectType = 'NONE';

  constructor(ctx: AudioContext, destination?: AudioNode) {
    this.ctx = ctx;
    
    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000;

    this.looperNode = this.ctx.createGain();
    this.looperNode.gain.value = 0.0;

    this.inputNode.connect(this.outputNode);
    if (destination) {
      this.outputNode.connect(destination);
    }
  }

  public getInputNode(): AudioNode {
    return this.inputNode;
  }

  public getOutputNode(): AudioNode {
    return this.outputNode;
  }

  public connect(destination: AudioNode): void {
    this.outputNode.connect(destination);
  }

  public dispose(): void {
    try {
      this.inputNode.disconnect();
      this.outputNode.disconnect();
      this.filterNode.disconnect();
      this.looperNode.disconnect();
    } catch (e) {
      console.warn('[PunchInEffectBus] Error during dispose:', e);
    }
  }

  public setEffect(effect: PunchEffectType): void {
    if (this.activeEffect === effect) return;

    this.inputNode.disconnect();
    this.filterNode.disconnect();
    this.looperNode.disconnect();

    this.activeEffect = effect;
    const now = this.ctx.currentTime;

    switch (effect) {
      case 'FILTER':
      case 'filterSlam':
        this.inputNode.connect(this.filterNode);
        this.filterNode.frequency.setTargetAtTime(800, now, 0.02);
        this.filterNode.connect(this.outputNode);
        break;

      case 'DJFX_LOOPER':
      case 'bitcrush':
      case 'ringmod':
        this.inputNode.connect(this.looperNode);
        this.looperNode.gain.setTargetAtTime(0.7, now, 0.01);
        this.looperNode.connect(this.outputNode);
        this.inputNode.connect(this.outputNode);
        break;

      case 'NONE':
      default:
        this.filterNode.frequency.setTargetAtTime(20000, now, 0.02);
        this.inputNode.connect(this.outputNode);
        break;
    }
  }

  public triggerPunchIn(effect: PunchEffectType, active: boolean): void {
    this.setEffect(active ? effect : 'NONE');
  }

  public getActiveEffect(): PunchEffectType {
    return this.activeEffect;
  }
}