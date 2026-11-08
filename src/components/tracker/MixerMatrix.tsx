// ============================================================================
// BREDFORGE v1.0 — TACTILE MIXER MATRIX (FIXED DEFAULT VOLUME) [REF: M62]
// ============================================================================

import React, { useState, useRef } from 'react';

interface Channel {
  id: number;
  name: string;
  volume: number;        // 0 - 100 (Default: 85)
  pan: number;           // -50 (L) to +50 (R) (Default: 0)
  saturation: number;    // 0 - 100 (Default: 0)
  masterCompressor: number; // 0 - 100 (% Mix) (Default: 0)
  muted: boolean;
  soloed: boolean;
  activeMeterLevel: number; 
}

export function MixerMatrix() {
  const [channels, setChannels] = useState<Channel[]>([
    { id: 1, name: 'TRK 1 [KICK]', volume: 85, pan: 0, saturation: 0, masterCompressor: 0, muted: false, soloed: false, activeMeterLevel: 75 },
    { id: 2, name: 'TRK 2 [SNARE]', volume: 85, pan: 0, saturation: 0, masterCompressor: 0, muted: false, soloed: false, activeMeterLevel: 60 },
    { id: 3, name: 'TRK 3 [CHORD]', volume: 85, pan: 0, saturation: 0, masterCompressor: 0, muted: false, soloed: false, activeMeterLevel: 45 },
    { id: 4, name: 'TRK 4 [LEAD]', volume: 85, pan: 0, saturation: 0, masterCompressor: 0, muted: false, soloed: false, activeMeterLevel: 85 },
  ]);

  const lastTapRef = useRef<{ [key: string]: number }>({});

  const handleDoubleTap = (key: string, resetValue: number, callback: (val: number) => void) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[key] || 0;
    if (now - lastTap < 300) {
      callback(resetValue);
      lastTapRef.current[key] = 0;
    } else {
      lastTapRef.current[key] = now;
    }
  };

  const updateChannel = (id: number, updates: Partial<Channel>) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch))
    );
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono select-none overflow-hidden">
      {/* Matrix Header */}
      <div className="flex justify-between items-center pb-2 mb-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded border border-amber-500/40">
            [M62]
          </span>
          <span className="font-bold tracking-wider text-xs text-zinc-200">
            MIXER // 4-CHANNEL DSP BUS & METERING
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">DOUBLE-TAP VOL TO 85% // FX TO 0%</span>
      </div>

      {/* Channel Strips Grid */}
      <div className="grid grid-cols-4 gap-2 flex-1 min-h-0">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className={`flex flex-col justify-between bg-zinc-900/60 border rounded-lg p-2.5 transition-colors ${
              ch.muted
                ? 'border-red-900/50 bg-red-950/10 opacity-60'
                : ch.soloed
                ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                : 'border-zinc-800'
            }`}
          >
            {/* Channel Title & Active Meter */}
            <div className="text-center pb-2 border-b border-zinc-800/80 flex flex-col gap-1.5">
              <span className="text-[10px] text-zinc-300 font-bold block truncate">
                {ch.name}
              </span>
              <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                <div
                  className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                  style={{ width: `${ch.muted ? 0 : ch.activeMeterLevel}%` }}
                ></div>
              </div>
            </div>

            {/* Vertical Volume Fader (Resets to 85 default unity) */}
            <div
              className="flex-1 flex items-center justify-center py-3 relative cursor-pointer"
              onClick={() => handleDoubleTap(`vol-${ch.id}`, 85, (val) => updateChannel(ch.id, { volume: val }))}
              title="Double-tap to reset volume to default (85%)"
            >
              <input
                type="range"
                min="0"
                max="100"
                value={ch.volume}
                onChange={(e) => updateChannel(ch.id, { volume: Number(e.target.value) })}
                className="w-28 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 transform -rotate-90 origin-center touch-none"
              />
            </div>

            {/* Saturation (Resets to 0%) */}
            <div
              className="mb-1.5 px-1 cursor-pointer"
              onClick={() => handleDoubleTap(`sat-${ch.id}`, 0, (val) => updateChannel(ch.id, { saturation: val }))}
              title="Double-tap to reset saturation to 0%"
            >
              <div className="flex justify-between text-[9px] text-zinc-500 mb-1">
                <span>SAT</span>
                <span>{ch.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ch.saturation}
                onChange={(e) => updateChannel(ch.id, { saturation: Number(e.target.value) })}
                className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Master Compressor Mix (Resets to 0%) */}
            <div
              className="mb-2 px-1 cursor-pointer"
              onClick={() => handleDoubleTap(`comp-${ch.id}`, 0, (val) => updateChannel(ch.id, { masterCompressor: val }))}
              title="Double-tap to reset compressor mix to 0%"
            >
              <div className="flex justify-between text-[9px] text-zinc-500 mb-1">
                <span>COMP MIX</span>
                <span>{ch.masterCompressor}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ch.masterCompressor}
                onChange={(e) => updateChannel(ch.id, { masterCompressor: Number(e.target.value) })}
                className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Pan (Resets to Center 0) */}
            <div
              className="mb-2 px-1 cursor-pointer"
              onClick={() => handleDoubleTap(`pan-${ch.id}`, 0, (val) => updateChannel(ch.id, { pan: val }))}
              title="Double-tap to center pan"
            >
              <div className="flex justify-between text-[9px] text-zinc-500 mb-1">
                <span>PAN</span>
                <span>{ch.pan < 0 ? `L${Math.abs(ch.pan)}` : ch.pan > 0 ? `R${ch.pan}` : 'C'}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={ch.pan}
                onChange={(e) => updateChannel(ch.id, { pan: Number(e.target.value) })}
                className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* M / S */}
            <div className="grid grid-cols-2 gap-1 pt-2 border-t border-zinc-800/80">
              <button
                onClick={() => updateChannel(ch.id, { muted: !ch.muted })}
                className={`py-1 text-[10px] font-bold rounded border transition-all ${
                  ch.muted ? 'bg-red-500 text-zinc-950 border-red-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                M
              </button>
              <button
                onClick={() => updateChannel(ch.id, { soloed: !ch.soloed })}
                className={`py-1 text-[10px] font-bold rounded border transition-all ${
                  ch.soloed ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
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