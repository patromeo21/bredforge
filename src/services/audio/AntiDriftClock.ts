// ============================================================================
// STAGE C - PHASE 14: HIGH-PRECISION ANTI-DRIFT LOOK-AHEAD SCHEDULER CLOCK
// ============================================================================

export class AntiDriftClock {
  private audioCtx: AudioContext;
  private bpm: number;
  private onStepTick: (stepIndex: number) => void;
  
  private timerId: any = null;
  private nextStepTime: number = 0.0;
  private currentStepIndex: number = 0;
  
  // Look-ahead scheduling intervals in milliseconds
  private readonly lookAheadMs = 25.0;
  private readonly scheduleAheadTimeSec = 0.05;

  constructor(audioCtx: AudioContext, bpm: number, onStepTick: (stepIndex: number) => void) {
    this.audioCtx = audioCtx;
    this.bpm = bpm;
    this.onStepTick = onStepTick;
  }

  public setBpm(newBpm: number): void {
    this.bpm = newBpm;
  }

  public start(): void {
    if (this.timerId !== null) return;
    
    // Synchronize starting timeline anchor with the hardware clock
    this.nextStepTime = this.audioCtx.currentTime;
    this.currentStepIndex = 0;
    
    this.timerId = setInterval(() => this.schedulerLoop(), this.lookAheadMs);
  }

  public stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private schedulerLoop(): void {
    // Schedule notes for any step falling within our safe ahead-time window
    while (this.nextStepTime < this.audioCtx.currentTime + this.scheduleAheadTimeSec) {
      this.dispatchStepTick(this.currentStepIndex, this.nextStepTime);
      this.advanceToNextStep();
    }
  }

  private dispatchStepTick(stepIdx: number, timePosition: number): void {
    // Fire the tick callback on the main JavaScript thread to move the UI playhead
    this.onStepTick(stepIdx);
  }

  private advanceToNextStep(): void {
    // Standard 16th note subdivision math based on active project BPM
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPerStep = 0.25 * secondsPerBeat; 
    
    this.nextStepTime += secondsPerStep;
    this.currentStepIndex = (this.currentStepIndex + 1) % 16;
  }
}
