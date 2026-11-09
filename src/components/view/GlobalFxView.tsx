// ============================================================================
// BREDFORGE v1.0 — GLOBAL FX LABORATORY & MIDI CC MAPPING [REF: FX-01]
// ============================================================================

import React, { useState, useEffect } from 'react';
import { midiService } from '../../services/MidiService';

interface FxMacro {
  id: number;
  name: string;
  ccNumber: number;
  value: number; // 0 - 100
  color: string;
}

export function GlobalFxView() {
  const [macros, setMacros] = useState<FxMacro[]>([
    { id: 1, name: 'BITCRUSH', ccNumber: 70, value: 0, color: 'text-amber-400 border-amber-500/60 bg-amber-500/10' },
    { id: 2, name: 'LPF CUTOFF', ccNumber: 71, value: 100, color: 'text-emerald-400 border-emerald-500/60 bg-emerald-500/10' },
    { id: 3, name: 'RESONANCE', ccNumber: 72, value: 25, color: 'text-sky-400 border-sky-500/60 bg-sky-500/10' },
    { id: 4, name: 'DELAY SEND', ccNumber: 73, value: 40, color: 'text-purple-400 border-purple-500/60 bg-purple-500/10' },
    { id: 5, name: 'REVERB SEND', ccNumber: 74, value: 50, color: 'text-pink-400 border-pink-500/60 bg-pink-500/10' },
    { id: 6, name: 'DISTORTION', ccNumber: 75, value: 10, color: 'text-red-400 border-red-500/60 bg-red-500/10' },
    { id: 7, name: 'PITCH SHIFT', ccNumber: 76, value: 50, color: 'text-yellow-400 border-yellow-500/60 bg-yellow-500/10' },
    { id: 8, name: 'SAMPLE RATE', ccNumber: 77, value: 100, color: 'text-teal-400 border-teal-500/60 bg-teal-500/10' },
  ]);

  const [activeCc, setActiveCc] = useState<number | null>(null);

  // Listen for MIDI CC messages and update corresponding macro knob
  useEffect(() => {
    const unsubscribe = midiService.onControlChange((controller, value) => {
      // Map MIDI 0-127 value to 0-100 percentage
      const normalizedValue = Math.round((value / 127) * 100);

      setMacros((prevMacros) =>
        prevMacros.map((macro) =>
          macro.ccNumber === controller ? { ...macro, value: normalizedValue } : macro
        )
      );

      setActiveCc(controller);
      setTimeout(() => {
        setActiveCc((curr) => (curr === controller ? null : curr));
      }, 150);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSliderChange = (id: number, val: number) => {
    setMacros((prev) =>
      prev.map((m) => (m.id === id ? { ...m, value: val } : m))
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-3 gap-3 select-none overflow-hidden border border-zinc-800 rounded-lg">
      
      {/* Header & Status */}
      <div className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-lg shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            GLOBAL FX LABORATORY // PUNCH-IN MACROS
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            MIDI CC MAPPED (70 - 77)
          </span>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
          <span className={`w-2 h-2 rounded-full ${activeCc !== null ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-zinc-600'}`} />
          <span className="text-[10px] text-zinc-300">
            {activeCc !== null ? `CC ${activeCc} RECEIVED` : 'READY FOR KNOB TWEEKS'}
          </span>
        </div>
      </div>

      {/* 8 Macro Knobs Grid */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 p-1 overflow-y-auto">
        {macros.map((macro) => {
          const isReceiving = activeCc === macro.ccNumber;
          return (
            <div
              key={macro.id}
              className={`flex flex-col justify-between p-3.5 bg-zinc-900/40 border rounded-xl transition-all ${
                isReceiving
                  ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[0.98]'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-400">
                  FX 0{macro.id}
                </span>
                <span className="text-[9px] bg-zinc-950 px-1.5 py-0.5 rounded text-amber-400 border border-zinc-800">
                  CC {macro.ccNumber}
                </span>
              </div>

              <div className="flex flex-col items-center my-3 gap-2">
                <span className="text-xs font-bold tracking-wide text-zinc-200">
                  {macro.name}
                </span>
                <div className="text-2xl font-extrabold text-amber-400 font-mono">
                  {macro.value}%
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={macro.value}
                  onChange={(e) => handleSliderChange(macro.id, Number(e.target.value))}
                  className="accent-amber-500 cursor-pointer h-1.5 bg-zinc-950 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[8px] text-zinc-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[9px] text-zinc-500 px-1 shrink-0">
        <span>External hardware knobs sending CC 70-77 control macros instantly.</span>
        <span className="text-emerald-400 font-bold">DSP REAL-TIME ROUTING ACTIVE</span>
      </div>

    </div>
  );
}

export default GlobalFxView;
