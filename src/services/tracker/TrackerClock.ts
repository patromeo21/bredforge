// ============================================================================
// STAGE C - PHASE 18: TICKS-PER-LINE BACKGROUND SUB-CLOCK (TrackerClock.ts)
// ============================================================================

export class TrackerClock {
  private timerId: number | null = null;
  private lookahead: number = 40.0; // ms look-ahead window
  private scheduleInterval: number = 25.0; // ms worker ticker interval
  private nextStepTime: number = 0.0;
  private currentBpm: number = 120;
  private isRunning: boolean = false;
  private callback: ((time: number, line: number, tick: number) => void) | null = null;

  // ============================================================================
  // PHASE 18: TICKS-PER-LINE (TPL) SUB-CLOCK COORDINATES
  // ============================================================================
  public currentTick: number = 0;
  public currentLine: number = 0;
  public ticksPerLine: number = 6; // M8 Specification: 6 ticks per line subdivision
  // ============================================================================

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

    // Reset playhead sub-clock coordinates on start
    this.currentLine = 0;
    this.currentTick = 0;

    // Anchor starting time slightly ahead of current audio context time
    this.nextStepTime = audioCtx.currentTime + 0.05;

    const tick = () => {
      if (!this.isRunning || !audioCtx || !this.callback) {
        return;
      }

      // ============================================================================
      // PHASE 18: SUB-STEP MATHEMATICAL STEPPER (Fractional TPL Tick Interval)
      // ============================================================================
      const secondsPerTick = ((60.0 / this.currentBpm) / 4.0) / this.ticksPerLine;

      // Strict look-ahead window loop: while tick time falls within lookahead buffer (40ms)
      while (this.nextStepTime < audioCtx.currentTime + (this.lookahead / 1000.0)) {
        this.callback(this.nextStepTime, this.currentLine, this.currentTick);

        // Advance tick and relational playhead timeline wrap
        this.currentTick++;
        if (this.currentTick >= this.ticksPerLine) {
          this.currentTick = 0;
          this.currentLine = (this.currentLine + 1) % 16; // 16-step phrase line loop
        }

        this.nextStepTime += secondsPerTick;
      }
      // ============================================================================

      this.timerId = window.setTimeout(tick, this.scheduleInterval);
    };

    this.timerId = window.setTimeout(tick, this.scheduleInterval);
  }

  public updateBpm(newBpm: number): void {
    this.currentBpm = Math.max(20, Math.min(300, newBpm));
  }

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