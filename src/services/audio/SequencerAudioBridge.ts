// ============================================================================
// BREDFORGE v1.0 — SEQUENCER AUDIO BRIDGE (SequencerAudioBridge.ts)
// ============================================================================

import { TableEngine } from './TableEngine';

export interface InstrumentChannel {
  id: number;
  setSampleBuffer(buffer: AudioBuffer, rootNote?: string): void;
  playBuffer(note: string, volume: number): void;
  applyModulation?(command: string, value: number): void;
}

export class SequencerAudioBridge {
  private audioContext: AudioContext;
  private channels: Map<string, InstrumentChannel> = new Map();
  private tableEngine: TableEngine;
  private isRunning: boolean = false;
  private currentStep: number = 0;
  private bpm: number = 125;
  private timerId: number | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.tableEngine = new TableEngine();
  }

  public registerChannel(key: string, channel: InstrumentChannel): void {
    this.channels.set(key, channel);
  }

  public getTableEngine(): TableEngine {
    return this.tableEngine;
  }

  public start(): void {
    if (this.isRunning) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    this.isRunning = true;
    this.scheduleLoop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentStep = 0;
  }

  private scheduleLoop(): void {
    if (!this.isRunning) return;

    // Calculate step interval in milliseconds based on BPM (16th notes = 4 steps per beat)
    const stepIntervalMs = (60000 / this.bpm) / 4;

    // Execute current step tick and micro-modulation updates
    this.onSequencerTick(this.currentStep);

    // Advance sequence step (0-63 standard tracker pattern length)
    this.currentStep = (this.currentStep + 1) % 64;

    this.timerId = window.setTimeout(() => {
      this.scheduleLoop();
    }, stepIntervalMs);
  }

  private onSequencerTick(stepIndex: number): void {
    // 1. Tick micro-modulation tables for active voices and apply realtime modulation
    this.tableEngine.tickTables((voiceKey, command, value) => {
      const channel = this.channels.get(voiceKey);
      if (channel && typeof channel.applyModulation === 'function') {
        channel.applyModulation(command, value);
      }
    });
  }

  public triggerVoice(voiceKey: string, note: string, volume: number, tableId?: number): void {
    const channel = this.channels.get(voiceKey);
    if (channel) {
      channel.playBuffer(note, volume);
      if (tableId !== undefined) {
        this.tableEngine.triggerTable(voiceKey, tableId);
      }
    }
  }
}