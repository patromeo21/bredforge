// ============================================================================
// BREDFORGE v1.0 — MIXER VIEW (MixerView.tsx) [COORD: (1..5, 2)]
// ============================================================================

import React, { useState } from 'react';

interface TrackFader {
  id: number;
  gainHex: string; // 00 to FF
  panHex: string;  // 00 (L) - 80 (C) - FF (R)
  levelDb: number; // Peak readout
}

export const MixerView: React.FC = () => {
  const [faders] = useState<TrackFader[]>(
    Array.from({ length: 8 }).map((_, idx) => ({
      id: idx + 1,
      gainHex: 'C0',
      panHex: '80',
      levelDb: -6 - idx * 1.5,
    }))
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl select-none font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-slate-100 text-sm tracking-wider">
            8-TRACK MIXER & STEPPED VU METERS
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            Independent Track Gain, Hex Pan Offsets & Real-Time Peak Monitoring
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/40 text-[10px] font-bold">
          MIXER (V)
        </span>
      </div>

      {/* 8 Track Fader Columns */}
      <div className="grid grid-cols-8 gap-3 flex-1 overflow-auto bg-slate-900/40 p-3 border border-slate-800 rounded-xl">
        {faders.map((trk) => (
          <div
            key={trk.id}
            className="flex flex-col items-center justify-between bg-slate-950 border border-slate-800 p-2 rounded-lg"
          >
            <div className="text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1 w-full text-center">
              TRK 0{trk.id}
            </div>

            {/* Stepped Peak Meter Bar */}
            <div className="w-full flex-1 my-3 flex justify-center items-end bg-slate-900 rounded p-1 border border-slate-800/80 relative overflow-hidden">
              <div
                className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 rounded-xs transition-all duration-75"
                style={{ height: `${Math.min(100, Math.max(10, 80 + trk.levelDb * 4))}%` }}
              />
            </div>

            {/* Hex Controls */}
            <div className="flex flex-col gap-1 w-full text-[10px] text-center">
              <div className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[8px]">GAIN: </span>
                <span className="text-emerald-400 font-bold">{trk.gainHex}</span>
              </div>
              <div className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[8px]">PAN: </span>
                <span className="text-cyan-400 font-bold">{trk.panHex}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};