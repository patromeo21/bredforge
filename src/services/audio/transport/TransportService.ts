export class TransportService {
  public isPlaying: boolean = false;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private bpm: number = 120;

  constructor(bpm: number = 120) {
    this.bpm = bpm;
  }

  public setBpm(bpm: number): void {
    this.bpm = Math.max(40, Math.min(300, bpm));
  }

  public play(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.startTime = performance.now() - this.pausedAt;
  }

  public pause(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.pausedAt = performance.now() - this.startTime;
  }

  public stop(): void {
    this.isPlaying = false;
    this.startTime = 0;
    this.pausedAt = 0;
  }

  public getElapsedSeconds(): number {
    if (!this.isPlaying) return this.pausedAt / 1000;
    return (performance.now() - this.startTime) / 1000;
  }

  public getCurrentRow(totalRows: number): number {
    const elapsed = this.getElapsedSeconds();
    const secondsPerBeat = 60 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4;
    const exactRow = elapsed / secondsPer16th;
    return Math.floor(exactRow) % totalRows;
  }
}