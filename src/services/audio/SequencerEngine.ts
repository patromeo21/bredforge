// ============================================================================
// BREDFORGE v1.0 — TRACKER SEQUENCER ENGINE (SequencerEngine.ts)
// ============================================================================

export interface TrackerStep {
  stepIndex: number;
  note: string;       // e.g., "C-4", "---"
  instrument: number; // e.g., 1-8 (matching mixer/track channels)
  volume: number;     // e.g., 0-64 velocity/volume
  fx1: string;        // e.g., "V04" (Volume), "S01" (Slice)
  fx2: string;        // e.g., "F08" (Filter), "L02" (Loop/FX)
}

export type StepTriggerCallback = (step: TrackerStep, row: number) => void;
export type CursorCallback = (step: number) => void;

export class SequencerEngine {
  private audioContext: AudioContext;
  private bpm: number = 120;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private totalSteps: number = 64; // Standard tracker phrase length (00-3F hex / 0-63 dec)
  private timerId: number | null = null;
  
  private onStepCallback: StepTriggerCallback | null = null;
  private cursorCallbacks: CursorCallback[] = [];

  constructor(audioContext: AudioContext, bpm: number = 120) {
    this.audioContext = audioContext;
    this.bpm = bpm;
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(40, Math.min(300, newBpm));
  }

  public setOnStep(callback: StepTriggerCallback) {
    this.onStepCallback = callback;
  }

  public subscribeCursor(callback: CursorCallback): () => void {
    this.cursorCallbacks.push(callback);
    return () => {
      this.cursorCallbacks = this.cursorCallbacks.filter(cb => cb !== callback);
    };
  }

  public start(currentPhraseSteps: TrackerStep[]) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.scheduleNextStep(currentPhraseSteps);
    console.log(`[SequencerEngine] Started at ${this.bpm} BPM.`);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentStep = 0;
    // Notify cursor subscribers of reset
    this.notifyCursorSubscribers(0);
    console.log('[SequencerEngine] Stopped and reset.');
  }

  private scheduleNextStep(currentPhraseSteps: TrackerStep[]) {
    if (!this.isPlaying) return;

    // Calculate exact 16th-note interval in milliseconds based on BPM: (60s / BPM) / 4 * 1000
    const intervalMs = (60000 / this.bpm) / 4;

    // Retrieve step data for the current row
    const stepData = currentPhraseSteps[this.currentStep] || {
      stepIndex: this.currentStep,
      note: '---',
      instrument: 0,
      volume: 64,
      fx1: '---',
      fx2: '---'
    };

    // 1. Trigger audio playback & bridge callbacks
    if (this.onStepCallback) {
      this.onStepCallback(stepData, this.currentStep);
    }

    // 2. Notify UI cursor subscribers
    this.notifyCursorSubscribers(this.currentStep);

    // Advance step pointer cyclically through the phrase
    this.currentStep = (this.currentStep + 1) % this.totalSteps;

    // Schedule next step precisely
    this.timerId = window.setTimeout(() => {
      this.scheduleNextStep(currentPhraseSteps);
    }, intervalMs);
  }

  private notifyCursorSubscribers(stepIndex: number) {
    for (let i = 0; i < this.cursorCallbacks.length; i++) {
      this.cursorCallbacks[i](stepIndex);
    }
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      bpm: this.bpm
    };
  }
}