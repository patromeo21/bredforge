// ============================================================================
// BREDFORGE v1.0 — PERFORMANCE MACRO & MOMENTARY LAYER (PerformanceMacroEngine.ts)
// ============================================================================

import { PunchInEffectBus, PunchInEffectType } from './PunchInEffectBus';

export type MacroMode = 'punchInFilter' | 'stutterRoll' | 'bitcrushSlam' | 'none';

export class PerformanceMacroEngine {
  private effectBus: PunchInEffectBus;
  private activeMacro: MacroMode = 'none';

  constructor(effectBus: PunchInEffectBus) {
    this.effectBus = effectBus;
  }

  public pressMacroButton(macro: MacroMode): void {
    this.activeMacro = macro;
    
    if (macro === 'punchInFilter') {
      this.effectBus.triggerPunchIn('filterSlam', true);
    } else if (macro === 'bitcrushSlam') {
      this.effectBus.triggerPunchIn('bitcrush', true);
    }
  }

  public releaseMacroButton(): void {
    if (this.activeMacro === 'punchInFilter') {
      this.effectBus.triggerPunchIn('filterSlam', false);
    } else if (this.activeMacro === 'bitcrushSlam') {
      this.effectBus.triggerPunchIn('bitcrush', false);
    }
    
    this.activeMacro = 'none';
  }

  public getActiveMacro(): MacroMode {
    return this.activeMacro;
  }
}