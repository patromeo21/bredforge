// ============================================================================
// BREDFORGE v1.0 — M8 PUNCH-IN TO SP-404SX DSP BRIDGE (M8PunchInBridge.ts)
// ============================================================================

import { PunchEffectId } from './m8PunchInMapping';

export interface PunchDSPNodeController {
  setEffectActive: (effectId: PunchEffectId, active: boolean) => void;
}

export class M8PunchInBridge {
  private controller: PunchDSPNodeController;
  private activeKeys: Set<string> = new Set();
  private isPunchMode: boolean = false;

  constructor(controller: PunchDSPNodeController) {
    this.controller = controller;
    this.bindEvents();
  }

  public setPunchMode(active: boolean) {
    this.isPunchMode = active;
    if (!active) {
      this.releaseAllEffects();
    }
  }

  private mapKeyToEffect(code: string): PunchEffectId | null {
    switch (code) {
      case 'ArrowUp': return 'DJFX';     // DJFX Looper
      case 'ArrowDown': return 'ISOL';   // 3-Band Isolator
      case 'ArrowLeft': return 'CHOR';   // Stereo Chorus
      case 'ArrowRight': return 'LOFI';  // Lo-Fi / Bitcrush
      case 'KeyZ': return 'VERB';        // Reverb Wash
      case 'KeyQ': return 'MUTE';        // Momentary Mute
      case 'KeyW': return 'SOLO';        // Momentary Solo
      default: return null;
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isPunchMode) return;

    const effectId = this.mapKeyToEffect(e.code);
    if (effectId && !this.activeKeys.has(e.code)) {
      e.preventDefault();
      this.activeKeys.add(e.code);
      this.controller.setEffectActive(effectId, true);
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (!this.isPunchMode) return;

    const effectId = this.mapKeyToEffect(e.code);
    if (effectId && this.activeKeys.has(e.code)) {
      e.preventDefault();
      this.activeKeys.delete(e.code);
      this.controller.setEffectActive(effectId, false);
    }
  };

  private releaseAllEffects() {
    this.activeKeys.forEach((code) => {
      const effectId = this.mapKeyToEffect(code);
      if (effectId) {
        this.controller.setEffectActive(effectId, false);
      }
    });
    this.activeKeys.clear();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}