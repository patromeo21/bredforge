// ============================================================================
// BREDFORGE v1.0 — SP-STYLE PUNCH-IN EFFECT BUS (PunchInEffectBus.ts)
// ============================================================================

export type PunchInEffectType = 'filterSlam' | 'bitcrush' | 'stutter' | 'tapeStop';

export class PunchInEffectBus {
  private ctx: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private filterNode: BiquadFilterNode;
  private activeEffects: Set<PunchInEffectType> = new Set();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();
    this.filterNode = this.ctx.createBiquadFilter();

    this.inputNode.connect(this.filterNode);
    this.filterNode.connect(this.outputNode);

    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000;
    this.filterNode.Q.value = 4.0;
  }

  public getInputNode(): AudioNode {
    return this.inputNode;
  }

  public connect(destination: AudioNode): void {
    this.outputNode.connect(destination);
  }

  public triggerPunchIn(effect: PunchInEffectType, active: boolean): void {
    const now = this.ctx.currentTime;
    
    if (active) {
      this.activeEffects.add(effect);
      if (effect === 'filterSlam') {
        this.filterNode.frequency.cancelScheduledValues(now);
        this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, now);
        this.filterNode.frequency.exponentialRampToValueAtTime(250, now + 0.04);
      }
    } else {
      this.activeEffects.delete(effect);
      if (effect === 'filterSlam') {
        this.filterNode.frequency.cancelScheduledValues(now);
        this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, now);
        this.filterNode.frequency.exponentialRampToValueAtTime(20000, now + 0.06);
      }
    }
  }

  public isEffectActive(effect: PunchInEffectType): boolean {
    return this.activeEffects.has(effect);
  }

  public dispose(): void {
    this.inputNode.disconnect();
    this.filterNode.disconnect();
    this.outputNode.disconnect();
    this.activeEffects.clear();
  }
}