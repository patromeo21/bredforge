// ============================================================================
// BREDFORGE v1.0 — 8-CHANNEL DECOUPLED DSP MIXER MATRIX [REF: MIX-08]
// ============================================================================

import React, { useState } from 'react';

export function MixerMatrix() {
  const [channels, setChannels] = useState([
    { id: 1, name: 'CHANNEL 1', volume: 85, pan: 0, mute: false, solo: false },
    { id: 2, name: 'CHANNEL 2', volume: 80, pan: 0, mute: false, solo: false },
    { id: 3, name: 'CHANNEL 3', volume: 75, pan: 10, mute: false, solo: false },
    { id: 4, name: 'CHANNEL 4', volume: 70, pan: -10, mute: false, solo: false },
    { id: 5, name: 'CHANNEL 5', volume: 85, pan: 0, mute: false, solo: false },
    { id: 6, name: 'CHANNEL 6', volume: 80, pan: 15, mute: false, solo: false },
    { id: 7, name: 'CHANNEL 7', volume: 75, pan: -15, mute: false, solo: false },
    { id: 8, name: 'MASTER', volume: 90, pan: 0, mute: false, solo: false },
  ]);

  const handleVolumeChange = (id: number, val: number) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, volume: val } : c)));
  };

  const handlePanChange = (id: number, val: number) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, pan: val } : c)));
  };

  const toggleMute = (id: number) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, mute: !c.mute } : c)));
  };

  const toggleSolo = (id: number) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, solo: !c.solo } : c)));
  };

  const resetChannel = (id: number) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, volume: 85, pan: 0 } : c)));
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono select-none overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 mb-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-emerald-500/25 text-emerald-400 text-[10px] rounded border border-emerald-500/40">
            [MIX-08]
          </span>
          <span className="font-bold tracking-wider text-xs text-zinc-200">
            8-CHANNEL DECOUPLED DSP MIXER MATRIX
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">DOUBLE-TAP CHANNEL TO RESET // CH 1-7 + MASTER</span>
      </div>

      {/* 8 Channel Strips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 flex-1 min-h-0 overflow-y-auto">
        {channels.map((ch) => (
          <div
            key={ch.id}
            onDoubleClick={() => resetChannel(ch.id)}
            className={`flex flex-col justify-between border rounded-lg p-2.5 text-xs relative group transition-all ${
              ch.id === 8 
                ? 'bg-zinc-900/90 border-amber-500/40 hover:border-amber-500/60' 
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex justify-between items-center pb-1.5 border-b border-zinc-800/60">
              <span className={`font-bold text-[11px] ${ch.id === 8 ? 'text-amber-400' : 'text-zinc-300'}`}>
                {ch.id === 8 ? 'MASTER' : `CH 0${ch.id}`}
              </span>
              <span className="text-[8px] text-zinc-500 uppercase tracking-wider">{ch.id === 8 ? 'BUS' : 'DECOUPLED'}</span>
            </div>

            {/* Live Meter LED Visual */}
            <div className="flex justify-center items-center py-2">
              <div className="w-2.5 h-20 bg-zinc-950 rounded border border-zinc-800 relative overflow-hidden flex flex-col justify-end">
                <div
                  className={`w-full transition-all duration-75 shadow-[0_0_8px_rgba(16,185,129,0.5)] ${
                    ch.id === 8 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500'
                  }`}
                  style={{ height: `${ch.mute ? 0 : ch.volume}%` }}
                ></div>
              </div>
            </div>

            {/* Fader & Pan Controls */}
            <div className="flex flex-col gap-1 text-[10px] text-zinc-400 text-center">
              <div className="flex justify-between">
                <span>VOL</span>
                <span className="text-zinc-200">{ch.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ch.volume}
                onChange={(e) => handleVolumeChange(ch.id, Number(e.target.value))}
                className="accent-amber-500 cursor-pointer h-1 bg-zinc-800 rounded"
              />

              <div className="flex justify-between mt-1">
                <span>PAN</span>
                <span className="text-zinc-200">{ch.pan}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={ch.pan}
                onChange={(e) => handlePanChange(ch.id, Number(e.target.value))}
                className="accent-amber-500 cursor-pointer h-1 bg-zinc-800 rounded"
              />
            </div>

            {/* Mute / Solo Buttons */}
            <div className="grid grid-cols-2 gap-1 pt-2 border-t border-zinc-800/60 mt-1">
              <button
                onClick={() => toggleMute(ch.id)}
                className={`py-1 text-[9px] font-bold rounded cursor-pointer transition-all ${
                  ch.mute
                    ? 'bg-red-950 text-red-400 border border-red-800'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                M
              </button>
              <button
                onClick={() => toggleSolo(ch.id)}
                className={`py-1 text-[9px] font-bold rounded cursor-pointer transition-all ${
                  ch.solo
                    ? 'bg-amber-500 text-zinc-950 font-extrabold shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
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
}

export default MixerMatrix;