export type BankID = 'A' | 'B' | 'C' | 'D';
export type PlayMode = 'one-shot' | 'gate' | 'loop';

export interface SampleSlot {
  id: number;
  bank: BankID;
  name: string;
  buffer: AudioBuffer | null;
  isPlaying: boolean;
  playMode: PlayMode;
  chokeGroup: number; // 0 = none, 1-4 = choke group ID
  volume: number;     // 0.0 to 1.0
  pitch: number;      // semitones (-12 to +12)
  startPos: number;   // normalized 0.0 to 1.0
  endPos: number;     // normalized 0.0 to 1.0
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
    
    // Initialize 64 total pad slots across 4 Banks (A, B, C, D)
    banks.forEach((bank) => {
      for (let i = 1; i <= 16; i++) {
        const key = `${bank}-${i}`;
        this.pads.set(key, {
          id: i,
          bank: bank,
          name: `Pad ${i < 10 ? '0' + i : i}`,
          buffer: null,
          isPlaying: false,
          playMode: 'one-shot',
          chokeGroup: 0,
          volume: 1.0,
          pitch: 0,
          startPos: 0.0,
          endPos: 1.0,
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
      slot.startPos = 0.0;
      slot.endPos = 1.0;
    }
  }

  public updatePadSettings(padId: number, bank: BankID, settings: Partial<SampleSlot>): void {
    const key = `${bank}-${padId}`;
    const slot = this.pads.get(key);
    if (slot) {
      Object.assign(slot, settings);
    }
  }

  public triggerPad(padId: number, bank: BankID = this.activeBank): void {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const key = `${bank}-${padId}`;
    const slot = this.pads.get(key);
    if (!slot || !slot.buffer) return;

    // Handle Choke Groups: stop any other playing pad in the same choke group
    if (slot.chokeGroup > 0) {
      this.pads.forEach((otherSlot, otherKey) => {
        if (otherSlot.chokeGroup === slot.chokeGroup && otherSlot.isPlaying) {
          const [b, p] = otherKey.split('-') as [BankID, string];
          this.stopPad(parseInt(p), b);
        }
      });
    }

    // Stop existing playback on this pad
    this.stopPad(padId, bank);

    const source = this.audioCtx.createBufferSource();
    source.buffer = slot.buffer;

    // Apply pitch shift (playbackRate)
    if (slot.pitch !== 0) {
      source.playbackRate.value = Math.pow(2, slot.pitch / 12);
    }

    // Apply volume gain node
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.value = slot.volume;

    source.connect(gainNode);
    gainNode.connect(this.destinationNode);

    const duration = slot.buffer.duration;
    const startTime = slot.startPos * duration;
    const endTime = slot.endPos * duration;
    const playDuration = Math.max(0.01, endTime - startTime);

    source.onended = () => {
      slot.isPlaying = false;
      this.activeSources.delete(key);
    };

    slot.isPlaying = true;

    if (slot.playMode === 'loop') {
      source.loop = true;
      source.loopStart = startTime;
      source.loopEnd = endTime;
      source.start(0, startTime);
    } else {
      source.start(0, startTime, playDuration);
    }

    this.activeSources.set(key, source);
  }

  public stopPad(padId: number, bank: BankID = this.activeBank): void {
    const key = `${bank}-${padId}`;
    const source = this.activeSources.get(key);
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
      this.activeSources.delete(key);
    }
    const slot = this.pads.get(key);
    if (slot) {
      slot.isPlaying = false;
    }
  }

  public clearPad(padId: number, bank: BankID): void {
    this.stopPad(padId, bank);
    const key = `${bank}-${padId}`;
    const slot = this.pads.get(key);
    if (slot) {
      slot.buffer = null;
      slot.name = `Pad ${padId < 10 ? '0' + padId : padId}`;
      slot.playMode = 'one-shot';
      slot.chokeGroup = 0;
      slot.volume = 1.0;
      slot.pitch = 0;
      slot.startPos = 0.0;
      slot.endPos = 1.0;
    }
  }

  public getPad(padId: number, bank: BankID = this.activeBank): SampleSlot | undefined {
    return this.pads.get(`${bank}-${padId}`);
  }
}