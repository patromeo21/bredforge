// ============================================================================
// BREDFORGE v1.0 — MASTER TRANSPORT & CLOCK ENGINE [REF: TRANSPORT-01]
// ============================================================================

import { audioEngine } from './AudioEngine';

type TickCallback = (step: number, row: number, pattern: number) => void;
type StateCallback = (isPlaying: boolean) => void;

export class TransportService {
  private bpm: number = 120;
  private rowsPerBeat: number = 4;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private currentRow: number = 0;
  private currentPattern: number = 0;
  
  private timerId: number | null = null;
  private nextNoteTime: number = 0.0;
  private tickSubscribers: Set<TickCallback> = new Set();
  private stateSubscribers: Set<StateCallback> = new Set();

  constructor() {}

  public setBpm(newBpm: number): void {
    this.bpm = Math.max(40, Math.min(300, newBpm));
  }

  public getBpm(): number {
    this.bpm;
    return this.bpm;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public async start(): Promise<void> {
    if (this.isPlaying) return;

    // Ensure AudioContext is active
    await audioEngine.initAudio();

    this.isPlaying = true;
    this.currentStep = 0;
    this.currentRow = 0;

    this.notifyStateSubscribers(true);
    this.scheduleLoop();
  }

  public stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    if (this.timerId !== null) {
      cancelAnimationFrame(this.timerId);
      this.timerId = null;
    }

    this.currentStep = 0;
    this.currentRow = 0;
    this.notifyStateSubscribers(false);
    this.notifyTickSubscribers(0, 0, this.currentPattern);
  }

  public toggle(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  private scheduleLoop = (): void => {
    if (!this.isPlaying) return;

    // Calculate time per row based on BPM
    // 60 seconds / BPM / rowsPerBeat = seconds per row
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPerRow = secondsPerBeat / (this.rowsPerBeat / 4);

    // Notify listeners for UI cursor movement & step triggers
    this.notifyTickSubscribers(this.currentStep, this.currentRow, this.currentPattern);

    // Advance step / row
    this.currentStep = (this.currentStep + 1) % 64;
    this.currentRow = Math.floor(this.currentStep / 4) % 16;

    // Schedule next tick using requestAnimationFrame / timeout interval calculation
    const intervalMs = (secondsPerRow * 1000);
    
    // Simple robust scheduling loop for PWA tracker UI & audio triggers
    this.timerId = window.setTimeout(() => {
      this.scheduleLoop();
    }, intervalMs) as unknown as number;
  };

  public subscribeTicks(callback: TickCallback): () => void {
    this.tickSubscribers.add(callback);
    return () => this.tickSubscribers.delete(callback);
  }

  public subscribeState(callback: StateCallback): () => void {
    this.stateSubscribers.add(callback);
    return () => this.stateSubscribers.delete(callback);
  }

  private notifyTickSubscribers(step: number, row: number, pattern: number): void {
    this.tickSubscribers.forEach((cb) => cb(step, row, pattern));
  }

  private notifyStateSubscribers(isPlaying: boolean): void {
    this.stateSubscribers.forEach((cb) => cb(isPlaying));
  }
}

export const transportService = new TransportService();
