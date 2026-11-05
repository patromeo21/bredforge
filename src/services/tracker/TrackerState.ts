// ============================================================================
// STAGE D - PHASE 24: MANDATORY UNIDIRECTIONAL TYPESCRIPT DATA GUARDS (TrackerState.ts)
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
  isLivePerformanceMode: boolean;
  activePhrase: string;
  phrases: Record<string, PhraseBlock>;
  chains: Record<string, string[]>;
  songTimeline: SongTimelineRow[];
  timestamp: number;
}

// ============================================================================
// PHASE 24: RUNTIME TYPESCRIPT DATA GUARD VALIDATORS
// ============================================================================
export function isValidTrackerStep(obj: any): obj is TrackerStep {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.step === 'number' &&
    !isNaN(obj.step) &&
    (obj.padId === null || (typeof obj.padId === 'number' && !isNaN(obj.padId))) &&
    typeof obj.vol === 'number' &&
    !isNaN(obj.vol) &&
    typeof obj.fxType === 'string' &&
    (obj.fxParam === null || (typeof obj.fxParam === 'number' && !isNaN(obj.fxParam)))
  );
}

export function isValidPhraseBlock(obj: any): obj is PhraseBlock {
  if (!Array.isArray(obj) || obj.length !== 16) {
    return false;
  }
  return obj.every((item) => isValidTrackerStep(item));
}

export function isValidProjectState(obj: any): obj is ProjectStateSchema {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const hasValidPrimitives =
    typeof obj.version === 'string' &&
    typeof obj.bpm === 'number' &&
    !isNaN(obj.bpm) &&
    typeof obj.swing === 'number' &&
    !isNaN(obj.swing) &&
    typeof obj.isLivePerformanceMode === 'boolean' &&
    typeof obj.activePhrase === 'string' &&
    typeof obj.timestamp === 'number' &&
    !isNaN(obj.timestamp);

  if (!hasValidPrimitives) {
    return false;
  }

  // Validate phrases dictionary
  if (!obj.phrases || typeof obj.phrases !== 'object') {
    return false;
  }

  for (const phraseKey of Object.keys(obj.phrases)) {
    if (!isValidPhraseBlock(obj.phrases[phraseKey])) {
      return false;
    }
  }

  // Validate chains dictionary
  if (!obj.chains || typeof obj.chains !== 'object') {
    return false;
  }

  for (const chainKey of Object.keys(obj.chains)) {
    if (!Array.isArray(obj.chains[chainKey]) || !obj.chains[chainKey].every((p: any) => typeof p === 'string')) {
      return false;
    }
  }

  // Validate songTimeline array
  if (!Array.isArray(obj.songTimeline)) {
    return false;
  }

  for (const row of obj.songTimeline) {
    if (
      !row ||
      typeof row !== 'object' ||
      typeof row.rowId !== 'number' ||
      typeof row.phraseKey !== 'string' ||
      typeof row.repeatCount !== 'number' ||
      !Array.isArray(row.muteStates) ||
      !row.muteStates.every((m: any) => typeof m === 'boolean')
    ) {
      return false;
    }
  }

  return true;
}
// ============================================================================

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