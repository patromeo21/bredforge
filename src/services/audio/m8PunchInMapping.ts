// ============================================================================
// BREDFORGE v1.0 — M8 PUNCH-IN FX & TACTILE BUTTON ROUTING (m8PunchInMapping.ts)
// ============================================================================

export type HardwareMode = 'NAV' | 'PUNCH';

export type PunchEffectId = 'DJFX' | 'ISOL' | 'CHOR' | 'LOFI' | 'VERB' | 'MUTE' | 'SOLO';

interface PunchMappingConfig {
  key: string;
  code: string;
  effect: PunchEffectId;
  label: string;
}

export const M8_PUNCH_BUTTON_MAP: Record<string, PunchMappingConfig> = {
  ArrowUp: { key: 'ArrowUp', code: 'UP', effect: 'DJFX', label: 'DJFX Looper' },
  ArrowDown: { key: 'ArrowDown', code: 'DOWN', effect: 'ISOL', label: 'Isolator' },
  ArrowLeft: { key: 'ArrowLeft', code: 'LEFT', effect: 'CHOR', label: 'Chorus' },
  ArrowRight: { key: 'ArrowRight', code: 'RIGHT', effect: 'LOFI', label: 'Lo-Fi' },
  KeyZ: { key: 'z', code: 'OPTION', effect: 'VERB', label: 'Reverb Wash' },
  KeyQ: { key: 'q', code: 'MUTE', effect: 'MUTE', label: 'Momentary Mute' },
  KeyW: { key: 'w', code: 'SOLO', effect: 'SOLO', label: 'Momentary Solo' },
};

export class M8PunchInRouter {
  private mode: HardwareMode = 'NAV';
  private activeEffects: Set<PunchEffectId> = new Set();
  private latchedEffects: Set<PunchEffectId> = new Set();
  private onStateChange?: (mode: HardwareMode, active: Set<PunchEffectId>) => void;

  constructor(onStateChange?: (mode: HardwareMode, active: Set<PunchEffectId>) => void) {
    this.onStateChange = onStateChange;
  }

  public getMode(): HardwareMode {
    return this.mode;
  }

  public toggleMode(): HardwareMode {
    this.mode = this.mode === 'NAV' ? 'PUNCH' : 'NAV';
    this.notifyState();
    return this.mode;
  }

  public handleKeyDown(e: KeyboardEvent): boolean {
    // Global Mode Toggle via Tab
    if (e.code === 'Tab') {
      e.preventDefault();
      this.toggleMode();
      return true;
    }

    if (this.mode !== 'PUNCH') return false;

    const mapping = M8_PUNCH_BUTTON_MAP[e.code];
    if (mapping) {
      e.preventDefault();
      if (!this.activeEffects.has(mapping.effect)) {
        this.activeEffects.add(mapping.effect);
        this.notifyState();
      }
      return true;
    }

    return false;
  }

  public handleKeyUp(e: KeyboardEvent): boolean {
    if (this.mode !== 'PUNCH') return false;

    const mapping = M8_PUNCH_BUTTON_MAP[e.code];
    if (mapping) {
      e.preventDefault();
      // If not latched via Shift, remove from active on release (SP-404 momentary style)
      if (!this.latchedEffects.has(mapping.effect)) {
        this.activeEffects.delete(mapping.effect);
        this.notifyState();
      }
      return true;
    }

    return false;
  }

  private notifyState() {
    if (this.onStateChange) {
      this.onStateChange(this.mode, new Set(this.activeEffects));
    }
  }
}