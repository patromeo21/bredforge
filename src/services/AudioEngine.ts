// ============================================================================
// BREDFORGE v1.0 — WEB AUDIO SAMPLE PLAYBACK & SLICE ENGINE [REF: AUDIO-01]
// ============================================================================

export class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private constructor() {
    // AudioContext will be initialized on first user interaction to satisfy browser autoplay policies
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initialize or resume the Web Audio context on user gesture
   */
  public async init(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Decode raw ArrayBuffer into an AudioBuffer
   */
  public async decodeAudioFile(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    const context = await this.init();
    return await context.decodeAudioData(arrayBuffer);
  }

  /**
   * Trigger a sample slice with frame offset boundaries and semitone pitch shifting
   * 
   * @param buffer - The source AudioBuffer
   * @param startFrame - Start frame position (from slice marker)
   * @param endFrame - End frame position (or end of buffer)
   * @param semitones - Pitch shift in semitones (-12 to +12)
   */
  public async playSlice(
    buffer: AudioBuffer,
    startFrame: number = 0,
    endFrame?: number,
    semitones: number = 0
  ): Promise<AudioBufferSourceNode> {
    const context = await this.init();

    const source = context.createBufferSource();
    source.buffer = buffer;

    // Calculate playback rate for semitone pitch shifting (12 semitones = 1 octave = 2x rate)
    const playbackRate = Math.pow(2, semitones / 12);
    source.playbackRate.value = playbackRate;

    // Connect source -> master gain -> destination
    if (this.masterGain) {
      source.connect(this.masterGain);
    }

    const actualEndFrame = endFrame && endFrame <= buffer.length ? endFrame : buffer.length;
    const durationFrames = actualEndFrame - startFrame;
    const durationSeconds = durationFrames / buffer.sampleRate / playbackRate;

    const offsetSeconds = startFrame / buffer.sampleRate;

    // Start playback with precise frame-offset bounds
    source.start(context.currentTime, offsetSeconds, durationSeconds);

    return source;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }
}

export const audioEngine = AudioEngine.getInstance();
