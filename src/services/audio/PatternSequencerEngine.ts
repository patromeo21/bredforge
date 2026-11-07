// ============================================================================
// BREDFORGE v1.0 — MASTER PATTERN SEQUENCER ENGINE (PatternSequencerEngine.ts)
// ============================================================================

export interface Pattern {
  id: number;
  bank: string;
  name: string;
  steps: number[]; // e.g., 16 step triggers or note indices
}

class PatternSequencerEngine {
  private activePatternId: number = 0;
  private queuedPatternId: number | null = null;
  private currentStep: number = 0;
  private isPlaying: boolean = false;
  private listeners: ((step: number, patternId: number) => void)[] = [];

  // Register listener for UI updates / playhead ticks
  public subscribe(listener: (step: number, patternId: number) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public queuePattern(patternId: number) {
    this.queuedPatternId = patternId;
    console.log(`[PatternSequencer] Pattern ${patternId} queued for next downbeat.`);
  }

  public tick() {
    if (!this.isPlaying) return;

    // Advance 16-step grid
    this.currentStep = (this.currentStep + 1) % 16;

    // Handle quantized pattern change on loop boundary (Step 0)
    if (this.currentStep === 0 && this.queuedPatternId !== null) {
      this.activePatternId = this.queuedPatternId;
      this.queuedPatternId = null;
      console.log(`[PatternSequencer] Switched to active pattern: ${this.activePatternId}`);
    }

    // Notify listeners (UI/Audio triggers)
    this.listeners.forEach((listener) => listener(this.currentStep, this.activePatternId));
  }

  public start() {
    this.isPlaying = true;
    this.currentStep = 0;
  }

  public stop() {
    this.isPlaying = false;
    this.currentStep = 0;
  }

  public getActivePatternId(): number {
    return this.activePatternId;
  }

  public getQueuedPatternId(): number | null {
    return this.queuedPatternId;
  }
}

export const PatternSequencer = new PatternSequencerEngine();