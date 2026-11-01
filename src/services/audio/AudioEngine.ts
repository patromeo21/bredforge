import { PlayMode, ChokeGroup, PadConfig, ActiveVoice } from './types';

class AudioEngineService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeVoices: Map<string, ActiveVoice> = new Map();

  // Map pad indices (0-15) to their configuration parameters
  private padConfigs: Map<number, PadConfig> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs() {
    for (let i = 0; i < 16; i++) {
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

  /**
   * Triggers a pad event with full polyphony, choke group resolution, and pointerId binding
   */
  public triggerPad(padIndex: number, pointerId?: number): string {
    const ctx = this.getContext();
    const config = this.getPadConfig(padIndex);

    // 1. Resolve Choke Groups (mute group killing)
    if (config.chokeGroup > 0) {
      this.chokeGroupVoices(config.chokeGroup);
    }

    // 2. Setup voice nodes
    const osc = ctx.createOscillator();
    const voiceGain = ctx.createGain();

    // Map pad Index to distinct pitch frequencies for testing
    const baseFreq = 130.81; // C3
    const freq = baseFreq * Math.pow(2, (padIndex + config.pitchSemiTones) / 12);
    osc.type = padIndex % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    voiceGain.gain.setValueAtTime(config.gain, ctx.currentTime);
    osc.connect(voiceGain);
    if (this.masterGain) {
      voiceGain.connect(this.masterGain);
    }

    const voiceId = `${padIndex}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const activeVoice: ActiveVoice = {
      id: voiceId,
      padIndex,
      pointerId,
      chokeGroup: config.chokeGroup,
      sourceNode: osc as unknown as AudioBufferSourceNode,
      gainNode: voiceGain,
      startTime: ctx.currentTime,
    };

    this.activeVoices.set(voiceId, activeVoice);

    // 3. Audio Node Lifecycle & Memory Leak Cleanup
    osc.onended = () => {
      voiceGain.disconnect();
      this.activeVoices.delete(voiceId);
    };

    osc.start(ctx.currentTime);

    // If one-shot test synth, automatically stop after 0.5s if not released early by gate/choke
    if (config.playMode === 'oneShot') {
      osc.stop(ctx.currentTime + 0.5);
    }

    return voiceId;
  }

  /**
   * Releases voices tied to a specific pad or pointerId for Gate mode
   */
  public releasePad(padIndex: number, pointerId?: number): void {
    if (!this.ctx) return;
    const config = this.getPadConfig(padIndex);

    // Only Gate mode responds to touch release
    if (config.playMode !== 'gate') return;

    const now = this.ctx.currentTime;

    this.activeVoices.forEach((voice, voiceId) => {
      const matchesPointer = pointerId !== undefined ? voice.pointerId === pointerId : true;
      if (voice.padIndex === padIndex && matchesPointer) {
        // Fast release envelope ramp (15ms) to prevent digital pops
        voice.gainNode.gain.cancelScheduledValues(now);
        voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
        voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
        
        try {
          (voice.sourceNode as unknown as OscillatorNode).stop(now + 0.02);
        } catch {
          // Node already stopped
        }
        this.activeVoices.delete(voiceId);
      }
    });
  }

  /**
   * Stops all active voices belonging to a specific Choke Group
   */
  private chokeGroupVoices(chokeGroup: ChokeGroup): void {
    if (!this.ctx || chokeGroup === 0) return;
    const now = this.ctx.currentTime;

    this.activeVoices.forEach((voice, voiceId) => {
      if (voice.chokeGroup === chokeGroup) {
        voice.gainNode.gain.cancelScheduledValues(now);
        voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
        voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.005);
        try {
          (voice.sourceNode as unknown as OscillatorNode).stop(now + 0.006);
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