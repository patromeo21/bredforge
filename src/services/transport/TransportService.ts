export class TransportService {
  public bpm: number;
  public isPlaying: boolean = false;
  private startTime: number = 0;
  private pausedElapsed: number = 0;

  constructor(bpm: number = 120) {
    this.bpm = bpm;
  }

  public play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startTime = performance.now() - (this.pausedElapsed * 1000);
    }
  }

  public pause(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.pausedElapsed = this.getElapsedSeconds();
    }
  }

  public stop(): void {
    this.isPlaying = false;
    this.startTime = 0;
    this.pausedElapsed = 0;
  }

  public getElapsedSeconds(): number {
    if (!this.isPlaying) return this.pausedElapsed;
    return (performance.now() - this.startTime) / 1000;
  }
}