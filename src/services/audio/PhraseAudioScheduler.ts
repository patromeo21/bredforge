// ============================================================================
// BREDFORGE v1.0 — PHRASE STEP AUDIO SCHEDULER (PhraseAudioScheduler.ts)
// ============================================================================

export interface PhraseStepData {
  note: string;       // "C-4", "D#4", "---"
  velocity: string;   // Hex "00" - "7F" (0 - 127)
  instrument: string; // Hex "00" - "0F" (0 - 15)
}

// Convert MIDI Note Name (e.g. "C-4") to semitone offset relative to base C-4 (MIDI 60)
export const noteToSemitones = (note: string): number | null => {
  if (!note || note === '---') return null;

  const notes = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
  const noteName = note.substring(0, 2);
  const octave = parseInt(note.substring(2), 10);

  const noteIndex = notes.indexOf(noteName);
  if (noteIndex === -1 || isNaN(octave)) return null;

  const midiNumber = (octave + 1) * 12 + noteIndex;
  return midiNumber - 60; // 0 for C-4
};

// Vintage 4x4 Pad Grid Resampling Math: f = 2^(n/12)
export const calculatePlaybackRate = (semitones: number): number => {
  return Math.pow(2, semitones / 12);
};

export class PhraseAudioScheduler {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Called on every 16th-note clock tick from SequencerAudioBridge
   */
  public triggerStep(stepData: PhraseStepData, sampleBuffer: AudioBuffer | null, destinationNode: AudioNode) {
    if (!sampleBuffer || stepData.note === '---') return;

    const semitones = noteToSemitones(stepData.note);
    if (semitones === null) return;

    // 1. Calculate pitch playback rate using 2^(n/12)
    const playbackRate = calculatePlaybackRate(semitones);

    // 2. Parse velocity hex (00-7F -> 0.0 - 1.0 gain)
    const velInt = parseInt(stepData.velocity, 16) || 100;
    const gainValue = Math.min(1.0, Math.max(0.0, velInt / 127));

    // 3. Create Web Audio buffer source & gain node
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = sampleBuffer;
    source.playbackRate.value = playbackRate;
    gainNode.gain.value = gainValue;

    // 4. Connect to channel destination & start playback immediately
    source.connect(gainNode);
    gainNode.connect(destinationNode);

    source.start(this.audioContext.currentTime);
  }
}