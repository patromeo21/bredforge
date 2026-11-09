// ============================================================================
// BREDFORGE v1.0 — 8-BUTTON PUNCH-IN FX BUS & PERFORMANCE MATRIX [REF: FX-01]
// ============================================================================

import React, { useState } from 'react';

export interface FXEffect {
  id: string;
  name: string;
  keyBind: string;
  description: string;
  active: boolean;
}

interface PunchInFXBusProps {
  onTriggerFX?: (fxId: string, active: boolean) => void;
}

export function PunchInFXBus({ onTriggerFX }: PunchInFXBusProps) {
  const [effects, setEffects] = useState<FXEffect[]>([
    { id: 'tape', name: 'TAPE STOP', keyBind: 'E', description: 'Variable speed brake down', active: false },
    { id: 'djfx', name: 'DJFX LOOP', keyBind: 'R', description: 'Beat stutter & repeat', active: false },
    { id: 'isolator', name: '3-BAND ISO', keyBind: 'T', description: 'Low/Mid/High kill switches', active: false },
    { id: 'bitcrush', name: 'BITCRUSH', keyBind: 'Y', description: 'Sample rate & bit reduction', active: false },
    { id: 'reverb', name: 'REV WASH', keyBind: 'U', description: 'Instant ambient wash', active: false },
    { id: 'chorus', name: 'CHORUS', keyBind: 'I', description: 'Stereo doubling width', active: false },
    { id: 'mute', name: 'MOM MUTE', keyBind: 'O', description: 'Instant drop-out cut', active: false },
    { id: 'filter', name: 'SWEEP FLT', keyBind: 'P', description: 'Resonant LP/HP sweep', active: false },
  ]);

  const toggleFX = (id: string) => {
    setEffects((prev) =>
      prev.map((fx) => {
        if (fx.id === id) {
          const nextState = !fx.active;
          if (onTriggerFX) onTriggerFX(id, nextState);
          return { ...fx, active: nextState };
        }
        return fx;
      })
    );
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono select-none overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 mb-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded border border-amber-500/40">
            [FX-01]
          </span>
          <span className="font-bold tracking-wider text-xs text-zinc-200">
            PUNCH-IN FX BUS // LIVE PERFORMANCE MATRIX
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">MOMENTARY / LATCH // [KEY E: TAPE]</span>
      </div>

      {/* 8-Button Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 min-h-0">
        {effects.map((fx) => (
          <button
            key={fx.id}
            onMouseDown={() => toggleFX(fx.id)}
            onTouchStart={() => toggleFX(fx.id)}
            className={`flex flex-col justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
              fx.active
                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[0.98]'
                : 'bg-zinc-900/80 hover:bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                fx.active ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-800 text-amber-400'
              }`}>
                [{fx.keyBind}]
              </span>
              <span className={`w-2 h-2 rounded-full ${fx.active ? 'bg-zinc-950 animate-ping' : 'bg-zinc-800'}`}></span>
            </div>

            <div className="flex flex-col gap-0.5 my-2">
              <span className="font-bold text-xs tracking-wide">{fx.name}</span>
              <span className={`text-[9px] line-clamp-2 ${fx.active ? 'text-zinc-900 font-medium' : 'text-zinc-500'}`}>
                {fx.description}
              </span>
            </div>

            <div className="text-[8px] uppercase tracking-wider font-semibold opacity-70">
              {fx.active ? 'ACTIVE (PUNCHED)' : 'STANDBY'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PunchInFXBus;