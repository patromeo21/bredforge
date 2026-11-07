// ============================================================================
// BREDFORGE v1.0 — PROJECT VIEW (ProjectView.tsx) [COORD: (1,0)]
// ============================================================================

import React, { useState } from 'react';

export const ProjectView: React.FC = () => {
  const [bpm, setBpm] = useState<number>(94);
  const [masterVolumeHex, setMasterVolumeHex] = useState<string>('E0');
  const [activeTheme, setActiveTheme] = useState<string>('MONO_CLASSIC');

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl select-none font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-slate-100 text-sm tracking-wider">
            PROJECT GLOBAL CONFIGURATION
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            Master Clock Tempo, Global Output Gain & Theme RGB Palettes
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[10px] font-bold">
          PROJECT (1,0)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-auto">
        {/* Global Settings Card */}
        <div className="flex flex-col gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl justify-between">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1">
              MASTER AUDIO ENGINE
            </span>

            <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-slate-400">TEMPO (BPM):</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBpm((b) => Math.max(40, b - 1))}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 text-slate-300 rounded hover:bg-slate-800"
                >
                  -
                </button>
                <span className="text-emerald-400 font-bold text-base px-2">{bpm}</span>
                <button
                  onClick={() => setBpm((b) => Math.min(300, b + 1))}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 text-slate-300 rounded hover:bg-slate-800"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-slate-400">MASTER GAIN:</span>
              <span className="text-cyan-400 font-bold text-base">{masterVolumeHex}</span>
            </div>
          </div>

          <div className="text-[9px] text-slate-500">
            SYSTEM STATUS: OPERATIONAL // 0MS FRAME-CUT ACTIVE
          </div>
        </div>

        {/* RGB Theme Selector Card */}
        <div className="flex flex-col gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1">
            RGB PALETTE SELECTOR
          </span>

          <div className="flex flex-col gap-2">
            {[
              { id: 'MONO_CLASSIC', name: 'M8 Monochrome Classic' },
              { id: 'CYBER_AMBER', name: 'Amber Hardware CRT' },
              { id: 'NEON_SP', name: 'SP-404 High Contrast' },
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={() => setActiveTheme(theme.id)}
                className={`flex justify-between items-center p-3 rounded border transition-colors ${
                  activeTheme === theme.id
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>{theme.name}</span>
                <span className="text-[10px]">{activeTheme === theme.id ? '[ACTIVE]' : '[SELECT]'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};