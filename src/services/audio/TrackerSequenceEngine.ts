// ============================================================================
// BREDFORGE v1.0 — TRACKER SEQUENCE ENGINE & LOOKAHEAD SCHEDULER [REF: M43]
// ============================================================================

export interface StepEvent {
  step: number;
  sampleId: string | number;
  note: number;
  velocity: number;
  active: boolean;
}

export class TrackerSequenceEngine {
  private bpm: number = 125;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private timerId: number | null = null;
  private lookahead: number = 25.0; // Milliseconds
  private scheduleAheadTime: number = 0.1; // Seconds
  private nextNoteTime: number = 0.0;
  private onStepCallback?: (step: number) => void;

  constructor(bpm: number = 125) {
    this.bpm = bpm;
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(300, bpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public setOnStep(callback: (step: number) => void) {
    this.onStepCallback = callback;
  }

  private getSecondsPerStep(): number {
    // 16th note steps per beat (4 steps per beat)
    const secondsPerBeat = 60.0 / this.bpm;
    return secondsPerBeat / 4;
  }

  public start(ctx: AudioContext) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.timerId = window.setInterval(() => {
      this.scheduler(ctx);
    }, this.lookahead);

    console.log(`[TrackerSequenceEngine] Started transport at ${this.bpm} BPM.`);
  }

  private scheduler(ctx: AudioContext) {
    while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }
  }

  private advanceStep() {
    const secondsPerStep = this.getSecondsPerStep();
    this.nextNoteTime += secondsPerStep;
    this.currentStep = (this.currentStep + 1) % 64; // 64-step pattern grid
  }

  private scheduleStep(step: number, time: number) {
    // Trigger visual step indicator updates on main thread
    if (this.onStepCallback) {
      setTimeout(() => {
        this.onStepCallback!(step);
      }, Math.max(0, (time - audioContextTime()) * 1000));
    }
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    console.log('[TrackerSequenceEngine] Stopped transport.');
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

function audioContextTime(): number {
  return window.performance.now() / 1000;
}

export const trackerSequenceEngine = new TrackerSequenceEngine();