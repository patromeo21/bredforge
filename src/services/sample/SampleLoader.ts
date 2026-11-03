export type BankID = 'A' | 'B' | 'C' | 'D';

export interface SampleSlot {
  id: number;
  bank: BankID;
  name: string;
  buffer: AudioBuffer | null;
  isPlaying: boolean;
  chokeGroup?: number;
}

export class SampleManager {
  private audioCtx: AudioContext;
  private destinationNode: AudioNode;
  private pads: Map<string, SampleSlot> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  public activeBank: BankID = 'A';

  constructor(audioCtx: AudioContext, destinationNode?: AudioNode) {
    this.audioCtx = audioCtx;
    this.destinationNode = destinationNode || audioCtx.destination;

    const banks: BankID[] = ['A', 'B', 'C', 'D'];
    
    // Initialize 64 total pad slots across 4 Banks
    banks.forEach((bank) => {
      for (let i = 1; i <= 16; i++) {
        const key = `${bank}-${i}`;
        this.pads.set(key, {
          id: i,
          bank: bank,
          name: `Pad ${i < 10 ? '0' + i : i}`,
          buffer: null,
          isPlaying: false,
        });
      }
    });
  }

  public setDestination(destinationNode: AudioNode): void {
    this.destinationNode = destinationNode;
  }

  public setActiveBank(bank: BankID): void {
    this.activeBank = bank;
  }

  public assignBufferToPad(padId: number, bank: BankID, buffer: AudioBuffer, name: string): void {
    const key = `${bank}-${padId}`;
    const slot = this.pads.get(key);
    if (slot) {
      slot.buffer = buffer;
      slot.name = name;
    }
  }

  public triggerPad(padId: number, bank: BankID = this.activeBank): void {
    const key = `${bank}-${padId}`;
    const slot = this.pads.get(key);
    if (!slot || !slot.buffer) return;

    // Stop existing playback on this pad
    this.stopPad(padId, bank);

    const source = this.audioCtx.createBufferSource();
    source.buffer = slot.buffer;
    source.connect(this.destinationNode);

    source.onended = () => {
      slot.isPlaying = false;
      this.activeSources.delete(key);
    };

    slot.isPlaying = true;
    source.start(0);
    this.activeSources.set(key, source);
  }

  public stopPad(padId: number, bank: BankID = this.activeBank): void {
    const key = `${bank}-${padId}`;
    const source = this.activeSources.get(key);
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // Source already stopped
      }
      this.activeSources.delete(key);
    }
    const slot = this.pads.get(key);
    if (slot) {
      slot.isPlaying = false;
    }
  }

  public getPad(padId: number, bank: BankID = this.activeBank): SampleSlot | undefined {
    return this.pads.get(`${bank}-${padId}`);
  }
}