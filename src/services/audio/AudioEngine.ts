// ============================================================================
// BREDFORGE v1.0 — CORE WEB AUDIO DSP ENGINE [REF: AUDIO-01]
// ============================================================================

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Lazy initialization upon user gesture
  }

  public async initAudio(): Promise<boolean> {
    if (this.isInitialized && this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      return true;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.85;

      // Master Limiter / Compressor for safety
      this.masterLimiter = this.audioCtx.createCompressor();
      this.masterLimiter.threshold.setValueAtTime(-2.0, this.audioCtx.currentTime);
      this.masterLimiter.knee.setValueAtTime(0.0, this.audioCtx.currentTime);
      this.masterLimiter.ratio.setValueAtTime(20.0, this.audioCtx.currentTime);
      this.masterLimiter.attack.setValueAtTime(0.005, this.audioCtx.currentTime);
      this.masterLimiter.release.setValueAtTime(0.05, this.audioCtx.currentTime);

      // Analyser Node for 120fps Oscilloscope
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Wire Chain: MasterGain -> MasterLimiter -> Analyser -> Destination
      this.masterGain.connect(this.masterLimiter);
      this.masterLimiter.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
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
