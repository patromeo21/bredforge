// ============================================================================
// BREDFORGE v1.0 — 2D SPATIAL MATRIX & HARDWARE STATE TYPES (matrix.ts)
// ============================================================================

export type HardwareMode = 'NAV' | 'PUNCH';

export interface MatrixCoordinate {
  x: number; // Column 0 to 5
  y: number; // Row 0 to 3
}

export interface CursorPosition {
  row: number;
  col: number;
}

export type ScreenId = 
  | 'LIVE'       // (0,1) L
  | 'SONG'       // (1,1) S
  | 'CHAIN'      // (2,1) C
  | 'PHRASE'     // (3,1) P
  | 'INSTRUMENT' // (4,1) I
  | 'TABLE'      // (5,1) T
  | 'PROJECT'    // (1,0) P
  | 'GROOVE'     // (3,0) G
  | 'MODULATORS' // (4,0)/(5,0) M
  | 'MIXER'      // (1..5,2) V
  | 'GLOBAL_FX'; // (1..5,3) X

export interface ScreenNode {
  coord: MatrixCoordinate;
  id: ScreenId;
  label: string;
  code: string;
}

export interface HardwareState {
  mode: HardwareMode;
  currentCoord: MatrixCoordinate;
  cursorMemory: Record<string, CursorPosition>; // Keyed by screen coordinate "x,y"
  activeMutes: boolean[];                        // 8-track mute status array
  activeSolos: boolean[];                        // 8-track solo status array
}