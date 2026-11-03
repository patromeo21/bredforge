export interface SampleSlot {
  id: number;
  name: string;
  buffer: AudioBuffer | null;
  isPlaying: boolean;
}

export class SampleManager {
  private audioCtx: AudioContext;
  private pads: Map<number, SampleSlot> = new Map();
  private activeSources: Map<number, AudioBufferSourceNode> = new Map();

  constructor(audioCtx: AudioContext, totalPads: number = 16) {
    this.audioCtx = audioCtx;
    // Initialize 16 pad slots (SP-404 style 4x4 grid)
    for (let i = 1; i <= totalPads; i++) {
      this.pads.set(i, {
        id: i,
        name: `Pad ${i < 10 ? '0' + i : i}`,
        buffer: null,
        isPlaying: false,
      });
    }
  }

  public assignBufferToPad(padId: number, buffer: AudioBuffer, name: string): void {
    const slot = this.pads.get(padId);
    if (slot) {
      slot.buffer = buffer;
      slot.name = name;
    }
  }

  public triggerPad(padId: number): void {
    const slot = this.pads.get(padId);
    if (!slot || !slot.buffer) return;

    // Stop any existing playback on this pad (choke / retrigger)
    this.stopPad(padId);

    const source = this.audioCtx.createBufferSource();
    source.buffer = slot.buffer;
    source.connect(this.audioCtx.destination);

    source.onended = () => {
      slot.isPlaying = false;
      this.activeSources.delete(padId);
    };

    slot.isPlaying = true;
    source.start(0);
    this.activeSources.set(padId, source);
  }

  public stopPad(padId: number): void {
    const source = this.activeSources.get(padId);
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.activeSources.delete(padId);
    }
    const slot = this.pads.get(padId);
    if (slot) {
      slot.isPlaying = false;
    }
  }

  public getPad(padId: number): SampleSlot | undefined {
    return this.pads.get(padId);
  }
}