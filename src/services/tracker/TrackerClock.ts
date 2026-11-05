// ============================================================================
// STAGE C - PHASE 19: DYNAMIC SECONDS-PER-TICK SCALER (TrackerClock.ts)
// ============================================================================

export class TrackerClock {
  private timerId: number | null = null;
  private lookahead: number = 40.0; // ms look-ahead window
  private scheduleInterval: number = 25.0; // ms worker ticker interval
  private nextStepTime: number = 0.0;
  private currentBpm: number = 120;
  private isRunning: boolean = false;
  private callback: ((time: number, line: number, tick: number) => void) | null = null;

  // TPL Sub-Clock Coordinates
  public currentTick: number = 0;
  public currentLine: number = 0;
  public ticksPerLine: number = 6;

  constructor() {}

  public startClock(
    audioCtx: AudioContext,
    bpm: number,
    onScheduleStep: (time: number, line: number, tick: number) => void
  ): void {
    if (this.isRunning) {
      this.stopClock();
    }

    this.currentBpm = Math.max(20, Math.min(300, bpm));
    this.callback = onScheduleStep;
    this.isRunning = true;

    this.currentLine = 0;
    this.currentTick = 0;
    this.nextStepTime = audioCtx.currentTime + 0.05;

    const tick = () => {
      if (!this.isRunning || !audioCtx || !this.callback) {
        return;
      }

      // ============================================================================
      // PHASE 19: DYNAMIC SECONDS-PER-TICK SCALER (Live BPM Evaluation)
      // ============================================================================
      const dynamicBpm = Math.max(20, Math.min(300, this.currentBpm));
      const secondsPerTick = ((60.0 / dynamicBpm) / 4.0) / this.ticksPerLine;

      // Strict look-ahead window loop: evaluates dynamic timing on every iteration
      while (this.nextStepTime < audioCtx.currentTime + (this.lookahead / 1000.0)) {
        this.callback(this.nextStepTime, this.currentLine, this.currentTick);

        this.currentTick++;
        if (this.currentTick >= this.ticksPerLine) {
          this.currentTick = 0;
          this.currentLine = (this.currentLine + 1) % 16;
        }

        this.nextStepTime += secondsPerTick;
      }
      // ============================================================================

      this.timerId = window.setTimeout(tick, this.scheduleInterval);
    };

    this.timerId = window.setTimeout(tick, this.scheduleInterval);
  }

  // ============================================================================
  // PHASE 19: PUBLIC TEMPO MODIFIER HOOK
  // ============================================================================
  public updateTempo(newBpm: number): void {
    this.currentBpm = Math.max(20, Math.min(300, newBpm));
  }

  public updateBpm(newBpm: number): void {
    this.updateTempo(newBpm);
  }
  // ============================================================================

  public stopClock(): void {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.callback = null;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}