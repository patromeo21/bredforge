// ============================================================================
// BREDFORGE v1.0 — SEQUENCER AUDIO BRIDGE & MASTER BUS (SequencerAudioBridge.ts)
// ============================================================================

import { AudioInstrumentChannel } from './AudioInstrumentChannel';
import { PunchInEffectBus } from './PunchInEffectBus';
import { SaturationBus } from './SaturationBus';
import { AudioVisualizerService } from './AudioVisualizerService';

export class SequencerAudioBridge {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private saturationBus: SaturationBus;
  private punchInBus: PunchInEffectBus;
  private visualizerService: AudioVisualizerService;
  private channels: Map<string | number, AudioInstrumentChannel> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.masterGain = this.ctx.createGain();
    this.saturationBus = new SaturationBus(this.ctx);
    this.punchInBus = new PunchInEffectBus(this.ctx);
    this.visualizerService = new AudioVisualizerService(this.ctx);

    // Master Audio Chain: Master Gain -> Saturation Bus -> Punch-In Bus -> Visualizer -> Speakers
    this.masterGain.connect(this.saturationBus.getInputNode());
    this.saturationBus.connect(this.punchInBus.getInputNode());
    this.punchInBus.connect(this.visualizerService.getAnalyserNode());
    this.visualizerService.getAnalyserNode().connect(this.ctx.destination);

    this.masterGain.gain.value = 0.8;

    // Initialize default channel
    this.channels.set('channel-1', new AudioInstrumentChannel(this.ctx, this.masterGain));
    this.channels.set(0, new AudioInstrumentChannel(this.ctx, this.masterGain));
  }

  public getVisualizerService(): AudioVisualizerService {
    return this.visualizerService;
  }

  public triggerVoice(channelKey: string | number = 'channel-1', noteOrFreq: string | number = 440, duration: number = 0.2): void {
    if (!this.channels.has(channelKey)) {
      this.channels.set(channelKey, new AudioInstrumentChannel(this.ctx, this.masterGain));
    }
    const channel = this.channels.get(channelKey);
    if (channel) {
      const freq = typeof noteOrFreq === 'number' ? noteOrFreq : 440;
      channel.trigger(freq, duration);
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