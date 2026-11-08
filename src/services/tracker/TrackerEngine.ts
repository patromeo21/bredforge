// ============================================================================
// BREDFORGE v1.0 — TRACKER ENGINE WITH PARAMETER LOCKS [REF: M53]
// ============================================================================

export interface ParameterLock {
  pitchOffset?: number;      // Semitones (-12 to +12)
  filterCutoff?: number;     // Hz (20 to 20000)
  saturationAmount?: number; // 0 to 100
}

export interface StepColumn {
  note?: string | null;
  instrumentID?: number | null;
  volume?: number;
  fxCommand?: string;
  paramLock?: ParameterLock; // Per-step automation lock
}

export interface PatternState {
  totalRows: number;
  rows: { columns: StepColumn[] }[];
}

export class TrackerEngine {
  public bpm: number = 120;
  public totalRows: number = 64;

  public setBpm(newBpm: number): void {
    this.bpm = Math.max(60, Math.min(200, newBpm));
  }

  public generateDefaultPattern(): PatternState {
    const rows: { columns: StepColumn[] }[] = [];

    for (let r = 0; r < this.totalRows; r++) {
      const columns: StepColumn[] = [];
      const hasNote = r % 4 === 0;

      columns.push({
        note: hasNote ? (r % 8 === 0 ? 'C2' : 'G2') : null,
        instrumentID: hasNote ? 1 : null,
        volume: 100,
        paramLock: {},
      });

      rows.push({ columns });
    }

    return { totalRows: this.totalRows, rows };
  }

  public setParameterLock(
    pattern: PatternState,
    rowIndex: number,
    colIndex: number,
    lock: ParameterLock
  ): void {
    if (pattern.rows[rowIndex] && pattern.rows[rowIndex].columns[colIndex]) {
      const targetColumn = pattern.rows[rowIndex].columns[colIndex];
      targetColumn.paramLock = {
        ...targetColumn.paramLock,
        ...lock,
      };
      console.log(`[TrackerEngine] P-Lock applied at Row ${rowIndex}, Col ${colIndex}`, lock);
    }
  }

  public getRowFromAudioTime(elapsedSeconds: number): number {
    const secondsPerBeat = 60 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4;
    const exactRow = elapsedSeconds / secondsPer16th;
    return Math.floor(exactRow) % this.totalRows;
  }
}

export const trackerEngine = new TrackerEngine();