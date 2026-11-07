// ============================================================================
// BREDFORGE v1.0 — AUDIO INSTRUMENT CHANNEL (AudioInstrumentChannel.ts)
// ============================================================================

export class AudioInstrumentChannel {
  private ctx: AudioContext;
  private outputNode: GainNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.outputNode = this.ctx.createGain();
    this.outputNode.connect(destination);
    this.outputNode.gain.value = 1.0;
  }

  public trigger(frequency: number = 440, duration: number = 0.2): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.outputNode);

    osc.start(now);
    osc.stop(now + duration);
  }

  public dispose(): void {
    this.outputNode.disconnect();
  }
}

// Export alias for backward compatibility across modules
export type InstrumentChannel = AudioInstrumentChannel;