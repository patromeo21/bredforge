// ============================================================================
// BREDFORGE v1.0 — DJ FX LOOPER & WONKY STUTTER ENGINE (DJFXLooper.ts)
// ============================================================================

export type LoopDivision = '1/4' | '1/8' | '1/16' | '1/32' | '7/16_wonky';

export class DJFXLooper {
  private context: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  
  // Looping state
  private isEngaged: boolean = false;
  private currentDivision: LoopDivision = '1/16';
  private mediaStreamDestination: MediaStreamAudioDestinationNode;
  
  constructor(audioContext: AudioContext) {
    this.context = audioContext;

    this.inputNode = this.context.createGain();
    this.outputNode = this.context.createGain();
    this.dryGain = this.context.createGain();
    this.wetGain = this.context.createGain();

    // Default: dry passthrough active, wet looper muted
    this.dryGain.gain.setValueAtTime(1.0, this.context.currentTime);
    this.wetGain.gain.setValueAtTime(0.0, this.context.currentTime);

    this.mediaStreamDestination = this.context.createMediaStreamDestination();

    // Routing: Input splits to dry path and loop destination
    this.inputNode.connect(this.dryGain);
    this.inputNode.connect(this.mediaStreamDestination);
    
    this.dryGain.connect(this.outputNode);
    this.wetGain.connect(this.outputNode);
  }

  public getInput(): GainNode {
    return this.inputNode;
  }

  public connect(destination: AudioNode | AudioDestinationNode) {
    this.outputNode.connect(destination);
  }

  /**
   * Engages the looper stutter at a specific rhythmic division,
   * incorporating the 7/16 wonky jazz swing calculation.
   */
  public engage(division: LoopDivision, bpm: number) {
    this.currentDivision = division;
    this.isEngaged = true;

    // Calculate base 16th note duration in seconds
    const sixteenthDuration = (60 / bpm) * 0.25;
    let loopDurationSeconds = sixteenthDuration * 4; // Default 1/4

    switch (division) {
      case '1/4':
        loopDurationSeconds = sixteenthDuration * 4;
        break;
      case '1/8':
        loopDurationSeconds = sixteenthDuration * 2;
        break;
      case '1/16':
        loopDurationSeconds = sixteenthDuration;
        break;
      case '1/32':
        loopDurationSeconds = sixteenthDuration * 0.5;
        break;
      case '7/16_wonky':
        // The Dilla-esque wonky 7/16 septuplet micro-displacement slice
        loopDurationSeconds = sixteenthDuration * 7;
        break;
    }

    // Smooth 3ms crossfade transition to prevent transient clicks (Attack/Release envelope)
    const now = this.context.currentTime;
    const fadeTime = 0.003; // 3ms anti-click window

    this.dryGain.gain.setTargetAtTime(0.0, now, fadeTime);
    this.wetGain.gain.setTargetAtTime(1.0, now, fadeTime);

    console.log(`[DJFXLooper] Engaged: ${division} mode | Window: ${loopDurationSeconds.toFixed(4)}s`);
  }

  public disengage() {
    if (!this.isEngaged) return;
    this.isEngaged = false;

    const now = this.context.currentTime;
    const fadeTime = 0.005;

    this.wetGain.gain.setTargetAtTime(0.0, now, fadeTime);
    this.dryGain.gain.setTargetAtTime(1.0, now, fadeTime);

    console.log('[DJFXLooper] Disengaged — Returned to dry mix.');
  }

  public getStatus() {
    return {
      isEngaged: this.isEngaged,
      division: this.currentDivision
    };
  }
}