// ============================================================================
// BREDFORGE v1.0 — CORE WEB AUDIO DSP ENGINE [REF: AUDIO-01]
// ============================================================================

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized: boolean = false;

  constructor() {}

  public async initAudio(): Promise<boolean> {
    if (this.isInitialized && this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass() as AudioContext;
      this.audioCtx = ctx;

      const gain = ctx.createGain();
      gain.gain.value = 0.85;
      this.masterGain = gain;

      const compressor = (ctx as any).createCompressor ? (ctx as any).createCompressor() : ctx.createGain();
      if (compressor.threshold) {
        compressor.threshold.setValueAtTime(-2.0, ctx.currentTime);
        compressor.knee.setValueAtTime(0.0, ctx.currentTime);
        compressor.ratio.setValueAtTime(20.0, ctx.currentTime);
        compressor.attack.setValueAtTime(0.005, ctx.currentTime);
        compressor.release.setValueAtTime(0.05, ctx.currentTime);
      }
      this.masterLimiter = compressor;

      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      an.smoothingTimeConstant = 0.8;
      this.analyser = an;

      gain.connect(compressor);
      compressor.connect(an);
      an.connect(ctx.destination);

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
      return false;
    }
  }

  public async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer | null> {
    if (!this.audioCtx) {
      await this.initAudio();
    }
    if (!this.audioCtx) return null;
    try {
      return await this.audioCtx.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.error('Error decoding audio data:', err);
      return null;
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  // --- Mixer & Limiter Control Setters for MixerView.tsx ---

  public setMasterVolume(value: number): void {
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, value)), this.audioCtx.currentTime);
    }
  }

  public setMasterLimiterThreshold(value: number): void {
    if (this.masterLimiter && this.masterLimiter.threshold && this.audioCtx) {
      this.masterLimiter.threshold.setValueAtTime(value, this.audioCtx.currentTime);
    }
  }

  public setMasterLimiterRatio(value: number): void {
    if (this.masterLimiter && this.masterLimiter.ratio && this.audioCtx) {
      this.masterLimiter.ratio.setValueAtTime(value, this.audioCtx.currentTime);
    }
  }

  // ---------------------------------------------------------

  public triggerPad(padIndex: number, velocity: number = 100): void {
    if (!this.audioCtx || !this.masterGain) {
      return;
    }

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const baseFreq = 110 * Math.pow(2, padIndex / 12);
      osc.type = padIndex % 4 === 0 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);

      const normalizedVelocity = Math.max(0, Math.min(127, velocity)) / 127;
      gain.gain.setValueAtTime(normalizedVelocity * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (err) {
      console.error('Error triggering pad audio:', err);
    }
  }

  public getContextState(): string {
    return this.audioCtx ? this.audioCtx.state : 'uninitialized';
  }
}

export const audioEngine = new AudioEngine();
