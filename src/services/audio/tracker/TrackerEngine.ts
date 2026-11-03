export interface TrackerStep {
  note: string | null;
  instrumentId: number;
  fxCmd: string | null;
  fxVal: string | null;
}

export interface TrackerRow {
  columns: TrackerStep[];
}

export interface PatternState {
  currentPatternId: number;
  totalRows: number;
  bpm: number;
  rows: TrackerRow[];
}

export class TrackerEngine {
  public pattern: PatternState;
  private bpm: number;
  private totalRows: number;

  constructor(bpm: number = 120, totalRows: number = 64, trackCount: number = 4) {
    this.bpm = bpm;
    this.totalRows = totalRows;
    this.pattern = {
      currentPatternId: 1,
      totalRows,
      bpm,
      rows: Array.from({ length: totalRows }, () => ({
        columns: Array.from({ length: trackCount }, () => ({
          note: null,
          instrumentId: 0,
          fxCmd: null,
          fxVal: null,
        })),
      })),
    };
  }

  public setBpm(newBpm: number): void {
    this.bpm = Math.max(40, Math.min(300, newBpm));
    this.pattern.bpm = this.bpm;
  }

  /**
   * Calculates the exact tracker row index based on elapsed audio time
   * assuming 16th-note quantization per row.
   */
  public getRowFromAudioTime(elapsedSeconds: number): number {
    const secondsPerBeat = 60 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4;
    const exactRow = elapsedSeconds / secondsPer16th;
    return Math.floor(exactRow) % this.totalRows;
  }

  public recordStep(rowIdx: number, trackIdx: number, step: TrackerStep): void {
    if (rowIdx >= 0 && rowIdx < this.totalRows && trackIdx >= 0 && trackIdx < this.pattern.rows[0].columns.length) {
      this.pattern.rows[rowIdx].columns[trackIdx] = { ...step };
    }
  }

  public clearRow(rowIdx: number, trackIdx: number): void {
    if (rowIdx >= 0 && rowIdx < this.totalRows && trackIdx >= 0 && trackIdx < this.pattern.rows[0].columns.length) {
      this.pattern.rows[rowIdx].columns[trackIdx] = {
        note: null,
        instrumentId: 0,
        fxCmd: null,
        fxVal: null,
      };
    }
  }

  /**
   * Asynchronous background helper placeholder for offline phase-vocoder time-stretching.
   */
  public async stretchAudioBufferAsync(
    sourceBuffer: AudioBuffer,
    targetRatio: number
  ): Promise<AudioBuffer | null> {
    if (targetRatio === 1.0) return sourceBuffer;
    
    // Non-blocking asynchronous promise wrapper for future offline audio context processing
    return new Promise((resolve) => {
      setTimeout(() => {
        // Placeholder for phase-vocoder overlap-add interpolation
        resolve(sourceBuffer);
      }, 10);
    });
  }
}