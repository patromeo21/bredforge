// ============================================================================
// STAGE C - PHASE 17: LOOK-AHEAD ANTI-DRIFT TIMER CLOCK (TrackerClock.ts)
// ============================================================================

export class TrackerClock {
  private timerId: number | null = null;
  private lookahead: number = 40.0; // ms look-ahead window
  private scheduleInterval: number = 25.0; // ms worker ticker interval
  private nextStepTime: number = 0.0;
  private currentBpm: number = 120;
  private isRunning: boolean = false;
  private callback: ((time: number) => void) | null = null;

  constructor() {}

  // ============================================================================
  // PHASE 17: HIGH-PRECISION ANTI-DRIFT LOOK-AHEAD SCHEDULER ENGINE
  // ============================================================================
  public startClock(
    audioCtx: AudioContext,
    bpm: number,
    onScheduleStep: (time: number) => void
  ): void {
    if (this.isRunning) {
      this.stopClock();
    }

    this.currentBpm = Math.max(20, Math.min(300, bpm));
    this.callback = onScheduleStep;
    this.isRunning = true;

    // Anchor starting time slightly ahead of current audio context time
    this.nextStepTime = audioCtx.currentTime + 0.05;

    const tick = () => {
      if (!this.isRunning || !audioCtx || !this.callback) {
        return;
      }

      // Calculate 16th note step duration based on current BPM
      const secondsPerStep = (60.0 / this.currentBpm) / 4.0;

      // Strict look-ahead window loop: while step time falls within lookahead buffer (40ms)
      while (this.nextStepTime < audioCtx.currentTime + (this.lookahead / 1000.0)) {
        this.callback(this.nextStepTime);
        this.nextStepTime += secondsPerStep;
      }

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
  // ============================================================================
}