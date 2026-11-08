// ============================================================================
// BREDFORGE v1.0 — MIXER MATRIX [2,0] (MixerMatrix.tsx)
// ============================================================================

import React, { useState } from 'react';

interface Channel {
  id: number;
  name: string;
  volume: number; // 0 - 100
  pan: number;    // -50 (L) to +50 (R)
  muted: boolean;
  soloed: boolean;
}

export function MixerMatrix() {
  const [channels, setChannels] = useState<Channel[]>([
    { id: 1, name: 'TRK 1 [KICK]', volume: 85, pan: 0, muted: false, soloed: false },
    { id: 2, name: 'TRK 2 [SNARE]', volume: 75, pan: -10, muted: false, soloed: false },
    { id: 3, name: 'TRK 3 [CHORD]', volume: 65, pan: 15, muted: false, soloed: false },
    { id: 4, name: 'TRK 4 [LEAD]', volume: 90, pan: 0, muted: false, soloed: false },
  ]);

  const updateChannel = (id: number, updates: Partial<Channel>) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, ...updates } : ch));
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs select-none overflow-hidden">
      
      {/* Matrix Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold">
            [2,0]
          </span>
          <span className="font-bold tracking-wider text-zinc-200">MIXER & BUS MATRIX</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          4-CHANNEL DSP BUS
        </div>
      </div>

      {/* Channels Grid View */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 overflow-y-auto">
        {channels.map((ch) => (
          <div 
            key={ch.id} 
            className={`flex flex-col justify-between p-3 rounded-lg border transition-colors ${
              ch.muted 
                ? 'bg-zinc-900/30 border-zinc-800 opacity-50' 
                : ch.soloed 
                ? 'bg-amber-500/10 border-amber-500/50' 
                : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {/* Channel Top Header */}
            <div className="flex flex-col gap-1">
              <div className="text-[10px] text-emerald-400 font-bold">CH 0{ch.id}</div>
              <div className="text-zinc-200 font-bold truncate">{ch.name}</div>
            </div>

            {/* Fader & Value Display */}
            <div className="flex flex-col items-center my-4 gap-2">
              <div className="text-zinc-400 font-bold text-sm">{ch.volume}%</div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={ch.volume}
                onChange={(e) => updateChannel(ch.id, { volume: Number(e.target.value) })}
                className="w-full accent-emerald-500 bg-zinc-800 h-1 rounded cursor-pointer"
              />
              <div className="flex justify-between w-full text-[9px] text-zinc-500 px-1">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Pan & Controls */}
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/80">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-400">PAN</span>
                <span className="text-zinc-200">{ch.pan < 0 ? `L${Math.abs(ch.pan)}` : ch.pan > 0 ? `R${ch.pan}` : 'C'}</span>
              </div>
              
              {/* Mute / Solo Toggles */}
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <button
                  onClick={() => updateChannel(ch.id, { muted: !ch.muted })}
                  className={`py-1 rounded font-bold text-[10px] transition-colors border ${
                    ch.muted 
                      ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  MUTE
                </button>
                <button
                  onClick={() => updateChannel(ch.id, { soloed: !ch.soloed })}
                  className={`py-1 rounded font-bold text-[10px] transition-colors border ${
                    ch.soloed 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  SOLO
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default MixerMatrix;