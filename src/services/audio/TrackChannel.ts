export class TrackChannel {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public gain = 1,
    public pan = 0,
    public muted = false,
    public solo = false,
  ) {}
}

export class PatternScheduler {
  private tempoBpm: number;
  private steps: number;

  constructor(tempoBpm = 120, steps = 16) {
    this.tempoBpm = tempoBpm;
    this.steps = steps;
  }

  setTempo(tempoBpm: number) {
    this.tempoBpm = tempoBpm;
  }

  getStepDurationSeconds() {
    return (60 / this.tempoBpm) / 4;
  }

  getStepIndexAtTime(positionSeconds: number) {
    const stepLength = this.getStepDurationSeconds();
    return Math.floor(positionSeconds / stepLength) % this.steps;
  }

  getPatternLength() {
    return this.steps;
  }
}
