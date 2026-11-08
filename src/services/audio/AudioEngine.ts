// ============================================================================
// BREDFORGE v1.0 — DECOUPLED WEB AUDIO API ENGINE (AudioEngine.ts)
// ============================================================================

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;
  private bpm: number = 125;
  private timerId: number | null = null;
  private currentStep: number = 0;
  private stepListeners: Set<(step: number) => void> = new Set();

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  public init(): boolean {
    if (this.ctx) return true;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      console.log('[AudioEngine] Initialized successfully. Sample rate:', this.ctx.sampleRate);
      return true;
    } catch (err) {
      console.error('[AudioEngine] Failed to initialize AudioContext:', err);
      return false;
    }
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(40, Math.min(300, newBpm));
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  public getBpm(): number {
    return this.bpm;
  }

  public start() {
    if (this.isRunning) return;
    this.init();
    this.resume();

    this.isRunning = true;
    const intervalMs = (60 / this.bpm / 4) * 1000; // 16th note interval

    this.timerId = window.setInterval(() => {
      this.stepListeners.forEach(listener => listener(this.currentStep));
      this.currentStep = (this.currentStep + 1) % 64; // 64 step pattern cycle
    }, intervalMs);

    console.log(`[AudioEngine] Transport started at ${this.bpm} BPM`);
  }

  public stop() {
    if (!this.isRunning) return;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
    this.currentStep = 0;
    console.log('[AudioEngine] Transport stopped');
  }

  public togglePlay(): boolean {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
    return this.isRunning;
  }

  public subscribeStep(listener: (step: number) => void) {
    this.stepListeners.add(listener);
    return () => {
      this.stepListeners.delete(listener);
    };
  }

  public triggerTestBeep() {
    if (!this.ctx || !this.masterGain) {
      this.init();
    }
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
}

export const audioEngine = new AudioEngine();