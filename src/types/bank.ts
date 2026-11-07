// ============================================================================
// BREDFORGE v1.0 — BANK & PAD TYPES (bank.ts)
// ============================================================================

export type BankId = 'A' | 'B' | 'C' | 'D';
export type PlayMode = 'oneshot' | 'chromatic';

export interface PadData {
  id: number;          // 0 to 15 (4x4 grid)
  name: string;        // Sample name or slice label
  isLoaded: boolean;   // Whether sample audio is loaded into memory
  color: string;       // Accent theme color
  volume: number;      // 0.0 to 1.0 gain multiplier
  pitch: number;       // Semitone offset (-12 to +12)
}

export interface BankConfig {
  id: BankId;
  label: string;
  description: string;
  playMode: PlayMode;  // 'oneshot' or 'chromatic' (PARAMS + POLY toggle)
  rootPadId: number;   // Root pad index when chromatic mode is active
  pads: PadData[];
}