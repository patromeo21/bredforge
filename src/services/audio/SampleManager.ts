// ============================================================================
// BREDFORGE v1.0 — CENTRALIZED SAMPLE MANAGER & MPC ADSR ENGINE [REF: M65]
// ============================================================================

export type PlaybackMode = 'one-shot' | 'gate' | 'loop';

export interface PadAssignment {
  padIndex: number;          // 0 - 15
  bank: 'A' | 'B' | 'C' | 'D';
  sampleName: string;
  audioBuffer?: AudioBuffer | null;
  playbackMode: PlaybackMode;
  attack: number;    // seconds
  decay: number;     // seconds
  sustain: number;   // 0 - 1
  release: number;   // seconds
  startTrim: number; // 0 - 1
  endTrim: number;   // 0 - 1
}

class SampleManager {
  private assignments: Map<string, PadAssignment> = new Map();
  private audioCtx: AudioContext | null = null;
  private activeSources: Map<string, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public async loadAndAssignSample(
    bank: 'A' | 'B' | 'C' | 'D',
    padIndex: number,
    file: File
  ): Promise<PadAssignment> {
    const ctx = this.getAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const assignment: PadAssignment = {
      padIndex,
      bank,
      sampleName: file.name,
      audioBuffer,
      playbackMode: 'one-shot',
      attack: 0.005,
      decay: 0.1,
      sustain: 0.8,
      release: 0.15,
      startTrim: 0,
      endTrim: 1,
    };

    this.assignments.set(`${bank}-${padIndex}`, assignment);
    return assignment;
  }

  public getAssignment(bank: 'A' | 'B' | 'C' | 'D', padIndex: number): PadAssignment | undefined {
    return this.assignments.get(`${bank}-${padIndex}`);
  }

  public updateParameters(
    bank: 'A' | 'B' | 'C' | 'D',
    padIndex: number,
    updates: Partial<PadAssignment>
  ): void {
    const key = `${bank}-${padIndex}`;
    const existing = this.assignments.get(key);
    if (existing) {
      this.assignments.set(key, { ...existing, ...updates });
    } else {
      this.assignments.set(key, {
        padIndex,
        bank,
        sampleName: `Pad ${padIndex + 1}`,
        playbackMode: updates.playbackMode || 'one-shot',
        attack: updates.attack ?? 0.005,
        decay: updates.decay ?? 0.1,
        sustain: updates.sustain ?? 0.8,
        release: updates.release ?? 0.15,
        startTrim: updates.startTrim ?? 0,
        endTrim: updates.endTrim ?? 1,
        ...updates,
      });
    }
  }

  public triggerPad(bank: 'A' | 'B' | 'C' | 'D', padIndex: number): void {
    const ctx = this.getAudioContext();
    const assignment = this.getAssignment(bank, padIndex);
    const key = `${bank}-${padIndex}`;

    if (this.activeSources.has(key)) {
      try {
        this.activeSources.get(key)!.source.stop();
      } catch (e) {}
      this.activeSources.delete(key);
    }

    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    const attack = assignment?.attack ?? 0.005;
    const decay = assignment?.decay ?? 0.1;
    const sustain = assignment?.sustain ?? 0.8;
    const release = assignment?.release ?? 0.15;
    const mode = assignment?.playbackMode ?? 'one-shot';

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + attack);
    gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);

    if (assignment && assignment.audioBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = assignment.audioBuffer;
      source.loop = mode === 'loop';

      const duration = assignment.audioBuffer.duration * ((assignment.endTrim || 1) - (assignment.startTrim || 0));
      source.connect(gainNode);

      source.start(now, assignment.audioBuffer.duration * (assignment.startTrim || 0));
      if (mode !== 'loop') {
        source.stop(now + duration);
      }

      this.activeSources.set(key, { source, gain: gainNode });
    } else {
      // Fallback synthetic click for unassigned pads
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 + padIndex * 20, now);
      osc.connect(gainNode);
      osc.start(now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.stop(now + 0.2);
    }
  }
}

export const sampleManager = new SampleManager();