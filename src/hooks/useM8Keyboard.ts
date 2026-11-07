// ============================================================================
// BREDFORGE v1.0 — M8 HARDWARE KEYBOARD & NAVIGATION HOOK (useM8Keyboard.ts)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { HardwareMode, MatrixCoordinate } from '../types/matrix';
import { PunchEffectId, M8_PUNCH_BUTTON_MAP } from '../services/audio/m8PunchInMapping';

interface UseM8KeyboardReturn {
  mode: HardwareMode;
  coord: MatrixCoordinate;
  activeEffects: Set<PunchEffectId>;
  activeMutes: boolean[];
  activeSolos: boolean[];
}

export const useM8Keyboard = (
  onCoordinateChange?: (coord: MatrixCoordinate) => void
): UseM8KeyboardReturn => {
  const [mode, setMode] = useState<HardwareMode>('NAV');
  const [coord, setCoord] = useState<MatrixCoordinate>({ x: 3, y: 1 }); // Default to Phrase View (3,1)
  const [activeEffects, setActiveEffects] = useState<Set<PunchEffectId>>(new Set());
  const [activeMutes, setActiveMutes] = useState<boolean[]>(Array(8).fill(false));
  const [activeSolos, setActiveSolos] = useState<boolean[]>(Array(8).fill(false));

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 1. Global Mode Toggle via Tab
    if (e.code === 'Tab') {
      e.preventDefault();
      setMode(prev => (prev === 'NAV' ? 'PUNCH' : 'NAV'));
      setActiveEffects(new Set());
      return;
    }

    // 2. Punch-In Mode Handling
    if (mode === 'PUNCH') {
      const mapping = M8_PUNCH_BUTTON_MAP[e.code];
      if (mapping) {
        e.preventDefault();
        setActiveEffects(prev => {
          const next = new Set(prev);
          next.add(mapping.effect);
          return next;
        });
        return;
      }
    }

    // 3. Navigation & Spatial Matrix Handling (NAV Mode)
    if (mode === 'NAV') {
      if (e.shiftKey) {
        let { x, y } = coord;
        if (e.code === 'ArrowUp') y = Math.max(0, y - 1);
        if (e.code === 'ArrowDown') y = Math.min(3, y + 1);
        if (e.code === 'ArrowLeft') x = Math.max(0, x - 1);
        if (e.code === 'ArrowRight') x = Math.min(5, x + 1);

        if (x !== coord.x || y !== coord.y) {
          e.preventDefault();
          const nextCoord = { x, y };
          setCoord(nextCoord);
          if (onCoordinateChange) onCoordinateChange(nextCoord);
          return;
        }
      }
    }
  }, [mode, coord, onCoordinateChange]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (mode === 'PUNCH') {
      const mapping = M8_PUNCH_BUTTON_MAP[e.code];
      if (mapping) {
        e.preventDefault();
        setActiveEffects(prev => {
          const next = new Set(prev);
          next.delete(mapping.effect);
          return next;
        });
      }
    }
  }, [mode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    mode,
    coord,
    activeEffects,
    activeMutes,
    activeSolos,
  };
};