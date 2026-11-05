// ============================================================================
// STAGE B - PHASE 15: LIVE PERFORMANCE INPUT CONFIGURATOR (TrackerState.ts)
// ============================================================================

export type SPFxType = 'djfxLooper' | 'vinylSim' | 'bitCrasher' | 'isolator' | 'saturation' | 'echo' | 'eq' | 'vocoder' | 'bypass';

export const TRACKER_FX1_COMMANDS: Record<string, SPFxType> = {
  'X00': 'bypass',
  'X01': 'vinylSim',
  'X02': 'djfxLooper',
  'X03': 'saturation',
  'X04': 'echo',
  'X05': 'eq',
  'X06': 'vocoder',
};

export type UserPadFXMap = Record<number, { fxType: SPFxType; defaultParam: number }>;

export const DEFAULT_PERFORMANCE_FX_MAP: UserPadFXMap = {
  0: { fxType: 'djfxLooper', defaultParam: 0.25 },
  1: { fxType: 'vinylSim', defaultParam: 1.0 },
  2: { fxType: 'saturation', defaultParam: 4.0 },
  3: { fxType: 'echo', defaultParam: 0.4 },
  4: { fxType: 'eq', defaultParam: 3.0 },
  5: { fxType: 'vocoder', defaultParam: 0.707 },
  6: { fxType: 'bitCrasher', defaultParam: 0.5 },
  7: { fxType: 'isolator', defaultParam: 1.0 },
  8: { fxType: 'bypass', defaultParam: 0.0 },
  9: { fxType: 'bypass', defaultParam: 0.0 },
  10: { fxType: 'bypass', defaultParam: 0.0 },
  11: { fxType: 'bypass', defaultParam: 0.0 },
  12: { fxType: 'bypass', defaultParam: 0.0 },
  13: { fxType: 'bypass', defaultParam: 0.0 },
  14: { fxType: 'bypass', defaultParam: 0.0 },
  15: { fxType: 'bypass', defaultParam: 0.0 },
};

export interface TrackerStep {
  step: number;
  padId: number | null;
  vol: number;
  fxType: string;
  fxParam: number | null;
}

export type PhraseBlock = TrackerStep[];

export interface SongTimelineRow {
  rowId: number;
  phraseKey: string;
  repeatCount: number;
  muteStates: boolean[];
}

export interface ProjectStateSchema {
  version: string;
  bpm: number;
  swing: number;
  isLivePerformanceMode: boolean; // Phase 15 state expansion flag
  activePhrase: string;
  phrases: Record<string, PhraseBlock>;
  chains: Record<string, string[]>;
  songTimeline: SongTimelineRow[];
  timestamp: number;
}

export function createInitialTrackerState(): ProjectStateSchema {
  const defaultPhrases: Record<string, PhraseBlock> = {};
  
  const initialSteps: TrackerStep[] = Array.from({ length: 16 }, (_, i) => ({
    step: i + 1,
    padId: null,
    vol: 1.0,
    fxType: 'bypass',
    fxParam: null,
  }));

  defaultPhrases['01'] = initialSteps;

  return {
    version: '1.0.0',
    bpm: 120,
    swing: 0,
    isLivePerformanceMode: false,
    activePhrase: '01',
    phrases: defaultPhrases,
    chains: {
      '01': ['01']
    },
    songTimeline: [
      {
        rowId: 1,
        phraseKey: '01',
        repeatCount: 1,
        muteStates: [false, false, false, false],
      }
    ],
    timestamp: Date.now(),
  };
}

export class TrackerState {
  private static readonly NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  public static getNoteNameFromPadId(padId: number | null): string {
    if (padId === null || padId < 0 || padId > 63) {
      return '---';
    }
    const octave = 4 + Math.floor(padId / 12);
    const note = TrackerState.NOTE_NAMES[padId % 12];
    return note.includes('#') ? `${note}${octave}` : `${note}-${octave}`;
  }

  public static getPadIdFromNoteName(noteName: string): number | null {
    if (!noteName || noteName === '---') {
      return null;
    }
    const cleaned = noteName.trim().toUpperCase();
    const match = cleaned.match(/^([A-G]#?)-?([0-8])$/);
    if (!match) {
      return null;
    }
    const [, noteStr, octaveStr] = match;
    const noteIndex = TrackerState.NOTE_NAMES.indexOf(noteStr);
    if (noteIndex === -1) {
      return null;
    }
    const octave = parseInt(octaveStr, 10);
    const padId = (octave - 4) * 12 + noteIndex;
    return padId >= 0 && padId <= 63 ? padId : null;
  }

  public static resolveFXTypeFromCommand(commandStr: string): SPFxType {
    if (!commandStr) {
      return 'bypass';
    }
    const upper = commandStr.trim().toUpperCase();
    return TRACKER_FX1_COMMANDS[upper] || 'bypass';
  }

  public static resolveFX2ParameterValue(fxType: SPFxType, rawParam: number | null): number {
    if (rawParam === null || isNaN(rawParam)) {
      switch (fxType) {
        case 'saturation': return 4.0;
        case 'echo': return 0.4;
        case 'djfxLooper': return 0.25;
        case 'vocoder': return 0.707;
        case 'eq': return 0.0;
        default: return 1.0;
      }
    }

    const normalized = rawParam > 1.0 ? Math.min(1.0, rawParam / 255.0) : Math.max(0.0, Math.min(1.0, rawParam));

    switch (fxType) {
      case 'saturation':
        return 1.0 + normalized * 11.0;
      case 'echo':
        return normalized * 0.95;
      case 'djfxLooper':
        return 0.01 + normalized * 1.99;
      case 'vocoder':
        return normalized;
      case 'eq':
        return -24.0 + normalized * 48.0;
      default:
        return normalized;
    }
  }
}