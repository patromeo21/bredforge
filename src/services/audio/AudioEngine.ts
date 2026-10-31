// src/services/AudioEngine.ts

export interface PadVoice {
  buffer: AudioBuffer | null;
  start: number; // in seconds
  end: number;   // in seconds
  gain: number;  // 0.0 to 1.0
}

class AudioEngineService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private voices: Map<number, PadVoice> = new Map();
  private activeSources: Map<number, AudioBufferSourceNode> = new Map();
  private isUnlocked: boolean = false;

  constructor() {
    // Lazy init to satisfy browser autoplay policies
  }

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Initialize 16 default pad configs
    for (let i = 0; i < 16; i++) {
      this.voices.set(i, {
        buffer: null,
        start: 0,
        end: 0,
        gain: 1.0,
      });
    }
  }

  public async unlock(): Promise<void> {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.isUnlocked = true;
  }

  public async decodeAudioFile(file: File): Promise<AudioBuffer> {
    this.init();
    const arrayBuffer = await file.arrayBuffer();
    return await this.ctx!.decodeAudioData(arrayBuffer);
  }

  public setPadVoice(padIndex: number, voice: Partial<PadVoice>) {
    const current = this.voices.get(padIndex) || { buffer: null, start: 0, end: 0, gain: 1.0 };
    this.voices.set(padIndex, { ...current, ...voice });
  }

  public triggerPad(padIndex: number) {
    if (!this.ctx || !this.isUnlocked) this.unlock();
    if (!this.ctx) return;

    const voice = this.voices.get(padIndex);
    if (!voice || !voice.buffer) {
      // Fallback synthesizer click/ping if no sample loaded yet for testing
      this.triggerTestSynth(padIndex);
      return;
    }

    // Stop existing node on this pad if re-triggered (one-shot polyphonic guard)
    this.stopPad(padIndex);

    const source = this.ctx.createBufferSource();
    const padGain = this.ctx.createGain();
    
    source.buffer = voice.buffer;
    padGain.gain.setValueAtTime(voice.gain, this.ctx.currentTime);

    source.connect(padGain);
    padGain.connect(this.masterGain!);

    const duration = voice.end > voice.start ? voice.end - voice.start : voice.buffer.duration - voice.start;
    source.start(this.ctx.currentTime, voice.start, Math.max(0.01, duration));
    
    this.activeSources.set(padIndex, source);
  }

  public stopPad(padIndex: number) {
    const existing = this.activeSources.get(padIndex);
    if (existing) {
      try {
        existing.stop();
        existing.disconnect();
      } catch {
        // Node already stopped naturally
      }
      this.activeSources.delete(padIndex);
    }
  }

  private triggerTestSynth(padIndex: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Map 16 pads across a simple chromatic pitch scale for testing
    const baseFreq = 130.81; // C3
    osc.frequency.setValueAtTime(baseFreq * Math.pow(2, padIndex / 12), this.ctx.currentTime);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

export const AudioEngine = new AudioEngineService();