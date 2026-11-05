// ============================================================================
// STAGE B - PHASE 13: TRACKER FX1 ROUTER & STATE ENGINE (TrackerState.ts)
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

  // ============================================================================
  // PHASE 12: CHROMATIC NOTE TRANSLATOR UTILITIES
  // ============================================================================
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

  // ============================================================================
  // PHASE 13: FX1 COMMAND RESOLVER UTILITY
  // ============================================================================
  public static resolveFXTypeFromCommand(commandStr: string): SPFxType {
    if (!commandStr) {
      return 'bypass';
    }
    const upper = commandStr.trim().toUpperCase();
    return TRACKER_FX1_COMMANDS[upper] || 'bypass';
  }
}