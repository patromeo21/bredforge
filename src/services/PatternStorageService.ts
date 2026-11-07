// ============================================================================
// BREDFORGE v1.0 — PATTERN STORAGE SERVICE (PatternStorageService.ts)
// ============================================================================

export interface TrackerStepData {
  note: string;
  instrument: number;
  volume: number;
  command: string;
  valStr: string;
}

export interface PatternData {
  version: string;
  tempo: number;
  steps: TrackerStepData[];
}

export class PatternStorageService {
  private static STORAGE_KEY = 'bredforge_current_pattern';

  public static savePattern(pattern: PatternData): void {
    try {
      const jsonStr = JSON.stringify(pattern);
      localStorage.setItem(this.STORAGE_KEY, jsonStr);
    } catch (e) {
      console.error('[PatternStorage] Failed to save pattern to local storage:', e);
    }
  }

  public static loadPattern(): PatternData | null {
    try {
      const jsonStr = localStorage.getItem(this.STORAGE_KEY);
      if (!jsonStr) return null;
      return JSON.parse(jsonStr) as PatternData;
    } catch (e) {
      console.error('[PatternStorage] Failed to load pattern from local storage:', e);
      return null;
    }
  }

  public static exportAsJSON(pattern: PatternData, filename: string = 'bredforge_pattern.json'): void {
    try {
      const jsonStr = JSON.stringify(pattern, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[PatternStorage] Failed to export pattern JSON:', e);
    }
  }
}