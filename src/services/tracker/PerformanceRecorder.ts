// ============================================================================
// STAGE B - PHASE 16: RUNTIME LATCH RECORDING EVENT STREAMER (PerformanceRecorder.ts)
// ============================================================================

import { ProjectStateSchema, UserPadFXMap } from './TrackerState';

export class PerformanceRecorder {
  // ============================================================================
  // PHASE 16: IMMUTABLE LIVE PAD STRIKE RECORDING LATCH UTILITY
  // ============================================================================
  public static recordLivePadStrike(
    projectState: ProjectStateSchema,
    activePhraseId: string,
    currentStep: number,
    padIndex: number,
    fxMap: UserPadFXMap
  ): ProjectStateSchema {
    if (!projectState || !projectState.phrases) {
      return projectState;
    }

    const targetPhrase = projectState.phrases[activePhraseId];
    if (!targetPhrase) {
      return projectState;
    }

    // Lookup macro configuration bound to this physical pad index
    const padConfig = fxMap[padIndex] || { fxType: 'bypass', defaultParam: 0.0 };

    // Create an immutable clone of the phrases dictionary and target phrase step array
    const updatedPhrases = { ...projectState.phrases };
    const updatedSteps = targetPhrase.map((stepItem) => {
      if (stepItem.step === currentStep) {
        return {
          ...stepItem,
          padId: padIndex,
          fxType: padConfig.fxType,
          fxParam: padConfig.defaultParam,
        };
      }
      return stepItem;
    });

    updatedPhrases[activePhraseId] = updatedSteps;

    return {
      ...projectState,
      phrases: updatedPhrases,
      timestamp: Date.now(),
    };
  }
}