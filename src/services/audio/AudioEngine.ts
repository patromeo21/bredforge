// ============================================================================
// BREDFORGE v1.0 — HIGH-PERFORMANCE WEB AUDIO ENGINE (AudioEngine.ts)
// ============================================================================

export class AudioEngine {
  private static audioCtx: AudioContext | null = null;
  private static sampleBuffers: Map<string, AudioBuffer> = new Map();
  private static isInitialized: boolean = false;

  /**
   * Initializes or resumes the AudioContext upon first user interaction
   * (Crucial requirement for mobile Safari on iPad 9th Gen).
   */
  public static async init(): Promise<void> {
    if (AudioEngine.isInitialized && AudioEngine.audioCtx) {
      if (AudioEngine.audioCtx.state === 'suspended') {
        await AudioEngine.audioCtx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      AudioEngine.audioCtx = new AudioContextClass();

      if (AudioEngine.audioCtx.state === 'suspended') {
        await AudioEngine.audioCtx.resume();
      }

      AudioEngine.isInitialized = true;
      console.log(`[AUDIO ENGINE] Initialized successfully. Sample rate: ${AudioEngine.audioCtx.sampleRate}Hz`);
    } catch (error) {
      console.error("[AUDIO ENGINE] Failed to initialize AudioContext:", error);
    }
  }

  /**
   * Decodes and caches an ArrayBuffer into an AudioBuffer for instant playback.
   */
  public static async loadSample(key: string, arrayBuffer: ArrayBuffer): Promise<void> {
    await AudioEngine.init();
    if (!AudioEngine.audioCtx) return;

    try {
      // Decode audio data off the main thread where possible
      const decodedBuffer = await AudioEngine.audioCtx.decodeAudioData(arrayBuffer);
      AudioEngine.sampleBuffers.set(key.toUpperCase(), decodedBuffer);
      console.log(`[AUDIO ENGINE] Loaded and decoded sample: ${key}`);
    } catch (error) {
      console.error(`[AUDIO ENGINE] Failed to decode audio for ${key}:`, error);
    }
  }

  /**
   * Instantaneous zero-latency pad trigger (SP-404 / M8 Style audition).
   */
  public static playPad(hexId: string): void {
    if (!AudioEngine.audioCtx || AudioEngine.audioCtx.state !== 'running') {
      // Fallback unlock attempt
      AudioEngine.init();
      return;
    }

    const buffer = AudioEngine.sampleBuffers.get(hexId.toUpperCase());
    if (!buffer) {
      // If no sample buffer is loaded yet, generate a crisp synthesized click/metronome blip 
      // as a fallback so live pads are immediately responsive out of the box.
      AudioEngine.playFallbackBlip();
      return;
    }

    try {
      const source = AudioEngine.audioCtx.createBufferSource();
      source.buffer = buffer;

      // Route through a master gain node for headroom management
      const gainNode = AudioEngine.audioCtx.createGain();
      gainNode.gain.value = 0.85;

      source.connect(gainNode);
      gainNode.connect(AudioEngine.audioCtx.destination);

      source.start(0);
    } catch (error) {
      console.error(`[AUDIO ENGINE] Error playback for pad ${hexId}:`, error);
    }
  }

  /**
   * Internal synthetic fallback blip when raw sample buffers are not yet loaded.
   */
  private static playFallbackBlip(): void {
    if (!AudioEngine.audioCtx) return;
    try {
      const osc = AudioEngine.audioCtx.createOscillator();
      const gain = AudioEngine.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, AudioEngine.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, AudioEngine.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.5, AudioEngine.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, AudioEngine.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(AudioEngine.audioCtx.destination);

      osc.start();
      osc.stop(AudioEngine.audioCtx.currentTime + 0.08);
    } catch (e) {
      // Suppress fallback audio errors
    }
  }

  public static getContextState(): string {
    return AudioEngine.audioCtx ? AudioEngine.audioCtx.state : 'uninitialized';
  }
}
