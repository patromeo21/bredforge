export interface StepData {
  note?: string;
  instrumentId: number;
}

export interface PatternRow {
  columns: StepData[];
}

export interface PatternState {
  totalRows: number;
  rows: PatternRow[];
}

export class TrackerEngine {
  public bpm: number;
  public totalRows: number;
  public numColumns: number;
  public pattern: PatternState;

  constructor(bpm: number = 120, totalRows: number = 64, numColumns: number = 4) {
    this.bpm = bpm;
    this.totalRows = totalRows;
    this.numColumns = numColumns;
    this.pattern = this.generateDefaultPattern();
  }

  private generateDefaultPattern(): PatternState {
    const rows: PatternRow[] = [];
    for (let r = 0; r < this.totalRows; r++) {
      const columns: StepData[] = [];
      for (let c = 0; c < this.numColumns; c++) {
        const hasNote = r % 4 === 0 && c === 0;
        columns.push({
          note: hasNote ? (r % 8 === 0 ? 'C2' : 'G2') : undefined,
          instrumentId: c + 1,
        });
      }
      rows.push({ columns });
    }
    return { totalRows: this.totalRows, rows };
  }

  public getRowFromAudioTime(elapsedSeconds: number): number {
    const secondsPerBeat = 60 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4;
    const exactRow = elapsedSeconds / secondsPer16th;
    return Math.floor(exactRow) % this.totalRows;
  }
}