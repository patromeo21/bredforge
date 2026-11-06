// ============================================================================
// BREDFORGE v1.0 — AUDIO INSTRUMENT CHANNEL (AudioInstrumentChannel.ts)
// ============================================================================

import { InstrumentChannel } from './SequencerAudioBridge';

export class AudioInstrumentChannel implements InstrumentChannel {
  public id: number;
  private audioContext: AudioContext;
  private outputNode: GainNode;
  private sampleBuffer: AudioBuffer | null = null;
  private baseNoteMidi: number = 60; // Default root note (C-4)

  constructor(id: number, audioContext: AudioContext, destinationNode: AudioNode) {
    this.id = id;
    this.audioContext = audioContext;
    
    // Channel gain strip
    this.outputNode = this.audioContext.createGain();
    this.outputNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);
    this.outputNode.connect(destinationNode);
  }

  public setSampleBuffer(buffer: AudioBuffer, rootNote: string = 'C-4'): void {
    this.sampleBuffer = buffer;
    this.baseNoteMidi = this.noteToMidi(rootNote);
  }

  public playBuffer(note: string, volume: number): void {
    if (!this.sampleBuffer) {
      console.warn(`[InstrumentChannel ${this.id}] No audio buffer loaded for playback.`);
      return;
    }

    const now = this.audioContext.currentTime;
    const rampDuration = 0.003; // 3ms anti-click crossfade envelope

    // 1. Create buffer source node (one-shot per trigger)
    const source = this.audioContext.createBufferSource();
    source.buffer = this.sampleBuffer;

    // 2. Calculate pitch/playback rate from note string (e.g., "C-4", "D#4")
    const targetMidi = this.noteToMidi(note);
    const semitoneOffset = targetMidi - this.baseNoteMidi;
    source.playbackRate.setValueAtTime(Math.pow(2, semitoneOffset / 12), now);

    // 3. Map tracker volume (0–64 standard tracker scale) to gain amplitude with 3ms anti-click ramp
    const gainNode = this.audioContext.createGain();
    const normalizedVolume = Math.max(0, Math.min(64, volume)) / 64;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(normalizedVolume, now + rampDuration);

    // 4. Connect routing: Source -> Gain (with anti-click) -> Channel Master
    source.connect(gainNode);
    gainNode.connect(this.outputNode);

    // 5. Fire playback
    source.start(now);
  }

  /**
   * Converts tracker note strings (e.g., "C-4", "A#3") into absolute MIDI note integers.
   */
  private noteToMidi(noteStr: string): number {
    const notes: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };

    const match = noteStr.match(/^([A-G]#?)(-?\d+)$/);
    if (!match) return 60; // Fallback to middle C

    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const semitone = notes[noteName] ?? 0;

    return (octave + 1) * 12 + semitone;
  }
}