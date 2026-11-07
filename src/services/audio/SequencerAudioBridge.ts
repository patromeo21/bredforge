// ============================================================================
// BREDFORGE v1.0 — SEQUENCER AUDIO BRIDGE & MASTER BUS (SequencerAudioBridge.ts)
// ============================================================================

import { AudioInstrumentChannel } from './AudioInstrumentChannel';
import { PunchInEffectBus } from './PunchInEffectBus';
import { SaturationBus } from './SaturationBus';

export class SequencerAudioBridge {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private saturationBus: SaturationBus;
  private punchInBus: PunchInEffectBus;
  private channels: Map<number, AudioInstrumentChannel> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.masterGain = this.ctx.createGain();
    this.saturationBus = new SaturationBus(this.ctx);
    this.punchInBus = new PunchInEffectBus(this.ctx);

    // Master Audio Chain: Master Gain -> Saturation Bus -> Punch-In Bus -> Speakers
    this.masterGain.connect(this.saturationBus.getInputNode());
    this.saturationBus.connect(this.punchInBus.getInputNode());
    this.punchInBus.connect(this.ctx.destination);

    this.masterGain.gain.value = 0.8;

    // Initialize default channel 0
    this.channels.set(0, new AudioInstrumentChannel(this.ctx, this.masterGain));
  }

  // Implementation signature explicitly allows string | number for frequencyOrNote
  public triggerVoice(channelId: number = 0, frequencyOrNote: number | string = 440, duration: number = 0.2): void {
    if (!this.channels.has(channelId)) {
      this.channels.set(channelId, new AudioInstrumentChannel(this.ctx, this.masterGain));
    }
    const channel = this.channels.get(channelId);
    if (channel) {
      const freq = typeof frequencyOrNote === 'number' ? frequencyOrNote : 440;
      const dur = typeof duration === 'number' ? duration : 0.2;
      channel.trigger(freq, dur);
    }
  }

  public getMasterOutput(): GainNode {
    return this.masterGain;
  }

  public getPunchInBus(): PunchInEffectBus {
    return this.punchInBus;
  }

  public getSaturationBus(): SaturationBus {
    return this.saturationBus;
  }

  public setMasterVolume(volume: number): void {
    this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1.0, volume)), this.ctx.currentTime);
  }

  public dispose(): void {
    this.masterGain.disconnect();
    this.saturationBus.dispose();
    this.punchInBus.dispose();
    this.channels.forEach(ch => ch.dispose());
    this.channels.clear();
  }
}