// ============================================================================
// BREDFORGE v1.0 — GLOBAL SP-404SX FX PARAMETER VIEW (GlobalFxView.tsx) [COORD: (1..5, 3)]
// ============================================================================

import React from 'react';

interface FxModule {
  name: string;
  code: string;
  ctrl1: string; // Hex CTRL 1
  ctrl2: string; // Hex CTRL 2
  ctrl3: string; // Hex CTRL 3
  status: 'READY' | 'ACTIVE';
}

export const GlobalFxView: React.FC = () => {
  const fxModules: FxModule[] = [
    { name: 'DJFX LOOPER', code: 'DJFX', ctrl1: '80', ctrl2: '40', ctrl3: 'FE', status: 'READY' },
    { name: '3-BAND ISOLATOR', code: 'ISOL', ctrl1: 'C0', ctrl2: '80', ctrl3: 'C0', status: 'READY' },
    { name: 'STEREO CHORUS', code: 'CHOR', ctrl1: '60', ctrl2: '90', ctrl3: '40', status: 'READY' },
    { name: 'LO-FI / BITCRUSH', code: 'LOFI', ctrl1: 'A0', ctrl2: '7F', ctrl3: '50', status: 'READY' },
    { name: 'DUB REVERB WASH', code: 'VERB', ctrl1: '70', ctrl2: 'C8', ctrl3: 'A0', status: 'READY' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl select-none font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-slate-100 text-sm tracking-wider">
            GLOBAL SP-404SX FX DSP MATRIX
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            CTRL 1/2/3 Hex Parameter Adjustments for Live Performance Punch-Ins
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold">
          GLOBAL FX (X)
        </span>
      </div>

      {/* FX Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-auto">
        {fxModules.map((fx) => (
          <div
            key={fx.code}
            className="flex flex-col justify-between bg-slate-900/60 border border-slate-800 p-3 rounded-xl"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">{fx.name}</span>
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] text-amber-400 font-bold">
                [{fx.code}]
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-3 text-center">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[8px] text-slate-500">CTRL 1</div>
                <div className="text-emerald-400 font-bold text-sm">{fx.ctrl1}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[8px] text-slate-500">CTRL 2</div>
                <div className="text-cyan-400 font-bold text-sm">{fx.ctrl2}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[8px] text-slate-500">CTRL 3</div>
                <div className="text-purple-400 font-bold text-sm">{fx.ctrl3}</div>
              </div>
            </div>

            <div className="text-[9px] text-slate-500 text-right">
              MODE: MOMENTARY / LATCH
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};