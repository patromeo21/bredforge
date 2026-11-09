// ============================================================================
// BREDFORGE v1.0 — PATTERN QUEUE MANAGER & QUANTIZATION SCHEDULER [REF: QUEUE-01]
// ============================================================================

export type QuantizationMode = 'thru' | '1_beat' | 'half_bar' | '1_bar' | '2_bars';

export class PatternQueueManager {
  private static instance: PatternQueueManager;
  
  private currentPatternId: number = 0;
  private armedPatternId: number | null = null;
  private mode: QuantizationMode = '1_bar';
  
  private bpm: number = 124.0;
  private isPlaying: boolean = false;
  private currentBeat: number = 0.0; // Fractional beat tracker (0 to 8 for 2 bars)
  
  private timerId: number | null = null;
  private lastTimestamp: number = 0;
  private onPatternSwitchCallback: ((patternId: number) => void) | null = null;
  private onStateUpdateCallback: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): PatternQueueManager {
    if (!PatternQueueManager.instance) {
      PatternQueueManager.instance = new PatternQueueManager();
    }
    return PatternQueueManager.instance;
  }

  public setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  public setMode(mode: QuantizationMode): void {
    this.mode = mode;
    if (mode === 'thru') {
      // Disarm any pending quantized queue when switching to Thru mode
      this.armedPatternId = null;
    }
    this.notifyStateUpdate();
  }

  public getMode(): QuantizationMode {
    return this.mode;
  }

  public getCurrentPattern(): number {
    return this.currentPatternId;
  }

  public getArmedPattern(): number | null {
    return this.armedPatternId;
  }

  public setOnPatternSwitch(callback: (patternId: number) => void): void {
    this.onPatternSwitchCallback = callback;
  }

  public setOnStateUpdate(callback: () => void): void {
    this.onStateUpdateCallback = callback;
  }

  private notifyStateUpdate(): void {
    if (this.onStateUpdateCallback) {
      this.onStateUpdateCallback();
    }
  }

  /**
   * Request a pattern change (triggered by user pressing a pattern pad)
   */
  public requestPatternSwitch(targetPatternId: number): void {
    if (targetPatternId === this.currentPatternId && this.armedPatternId === null) {
      return; // Already playing this pattern
    }

    if (this.mode === 'thru' || !this.isPlaying) {
      // MODE 2: "THRU MODE" or stopped -> Instantaneous switch
      this.currentPatternId = targetPatternId;
      this.armedPatternId = null;
      if (this.onPatternSwitchCallback) {
        this.onPatternSwitchCallback(targetPatternId);
      }
      console.log(`[PatternQueue] THRU MODE -> Swapped instantly to Pattern ${targetPatternId + 1}`);
    } else {
      // MODE 1: QUANTIZED QUEUE TRIGGER -> Arm target and wait for grid boundary
      this.armedPatternId = targetPatternId;
      console.log(`[PatternQueue] QUANTIZED QUEUE -> Armed Pattern ${targetPatternId + 1} (Waiting for ${this.mode})`);
    }
    this.notifyStateUpdate();
  }

  /**
   * Start master internal timing clock
   */
  public startTransport(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.currentBeat = 0;

    const tick = (timestamp: number) => {
      if (!this.isPlaying) return;

      const deltaMs = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      // 60,000 ms / BPM = milliseconds per beat
      const msPerBeat = 60000 / this.bpm;
      const beatIncrement = deltaMs / msPerBeat;

      this.currentBeat += beatIncrement;

      // 2 bars in 4/4 time = 8 beats
      if (this.currentBeat >= 8.0) {
        this.currentBeat %= 8.0;
        this.checkQuantizationBoundary('2_bars');
      }

      // Check 1 bar boundary (every 4 beats)
      if (Math.floor(this.currentBeat) % 4 === 0 && (this.currentBeat % 4) < beatIncrement) {
        this.checkQuantizationBoundary('1_bar');
      }

      // Check 1/2 bar boundary (every 2 beats)
      if (Math.floor(this.currentBeat) % 2 === 0 && (this.currentBeat % 2) < beatIncrement) {
        this.checkQuantizationBoundary('half_bar');
      }

      // Check 1 beat boundary
      if ((this.currentBeat % 1.0) < beatIncrement) {
        this.checkQuantizationBoundary('1_beat');
      }

      this.timerId = requestAnimationFrame(tick);
    };

    this.timerId = requestAnimationFrame(tick);
    console.log('[PatternQueue] Transport clock started at BPM:', this.bpm);
  }

  public stopTransport(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId !== null) {
      cancelAnimationFrame(this.timerId);
      this.timerId = null;
    }
    this.armedPatternId = null;
    this.notifyStateUpdate();
  }

  private checkQuantizationBoundary(boundaryType: QuantizationMode): void {
    if (this.armedPatternId === null) return;

    let shouldSwitch = false;

    if (this.mode === '1_beat') {
      shouldSwitch = true;
    } else if (this.mode === 'half_bar' && (boundaryType === 'half_bar' || boundaryType === '1_bar' || boundaryType === '2_bars')) {
      shouldSwitch = true;
    } else if (this.mode === '1_bar' && (boundaryType === '1_bar' || boundaryType === '2_bars')) {
      shouldSwitch = true;
    } else if (this.mode === '2_bars' && boundaryType === '2_bars') {
      shouldSwitch = true;
    }

    if (shouldSwitch) {
      this.currentPatternId = this.armedPatternId;
      const executedPattern = this.armedPatternId;
      this.armedPatternId = null;

      if (this.onPatternSwitchCallback) {
        this.onPatternSwitchCallback(executedPattern);
      }
      console.log(`[PatternQueue] Quantization boundary met (${boundaryType}) -> Switched to Pattern ${executedPattern + 1}`);
      this.notifyStateUpdate();
    }
  }
}

export const patternQueueManager = PatternQueueManager.getInstance();
