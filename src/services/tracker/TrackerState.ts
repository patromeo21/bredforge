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
// PHASE 24: EXPLICIT RUNTIME TYPE GUARDS
// ============================================================================
export function isValidTrackerStep(step: any): step is TrackerStep {
  return (
    step !== null &&
    typeof step === 'object' &&
    typeof step.step === 'number' &&
    !isNaN(step.step) &&
    (step.padId === null || (typeof step.padId === 'number' && !isNaN(step.padId))) &&
    typeof step.vol === 'number' &&
    !isNaN(step.vol) &&
    typeof step.fxType === 'string' &&
    (step.fxParam === null || (typeof step.fxParam === 'number' && !isNaN(step.fxParam)))
  );
}

export function isValidPhraseBlock(phrase: any): phrase is PhraseBlock {
  if (!Array.isArray(phrase) || phrase.length !== 16) {
    return false;
  }
  return phrase.every((item) => isValidTrackerStep(item));
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

  // ============================================================================
  // PHASE 24: RUNTIME SELF-CORRECTING PROJECT STATE SANITIZER
  // ============================================================================
  public static sanitizeProjectState(state: any): ProjectStateSchema {
    const defaults = createInitialTrackerState();

    if (!state || typeof state !== 'object') {
      return defaults;
    }

    const version = typeof state.version === 'string' ? state.version : defaults.version;
    const bpm = typeof state.bpm === 'number' && !isNaN(state.bpm) ? state.bpm : defaults.bpm;
    const swing = typeof state.swing === 'number' && !isNaN(state.swing) ? state.swing : defaults.swing;
    const isLivePerformanceMode = typeof state.isLivePerformanceMode === 'boolean' ? state.isLivePerformanceMode : defaults.isLivePerformanceMode;
    const activePhrase = typeof state.activePhrase === 'string' ? state.activePhrase : defaults.activePhrase;
    const timestamp = typeof state.timestamp === 'number' && !isNaN(state.timestamp) ? state.timestamp : Date.now();

    // Sanitize phrases dictionary
    const sanitizedPhrases: Record<string, PhraseBlock> = {};
    if (state.phrases && typeof state.phrases === 'object') {
      for (const [key, phraseVal] of Object.entries(state.phrases)) {
        if (isValidPhraseBlock(phraseVal)) {
          sanitizedPhrases[key] = phraseVal;
        } else if (Array.isArray(phraseVal)) {
          // Re-build valid 16-step phrase block from corrupt/partial input
          const fallbackSteps: TrackerStep[] = Array.from({ length: 16 }, (_, i) => {
            const rawStep = (phraseVal as any[])[i];
            return {
              step: i + 1,
              padId: rawStep && typeof rawStep.padId === 'number' ? rawStep.padId : null,
              vol: rawStep && typeof rawStep.vol === 'number' ? rawStep.vol : 1.0,
              fxType: rawStep && typeof rawStep.fxType === 'string' ? rawStep.fxType : 'bypass',
              fxParam: rawStep && typeof rawStep.fxParam === 'number' ? rawStep.fxParam : null,
            };
          });
          sanitizedPhrases[key] = fallbackSteps;
        }
      }
    }

    if (Object.keys(sanitizedPhrases).length === 0) {
      sanitizedPhrases['01'] = defaults.phrases['01'];
    }

    // Sanitize chains dictionary
    const sanitizedChains: Record<string, string[]> = {};
    if (state.chains && typeof state.chains === 'object') {
      for (const [key, chainVal] of Object.entries(state.chains)) {
        if (Array.isArray(chainVal)) {
          sanitizedChains[key] = chainVal.filter((p): p is string => typeof p === 'string');
        }
      }
    }
    if (Object.keys(sanitizedChains).length === 0) {
      sanitizedChains['01'] = ['01'];
    }

    // Sanitize songTimeline array
    let sanitizedTimeline: SongTimelineRow[] = [];
    if (Array.isArray(state.songTimeline)) {
      sanitizedTimeline = state.songTimeline.map((row, index) => ({
        rowId: row && typeof row.rowId === 'number' ? row.rowId : index + 1,
        phraseKey: row && typeof row.phraseKey === 'string' ? row.phraseKey : '01',
        repeatCount: row && typeof row.repeatCount === 'number' ? row.repeatCount : 1,
        muteStates: row && Array.isArray(row.muteStates) ? row.muteStates.map((m: any) => Boolean(m)) : [false, false, false, false],
      }));
    }
    if (sanitizedTimeline.length === 0) {
      sanitizedTimeline = defaults.songTimeline;
    }

    return {
      version,
      bpm,
      swing,
      isLivePerformanceMode,
      activePhrase: sanitizedPhrases[activePhrase] ? activePhrase : Object.keys(sanitizedPhrases)[0],
      phrases: sanitizedPhrases,
      chains: sanitizedChains,
      songTimeline: sanitizedTimeline,
      timestamp,
    };
  }
  // ============================================================================
}