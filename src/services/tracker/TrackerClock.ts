// ============================================================================
// STAGE C - PHASE 20: DYNAMIC PLAYHEAD GRID FORWARD SWAPPER (TrackerClock.ts)
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
  // PHASE 20: PATTERN BOUNDARY PRE-FETCH EVENT HOOK
  // ============================================================================
  public onPreFetchNextPattern?: (line: number, tick: number) => void;
  // ============================================================================

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

      const dynamicBpm = Math.max(20, Math.min(300, this.currentBpm));
      const secondsPerTick = ((60.0 / dynamicBpm) / 4.0) / this.ticksPerLine;

      while (this.nextStepTime < audioCtx.currentTime + (this.lookahead / 1000.0)) {
        // ============================================================================
        // PHASE 20: TICK 5 ROW 15 BOUNDARY PRE-FETCH INTERCEPT
        // ============================================================================
        if (this.currentLine === 15 && this.currentTick === 5) {
          if (this.onPreFetchNextPattern) {
            this.onPreFetchNextPattern(this.currentLine, this.currentTick);
          }
        }
        // ============================================================================

        this.callback(this.nextStepTime, this.currentLine, this.currentTick);

        this.currentTick++;
        if (this.currentTick >= this.ticksPerLine) {
          this.currentTick = 0;
          this.currentLine = (this.currentLine + 1) % 16;
        }

        this.nextStepTime += secondsPerTick;
      }

      this.timerId = window.setTimeout(tick, this.scheduleInterval);
    };

    this.timerId = window.setTimeout(tick, this.scheduleInterval);
  }

  public updateTempo(newBpm: number): void {
    this.currentBpm = Math.max(20, Math.min(300, newBpm));
  }

  public updateBpm(newBpm: number): void {
    this.updateTempo(newBpm);
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