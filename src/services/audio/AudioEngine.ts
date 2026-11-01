import { PlayMode, ChokeGroup, PadConfig, ActiveVoice } from './types';

class AudioEngineService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeVoices: Map<string, ActiveVoice> = new Map();
  private sampleBuffers: Map<number, AudioBuffer> = new Map();

  private padConfigs: Map<number, PadConfig> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs() {
    for (let i = 0; i < 64; i++) {
      this.padConfigs.set(i, {
        padIndex: i,
        playMode: 'oneShot',
        chokeGroup: 0,
        gain: 1.0,
        pitchSemiTones: 0,
      });
    }
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public async unlock(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  public getPadConfig(padIndex: number): PadConfig {
    return this.padConfigs.get(padIndex) || {
      padIndex,
      playMode: 'oneShot',
      chokeGroup: 0,
      gain: 1.0,
      pitchSemiTones: 0,
    };
  }

  public setPadConfig(padIndex: number, config: Partial<PadConfig>): void {
    const current = this.getPadConfig(padIndex);
    this.padConfigs.set(padIndex, { ...current, ...config });
  }

  public async loadSampleToPad(padIndex: number, arrayBuffer: ArrayBuffer): Promise<void> {
    const ctx = this.getContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.sampleBuffers.set(padIndex, audioBuffer);
  }

  public getSampleBuffer(padIndex: number): AudioBuffer | undefined {
    return this.sampleBuffers.get(padIndex);
  }

  public triggerPad(padIndex: number, pointerId?: number): string {
    const ctx = this.getContext();
    const config = this.getPadConfig(padIndex);

    // 1. Resolve Choke Groups FIRST before creating the new voice
    if (config.chokeGroup > 0) {
      this.chokeGroupVoices(config.chokeGroup);
    }

    const sampleBuffer = this.sampleBuffers.get(padIndex);
    const sourceNode = ctx.createBufferSource();
    const voiceGain = ctx.createGain();

    if (sampleBuffer) {
      sourceNode.buffer = sampleBuffer;
      sourceNode.playbackRate.setValueAtTime(
        Math.pow(2, config.pitchSemiTones / 12),
        ctx.currentTime
      );
    } else {
      const fallbackBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = fallbackBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(i / 10) * Math.exp(-i / (ctx.sampleRate * 0.02));
      }
      sourceNode.buffer = fallbackBuf;
    }

    voiceGain.gain.setValueAtTime(config.gain, ctx.currentTime);
    sourceNode.connect(voiceGain);
    if (this.masterGain) {
      voiceGain.connect(this.masterGain);
    }

    const voiceId = `${padIndex}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const activeVoice: ActiveVoice = {
      id: voiceId,
      padIndex,
      pointerId,
      chokeGroup: config.chokeGroup,
      sourceNode,
      gainNode: voiceGain,
      startTime: ctx.currentTime,
    };

    // 2. Register new voice after choke resolution
    this.activeVoices.set(voiceId, activeVoice);

    sourceNode.onended = () => {
      voiceGain.disconnect();
      this.activeVoices.delete(voiceId);
    };

    sourceNode.start(ctx.currentTime);

    if (config.playMode === 'oneShot' && !sampleBuffer) {
      sourceNode.stop(ctx.currentTime + 0.05);
    }

    return voiceId;
  }

  public releasePad(padIndex: number, pointerId?: number): void {
    if (!this.ctx) return;
    const config = this.getPadConfig(padIndex);

    if (config.playMode !== 'gate') return;

    const now = this.ctx.currentTime;

    this.activeVoices.forEach((voice, voiceId) => {
      const matchesPointer = pointerId !== undefined ? voice.pointerId === pointerId : true;
      if (voice.padIndex === padIndex && matchesPointer) {
        voice.gainNode.gain.cancelScheduledValues(now);
        voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
        voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
        
        try {
          voice.sourceNode.stop(now + 0.02);
        } catch {
          // Node already stopped
        }
        this.activeVoices.delete(voiceId);
      }
    });
  }

  private chokeGroupVoices(chokeGroup: ChokeGroup): void {
    if (!this.ctx || chokeGroup === 0) return;
    const now = this.ctx.currentTime;

    this.activeVoices.forEach((voice, voiceId) => {
      if (voice.chokeGroup === chokeGroup) {
        voice.gainNode.gain.cancelScheduledValues(now);
        voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
        voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.005);
        try {
          voice.sourceNode.stop(now + 0.006);
        } catch {
          // Node already stopped
        }
        this.activeVoices.delete(voiceId);
      }
    });
  }
}

export const AudioEngine = new AudioEngineService();
export default AudioEngine;