// ============================================================================
// BREDFORGE v1.0 — SEQUENCER AUDIO BRIDGE (SequencerAudioBridge.ts)
// ============================================================================

import { SequencerEngine, TrackerStep } from './SequencerEngine';

export interface InstrumentChannel {
  id: number;
  playBuffer(note: string, volume: number): void;
}

export class SequencerAudioBridge {
  private sequencer: SequencerEngine;
  private channels: Map<number, InstrumentChannel> = new Map();

  constructor(sequencer: SequencerEngine) {
    this.sequencer = sequencer;
    
    // Bind the step trigger callback directly to our channel dispatcher
    this.sequencer.setOnStep((step: TrackerStep, row: number) => {
      this.handleStepTrigger(step, row);
    });
  }

  public registerChannel(channelId: number, channel: InstrumentChannel) {
    this.channels.set(channelId, channel);
  }

  private handleStepTrigger(step: TrackerStep, row: number) {
    // Skip empty steps or rests
    if (!step.note || step.note === '---' || step.instrument <= 0) {
      return;
    }

    const channel = this.channels.get(step.instrument);
    if (channel) {
      // Trigger sample/instrument playback on the designated track channel
      channel.playBuffer(step.note, step.volume);
    }
  }
}