// ============================================================================
// STAGE B - PHASE 11: 3-TIER CORE MOLECULAR JSON STATE ENGINE (TrackerState.ts)
// ============================================================================

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
  
  // Initialize pristine 16-step phrase '01'
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