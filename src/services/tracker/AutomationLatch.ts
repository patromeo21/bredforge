// ============================================================================
// STAGE F - PHASE 35: HIGH-PRECISION QUANTIZED AUTOMATION LATCH ENGINE
// ============================================================================

import { ProjectStateSchema } from './TrackerState';

export interface AutomationPacket {
  fxType: string;
  fxValue: number;
}

export class AutomationLatch {
  /**
   * Calculates the exact mathematical target step index (0-15) based on audio clock micro-time offsets.
   */
  public static calculateTargetRow(
    playbackTime: number,
    startTime: number,
    bpm: number
  ): number {
    const secondsPerBeat = 60.0 / bpm;
    const secondsPerStep = secondsPerBeat * 0.25;
    const elapsed = playbackTime - startTime;
    
    if (elapsed <= 0) return 0;
    
    // Round to the nearest whole step row index relative to a standard 16-step grid
    const preciseRow = elapsed / secondsPerStep;
    const roundedRow = Math.round(preciseRow) % 16;
    
    return roundedRow;
  }

  /**
   * Immutably injects live captured performance parameter values directly into active phrase blocks
   */
  public static injectAutomation(
    currentState: ProjectStateSchema,
    targetRow: number,
    packet: AutomationPacket,
    activePhraseId: string
  ): ProjectStateSchema {
    // Deep clone state safely to prevent mutating React props directly
    const updatedState = JSON.parse(JSON.stringify(currentState));
    
    if (!updatedState.phrases || !updatedState.phrases[activePhraseId]) {
      return currentState;
    }
    
    const phraseSteps = updatedState.phrases[activePhraseId];
    const targetStep = phraseSteps[targetRow];
    
    if (targetStep) {
      targetStep.fxType = packet.fxType;
      targetStep.fxParam = packet.fxValue;
    }
    
    return updatedState;
  }
}
