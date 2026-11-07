// ============================================================================
// BREDFORGE v1.0 — PERSISTENT M8 HARDWARE HUD (M8HardwareHUD.tsx)
// ============================================================================

import React from 'react';
import { HardwareMode, MatrixCoordinate } from '../../types/matrix';
import { PunchEffectId } from '../../services/audio/m8PunchInMapping';

interface M8HardwareHUDProps {
  mode: HardwareMode;
  coord: MatrixCoordinate;
  activeEffects: Set<PunchEffectId>;
  activeMutes: boolean[];
  activeSolos: boolean[];
  screenTitle?: string;
  screenId?: string;
  children: React.ReactNode;
}

const SCREEN_GRID_LABELS: Record<string, string> = {
  '1,0': 'PROJECT (P)',
  '3,0': 'GROOVE (G)',
  '0,1': 'LIVE (L)',
  '1,1': 'SONG (S)',
  '2,1': 'CHAIN (C)',
  '3,1': 'PHRASE (P)',
  '4,1': 'INSTRUMENT (I)',
  '5,1': 'TABLE (T)',
  '1,2': 'MIXER (V)',
  '2,2': 'MIXER (V)',
  '3,2': 'MIXER (V)',
  '4,2': 'MIXER (V)',
  '5,2': 'MIXER (V)',
  '1,3': 'GLOBAL FX (X)',
  '2,3': 'GLOBAL FX (X)',
  '3,3': 'GLOBAL FX (X)',
  '4,3': 'GLOBAL FX (X)',
  '5,3': 'GLOBAL FX (X)',
};

export const M8HardwareHUD: React.FC<M8HardwareHUDProps> = ({
  mode,
  coord,
  activeEffects,
  activeMutes,
  activeSolos,
  screenTitle = 'PHRASE VIEW',
  screenId = '03',
  children,
}) => {
  const coordKey = `${coord.x},${coord.y}`;
  const currentScreenLabel = SCREEN_GRID_LABELS[coordKey] || 'UNKNOWN VIEW';

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-mono select-none overflow-hidden border-4 border-slate-900">
      {/* TOP HUD BAR */}
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        {/* Top-Left: Screen Header & Mode Badge */}
        <div className="flex items-center gap-3">
          <span className="font-bold text-emerald-400">BRDF-01 // {screenTitle}</span>
          <span className="text-slate-500">[{screenId}]</span>
          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
            mode === 'PUNCH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
          }`}>
            [MODE: {mode}]
          </span>
        </div>

        {/* Top-Right: 8-Column Voice Activity & Mute/Solo Monitor */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-slate-500 mr-2">VOICES:</span>
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className={`px-1.5 py-0.5 rounded border ${
                activeMutes[idx]
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : activeSolos[idx]
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {idx + 1}:{activeMutes[idx] ? 'M' : activeSolos[idx] ? 'S' : 'C'}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 overflow-auto p-4 bg-slate-950 relative">
        {children}
      </div>

      {/* BOTTOM SP-404SX PUNCH-IN STATUS BAR & MINI-MAP */}
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-t border-slate-800 text-xs">
        {/* SP-404SX Active FX Punch-In Status Bar */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[10px]">PUNCH FX:</span>
          {(['DJFX', 'ISOL', 'CHOR', 'LOFI', 'VERB'] as PunchEffectId[]).map((fx) => {
            const isActive = activeEffects.has(fx);
            return (
              <span
                key={fx}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                    : 'bg-slate-950 text-slate-600 border-slate-800'
                }`}
              >
                {fx}
              </span>
            );
          })}
        </div>

        {/* Bottom-Right: 2D Spatial Mini-Map */}
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex flex-col items-end">
            <span className="text-slate-300 font-bold">{currentScreenLabel}</span>
            <span className="text-slate-500">COORD: (X:{coord.x}, Y:{coord.y})</span>
          </div>
          <div className="grid grid-cols-6 gap-0.5 bg-slate-950 p-1 border border-slate-800 rounded">
            {Array.from({ length: 4 }).map((_, row) =>
              Array.from({ length: 6 }).map((_, col) => {
                const isCurrent = coord.x === col && coord.y === row;
                return (
                  <div
                    key={`${col},${row}`}
                    className={`w-2 h-2 rounded-xs ${
                      isCurrent ? 'bg-emerald-400' : 'bg-slate-800'
                    }`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};