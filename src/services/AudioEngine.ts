// ============================================================================
// BREDFORGE v1.0 — REAL-TIME WEB AUDIO DSP & MASTER BUS ENGINE [REF: AUDIO-01]
// ============================================================================

export class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initialize AudioContext and Master Chain (Required for iOS Safari user gesture unlock)
   */
  public async initAudio(): Promise<boolean> {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master Limiter to prevent clipping on heavy polyphony
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
      this.limiter.knee.setValueAtTime(0.0, this.ctx.currentTime);
      this.limiter.ratio.setValueAtTime(20.0, this.ctx.currentTime);
      this.limiter.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.limiter.release.setValueAtTime(0.05, this.ctx.currentTime);

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      // Connect Chain: MasterGain -> Limiter -> Destination
      this.masterGain.connect(this.limiter);
      this.limiter.connect(this.ctx.destination);

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.isInitialized = true;
      console.log('[AudioEngine] Web Audio context initialized successfully at sample rate:', this.ctx.sampleRate);
      return true;
    } catch (err) {
      console.error('[AudioEngine] Failed to initialize AudioContext:', err);
      return false;
    }
  }

  /**
   * Set Master Volume (0.0 to 1.0)
   */
  public setMasterVolume(volume: number): void {
    if (!this.ctx || !this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.01);
  }

  /**
   * Set Master Limiter Threshold in dB (-40 to 0)
   */
  public setMasterLimiterThreshold(threshold: number): void {
    if (!this.ctx || !this.limiter) return;
    this.limiter.threshold.setTargetAtTime(threshold, this.ctx.currentTime, 0.01);
  }

  /**
   * Set Master Limiter Compression Ratio (1 to 20)
   */
  public setMasterLimiterRatio(ratio: number): void {
    if (!this.ctx || !this.limiter) return;
    this.limiter.ratio.setTargetAtTime(ratio, this.ctx.currentTime, 0.01);
  }

  /**
   * Trigger a synthesized tracker voice mapped to pad index (0 - 15)
   */
  public triggerPad(padIndex: number, velocity: number = 100): void {
    if (!this.ctx || !this.masterGain) {
      this.initAudio().then(() => this.triggerPad(padIndex, velocity));
      return;
    }

    const now = this.ctx.currentTime;
    const velGain = (velocity / 127) * 0.7;
    const voiceGain = this.ctx.createGain();
    voiceGain.connect(this.masterGain);

    if (padIndex >= 0 && padIndex <= 3) {
      // KICK / SUB BASS (Pads 1-4)
      const osc = this.ctx.createOscillator();
      const freq = padIndex === 0 ? 130 : padIndex === 1 ? 110 : padIndex === 2 ? 90 : 75;
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);

      voiceGain.gain.setValueAtTime(velGain, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(voiceGain);
      osc.start(now);
      osc.stop(now + 0.3);

    } else if (padIndex >= 4 && padIndex <= 7) {
      // SNARE / CLAP (Pads 5-8)
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(1000, now);

      voiceGain.gain.setValueAtTime(velGain * 0.8, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(voiceGain);
      noise.connect(noiseFilter);
      noiseFilter.connect(voiceGain);

      osc.start(now);
      osc.stop(now + 0.15);
      noise.start(now);
      noise.stop(now + 0.15);

    } else if (padIndex >= 8 && padIndex <= 11) {
      // HI-HATS / PERC (Pads 9-12)
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, now);

      voiceGain.gain.setValueAtTime(velGain * 0.5, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(voiceGain);

      noise.start(now);
      noise.stop(now + 0.05);

    } else {
      // SYNTH CHORDS / LEADS (Pads 13-16)
      const osc = this.ctx.createOscillator();
      const baseFreq = 261.63; // C4
      const offsets = [1, 1.25, 1.5, 2];
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq * offsets[padIndex - 12], now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.25);

      voiceGain.gain.setValueAtTime(velGain * 0.4, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(filter);
      filter.connect(voiceGain);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  /**
   * Flexible playSlice overload supporting AudioBuffers and pad index numbers
   */
  public playSlice(
    sliceIndexOrBuffer: number | AudioBuffer,
    pitchOrStart: number = 0,
    startPosOrEnd: number = 0,
    endPos: number = 1
  ): void {
    if (!this.ctx || !this.masterGain) {
      this.initAudio().then(() => this.playSlice(sliceIndexOrBuffer, pitchOrStart, startPosOrEnd, endPos));
      return;
    }

    if (typeof sliceIndexOrBuffer === 'number') {
      this.triggerPad(sliceIndexOrBuffer % 16, 110);
    } else {
      const source = this.ctx.createBufferSource();
      source.buffer = sliceIndexOrBuffer;
      source.playbackRate.setValueAtTime(Math.pow(2, pitchOrStart / 12), this.ctx.currentTime);
      source.connect(this.masterGain);
      source.start();
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
