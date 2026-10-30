/**
 * BredForge Core Session State Schema
 * Defines 64 sample slots across 4 banks (A, B, C, D) and 8 polyphonic tracker tracks.
 */
export const initialSessionState = {
  bpm: 120,
  speed: 6, // Micro-ticks per row (default 6)
  activeTrack: 0,
  activeRow: 0,
  isPlaying: false,
  isRecording: false,

  // 4 Banks of 4x4 Pads (64 total sample slots)
  sampleBanks: {
    A: Array(16).fill().map((_, i) => ({ id: `A${i+1}`, name: `Sample A${i+1}`, chokeGroup: 0 })),
    B: Array(16).fill().map((_, i) => ({ id: `B${i+1}`, name: `Sample B${i+1}`, chokeGroup: 0 })),
    C: Array(16).fill().map((_, i) => ({ id: `C${i+1}`, name: `Sample C${i+1}`, chokeGroup: 0 })),
    D: Array(16).fill().map((_, i) => ({ id: `D${i+1}`, name: `Sample D${i+1}`, chokeGroup: 0 })),
  },

  // 8 Tracker Tracks (Columns), each containing 64 vertical steps
  trackerTracks: Array(8).fill().map((_, trackIdx) => ({
    id: trackIdx,
    muted: false,
    soloed: false,
    steps: Array(64).fill().map(() => ({
      note: '...',     // e.g., 'C-4'
      instrument: '--', // e.g., '01'
      volume: '--',    // e.g., '64'
      command: '---'   // e.g., 'ED5' (micro-delay)
    }))
  }))
};
