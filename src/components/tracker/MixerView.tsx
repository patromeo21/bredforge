// ============================================================================
// STAGE F - PAGE 2 SUB: HARDWARE MIXER & LEVEL METERS (MixerView.tsx)
// ============================================================================

import React, { useState } from 'react';

export interface ChannelStrip {
  id: number;
  name: string;
  volume: number; // 0 to 100
  pan: string;    // L50 to R50
  muted: boolean;
  soloed: boolean;
}

export const MixerView: React.FC = () => {
  const [channels, setChannels] = useState<ChannelStrip[]>([
    { id: 1, name: 'TRK 1', volume: 85, pan: 'C', muted: false, soloed: false },
    { id: 2, name: 'TRK 2', volume: 70, pan: 'L15', muted: false, soloed: false },
    { id: 3, name: 'TRK 3', volume: 90, pan: 'R30', muted: false, soloed: false },
    { id: 4, name: 'TRK 4', volume: 60, pan: 'C', muted: true, soloed: false },
  ]);

  const toggleMute = (id: number) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c))
    );
  };

  const toggleSolo = (id: number) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, soloed: !c.soloed } : c))
    );
  };

  const handleVolumeChange = (id: number, newVol: number) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, volume: newVol } : c))
    );
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border border-emerald-500/20 rounded p-2 font-mono text-[11px] overflow-hidden">
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-emerald-500/20">
        <span className="text-emerald-400 font-bold tracking-wider">[ HARDWARE MIXER STRIPS ]</span>
        <span className="text-[9px] text-emerald-600">4-CH DSP GAIN</span>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-2 overflow-hidden">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="flex flex-col justify-between bg-zinc-950/80 border border-emerald-500/20 rounded p-2 items-center"
          >
            {/* Channel Header */}
            <span className="text-[10px] font-bold text-emerald-400">{ch.name}</span>

            {/* Visual Level Meter & Fader Track */}
            <div className="flex-1 flex gap-2 items-center my-2">
              {/* Level Meter Bar (Lightweight CSS Gradient) */}
              <div className="w-2 h-full bg-zinc-900 border border-zinc-800 rounded-sm relative overflow-hidden flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-emerald-600 via-emerald-400 to-amber-400 transition-all duration-75"
                  style={{ height: ch.muted ? '0%' : `${ch.volume}%` }}
                />
              </div>

              {/* Vertical Range Slider */}
              <div className="h-full flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ch.volume}
                  onChange={(e) => handleVolumeChange(ch.id, Number(e.target.value))}
                  className="accent-emerald-500 h-full w-3 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                />
              </div>
            </div>

            {/* Volume Value & Pan */}
            <div className="flex flex-col items-center gap-0.5 mb-2 text-[9px]">
              <span className="text-emerald-300">VOL:{ch.volume}</span>
              <span className="text-emerald-600">PAN:{ch.pan}</span>
            </div>

            {/* Mute / Solo Channel Switches */}
            <div className="flex flex-col gap-1 w-full">
              <button
                onClick={() => toggleMute(ch.id)}
                className={`py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                  ch.muted
                    ? 'bg-red-600 text-white border-red-500 shadow-[0_0_6px_rgba(220,38,38,0.5)]'
                    : 'bg-black/50 text-red-500/70 border-red-900/40 hover:border-red-500/40'
                }`}
              >
                M
              </button>
              <button
                onClick={() => toggleSolo(ch.id)}
                className={`py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                  ch.soloed
                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                    : 'bg-black/50 text-amber-500/70 border-amber-900/40 hover:border-amber-500/40'
                }`}
              >
                S
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};