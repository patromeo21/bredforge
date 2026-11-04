export type BankID = 'A' | 'B' | 'C' | 'D';
export type PlayMode = 'one-shot' | 'gate' | 'loop';

export interface SampleSlot {
  buffer: AudioBuffer | null;
  name: string;
  playMode: PlayMode;
  chokeGroup: number; // 0 = none, 1-3 = groups
  pitch: number;      // -12 to +12 semitones
  volume: number;     // 0.0 to 1.0
  startPos: number;   // 0.0 to 1.0
  endPos: number;     // 0.0 to 1.0
  activeSourceNode?: AudioBufferSourceNode | null;
  activeGainNode?: GainNode | null;
}

export class SampleManager {
  private audioCtx: AudioContext;
  private masterGainNode: GainNode;
  private activeBank: BankID = 'A';
  
  // Store pads for 4 banks (A, B, C, D), each with 16 pads (1-16)
  private banks: Record<BankID, Map<number, SampleSlot>> = {
    A: new Map(),
    B: new Map(),
    C: new Map(),
    D: new Map(),
  };

  // Track active choke groups globally
  private chokeGroups: Map<number, AudioBufferSourceNode[]> = new Map();

  constructor(audioCtx: AudioContext, masterGainNode?: GainNode) {
    this.audioCtx = audioCtx;
    // Fallback safeguard: if masterGainNode isn't passed, create one and connect to destination
    this.masterGainNode = masterGainNode || audioCtx.createGain();
    if (!masterGainNode) {
      this.masterGainNode.connect(audioCtx.destination);
    }
    this.initBanks();
  }

  private initBanks() {
    const banks: BankID[] = ['A', 'B', 'C', 'D'];
    banks.forEach((bank) => {
      for (let i = 1; i <= 16; i++) {
        this.banks[bank].set(i, {
          buffer: null,
          name: '',
          playMode: 'one-shot',
          chokeGroup: 0,
          pitch: 0,
          volume: 1.0,
          startPos: 0,
          endPos: 1.0,
          activeSourceNode: null,
          activeGainNode: null,
        });
      }
    });
  }

  public setActiveBank(bank: BankID) {
    this.activeBank = bank;
  }

  public getActiveBank(): BankID {
    return this.activeBank;
  }

  public getPad(padId: number, bank?: BankID): SampleSlot | undefined {
    const targetBank = bank || this.activeBank;
    return this.banks[targetBank].get(padId);
  }

  public assignBufferToPad(padId: number, bank: BankID, buffer: AudioBuffer, name: string) {
    const pad = this.getPad(padId, bank);
    if (pad) {
      pad.buffer = buffer;
      pad.name = name;
    }
  }

  public updatePadSettings(padId: number, bank: BankID, settings: Partial<SampleSlot>) {
    const pad = this.getPad(padId, bank);
    if (pad) {
      Object.assign(pad, settings);
    }
  }

  public triggerPad(padId: number, bank?: BankID) {
    const targetBank = bank || this.activeBank;
    const pad = this.getPad(padId, targetBank);
    if (!pad || !pad.buffer || !this.audioCtx) return;

    // 1. SELF-CHOKE / VOICE STEALING:
    if (pad.activeSourceNode) {
      try {
        pad.activeSourceNode.stop();
        pad.activeSourceNode.disconnect();
      } catch (e) {
        // Ignored if already finished playing
      }
      pad.activeSourceNode = null;
      pad.activeGainNode = null;
    }

    // 2. CHOKE GROUP MANAGEMENT:
    if (pad.chokeGroup > 0) {
      const groupSources = this.chokeGroups.get(pad.chokeGroup);
      if (groupSources) {
        groupSources.forEach((src) => {
          try {
            src.stop();
            src.disconnect();
          } catch (e) {
            // Ignored
          }
        });
      }
      this.chokeGroups.set(pad.chokeGroup, []);
    }

    // 3. CREATE SOURCE & GAIN NODES
    const source = this.audioCtx.createBufferSource();
    source.buffer = pad.buffer;

    // Configure Play Mode
    if (pad.playMode === 'loop') {
      source.loop = true;
      source.loopStart = pad.startPos * pad.buffer.duration;
      source.loopEnd = pad.endPos * pad.buffer.duration;
    } else {
      source.loop = false;
    }

    // Apply Pitch Shifting (-12 to +12 semitones via playbackRate)
    if (pad.pitch !== 0) {
      source.playbackRate.value = Math.pow(2, pad.pitch / 12);
    }

    const gainNode = this.audioCtx.createGain();
    gainNode.gain.value = pad.volume;

    source.connect(gainNode);
    gainNode.connect(this.masterGainNode);

    // Store references
    pad.activeSourceNode = source;
    pad.activeGainNode = gainNode;

    // Register into choke group array if applicable
    if (pad.chokeGroup > 0) {
      const group = this.chokeGroups.get(pad.chokeGroup) || [];
      group.push(source);
      this.chokeGroups.set(pad.chokeGroup, group);
    }

    // Cleanup listeners when audio ends naturally
    source.onended = () => {
      if (pad.activeSourceNode === source) {
        pad.activeSourceNode = null;
        pad.activeGainNode = null;
      }
      if (pad.chokeGroup > 0) {
        const group = this.chokeGroups.get(pad.chokeGroup);
        if (group) {
          const idx = group.indexOf(source);
          if (idx !== -1) group.splice(idx, 1);
        }
      }
    };

    source.start(0, pad.startPos * pad.buffer.duration);
  }
}