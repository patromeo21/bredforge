export type BankID = 'A' | 'B' | 'C' | 'D';
export type PlayMode = 'one-shot' | 'gate' | 'loop';

export interface SampleSlot {
  buffer: AudioBuffer | null;
  name: string;
  playMode: PlayMode;
  chokeGroup: number; // 0 = none, 1-3 = groups
  pitch: number;      // -12 to +12 semitones
  volume: number;     // 0.0 to 1.0
  startPos: number;   // 0.0 to 1.0 (Global normalized 0-1)
  endPos: number;     // 0.0 to 1.0 (Global normalized 0-1)
  zoomLevel: number;  // 1.0 to 8.0
  scrollOffset: number; // 0.0 to 1.0
  activeSourceNode?: AudioBufferSourceNode | null;
  activeGainNode?: GainNode | null;
  startTime?: number; // For playhead tracking
}

export class SampleManager {
  private audioCtx: AudioContext;
  private masterGainNode: GainNode;
  private activeBank: BankID = 'A';
  
  private banks: Record<BankID, Map<number, SampleSlot>> = {
    A: new Map(),
    B: new Map(),
    C: new Map(),
    D: new Map(),
  };

  private chokeGroups: Map<number, AudioBufferSourceNode[]> = new Map();

  constructor(audioCtx: AudioContext, masterGainNode?: GainNode) {
    this.audioCtx = audioCtx;
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
          zoomLevel: 1.0,
          scrollOffset: 0.0,
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
      pad.zoomLevel = 1.0;
      pad.scrollOffset = 0.0;
      pad.startPos = 0;
      pad.endPos = 1.0;
    }
  }

  public updatePadSettings(padId: number, bank: BankID, settings: Partial<SampleSlot>) {
    const pad = this.getPad(padId, bank);
    if (pad) {
      Object.assign(pad, settings);
      if (pad.activeGainNode && settings.volume !== undefined) {
        pad.activeGainNode.gain.setValueAtTime(settings.volume, this.audioCtx.currentTime);
      }
    }
  }

  public copyPad(sourcePadId: number, sourceBank: BankID, targetPadId: number, targetBank: BankID) {
    const source = this.getPad(sourcePadId, sourceBank);
    const target = this.getPad(targetPadId, targetBank);
    if (source && target) {
      target.buffer = source.buffer;
      target.name = source.name;
      target.playMode = source.playMode;
      target.chokeGroup = source.chokeGroup;
      target.pitch = source.pitch;
      target.volume = source.volume;
      target.startPos = source.startPos;
      target.endPos = source.endPos;
      target.zoomLevel = source.zoomLevel;
      target.scrollOffset = source.scrollOffset;
    }
  }

  public clearPad(padId: number, bank: BankID) {
    this.stopPad(padId, bank);
    const pad = this.getPad(padId, bank);
    if (pad) {
      pad.buffer = null;
      pad.name = '';
      pad.playMode = 'one-shot';
      pad.chokeGroup = 0;
      pad.pitch = 0;
      pad.volume = 1.0;
      pad.startPos = 0;
      pad.endPos = 1.0;
      pad.zoomLevel = 1.0;
      pad.scrollOffset = 0.0;
      pad.activeSourceNode = null;
      pad.activeGainNode = null;
    }
  }

  public stopPad(padId: number, bank?: BankID) {
    const targetBank = bank || this.activeBank;
    const pad = this.getPad(padId, targetBank);
    if (pad && pad.activeSourceNode) {
      try {
        pad.activeSourceNode.stop();
        pad.activeSourceNode.disconnect();
      } catch (e) {}
      pad.activeSourceNode = null;
      pad.activeGainNode = null;
    }
  }

  public triggerPad(padId: number, bank?: BankID) {
    const targetBank = bank || this.activeBank;
    const pad = this.getPad(padId, targetBank);
    if (!pad || !pad.buffer || !this.audioCtx) return;

    if (pad.playMode === 'loop' && pad.activeSourceNode) {
      this.stopPad(padId, targetBank);
      return;
    }

    if (pad.activeSourceNode && pad.playMode !== 'loop') {
      try {
        pad.activeSourceNode.stop();
        pad.activeSourceNode.disconnect();
      } catch (e) {}
      pad.activeSourceNode = null;
      pad.activeGainNode = null;
    }

    if (pad.chokeGroup > 0) {
      const groupSources = this.chokeGroups.get(pad.chokeGroup);
      if (groupSources) {
        groupSources.forEach((src) => {
          try {
            src.stop();
            src.disconnect();
          } catch (e) {}
        });
      }
      this.chokeGroups.set(pad.chokeGroup, []);
    }

    const source = this.audioCtx.createBufferSource();
    source.buffer = pad.buffer;

    const duration = pad.buffer.duration;
    const trimStart = pad.startPos * duration;
    const trimEnd = pad.endPos * duration;
    const playDuration = Math.max(0.01, trimEnd - trimStart);

    if (pad.playMode === 'loop') {
      source.loop = true;
      source.loopStart = trimStart;
      source.loopEnd = trimEnd;
    } else {
      source.loop = false;
    }

    if (pad.pitch !== 0) {
      source.playbackRate.value = Math.pow(2, pad.pitch / 12);
    }

    const gainNode = this.audioCtx.createGain();
    gainNode.gain.value = pad.volume;

    source.connect(gainNode);
    gainNode.connect(this.masterGainNode);

    pad.activeSourceNode = source;
    pad.activeGainNode = gainNode;
    pad.startTime = this.audioCtx.currentTime;

    if (pad.chokeGroup > 0) {
      const group = this.chokeGroups.get(pad.chokeGroup) || [];
      group.push(source);
      this.chokeGroups.set(pad.chokeGroup, group);
    }

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

    source.start(0, trimStart, pad.playMode === 'one-shot' ? playDuration : undefined);
  }
}