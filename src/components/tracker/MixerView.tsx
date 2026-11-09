// ============================================================================
// BREDFORGE v1.0 — 8-CHANNEL DSP MIXER VIEW [REF: MIXER-01]
// ============================================================================

import React, { useState } from 'react';

export interface ChannelStrip {
  id: number;
  name: string;
  volume: number; // 0 to 100
  pan: number;    // -50 (Left) to +50 (Right)
  muted: boolean;
  soloed: boolean;
  peakLevel: number; // 0 to 100 for live meter simulation
}

interface MixerViewProps {
  initialChannels?: ChannelStrip[];
  masterVolume?: number;
  masterLimiter?: boolean;
}

export function MixerView({
  initialChannels,
  masterVolume = 85,
  masterLimiter = true,
}: MixerViewProps) {
  const [channels, setChannels] = useState<ChannelStrip[]>(
    initialChannels ||
      Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        name: i === 0 ? 'DRUM 1' : i === 1 ? 'DRUM 2' : i === 2 ? 'BASS' : i === 3 ? 'SYNTH' : i === 4 ? 'VOCAL' : i === 5 ? 'FX BUS' : 'SAMPLER',
        volume: 75 + (i * 2) % 15,
        pan: 0,
        muted: false,
        soloed: false,
        peakLevel: 40 + (i * 7) % 50,
      }))
  );

  const [masterVol, setMasterVol] = useState<number>(masterVolume);
  const [limiterActive, setLimiterActive] = useState<boolean>(masterLimiter);

  const handleVolumeChange = (id: number, val: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, volume: val } : ch))
    );
  };

  const handlePanChange = (id: number, val: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, pan: val } : ch))
    );
  };

  const toggleMute = (id: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, muted: !ch.muted } : ch))
    );
  };

  const toggleSolo = (id: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, soloed: !ch.soloed } : ch))
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-3 gap-3 select-none overflow-hidden border border-zinc-800 rounded-lg">
      
      {/* Header: Master Controls & Limiter Toggle */}
      <div className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-lg shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            MIXER VIEW // 8-CHANNEL DSP MATRIX
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            SAMPLING: 48kHz / 24-BIT
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLimiterActive(!limiterActive)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
              limiterActive
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            MASTER LIMITER: {limiterActive ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Mixer Channel Strips Viewport */}
      <div className="flex-1 grid grid-cols-8 gap-2 bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 min-h-0 overflow-hidden">
        
        {/* Channels 1-7 */}
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 justify-between items-center text-center"
          >
            {/* Channel Title & Peak Meter */}
            <div className="w-full flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-amber-400">CH 0{ch.id}</span>
              <span className="text-[10px] text-zinc-300 truncate w-full" title={ch.name}>
                {ch.name}
              </span>
              
              {/* LED Peak Meter Bar */}
              <div className="w-3 h-20 bg-zinc-900 border border-zinc-800 rounded-sm relative overflow-hidden flex flex-col justify-end my-1">
                <div
                  className="w-full bg-emerald-500 transition-all duration-100"
                  style={{ height: `${ch.muted ? 0 : ch.peakLevel}%` }}
                ></div>
              </div>
            </div>

            {/* Fader & Pan Readout */}
            <div className="flex flex-col items-center my-auto w-full gap-2">
              <span className="text-[9px] text-sky-400 font-bold">{ch.volume}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={ch.volume}
                onChange={(e) => handleVolumeChange(ch.id, Number(e.target.value))}
                className="w-24 -rotate-90 my-6 accent-amber-500 cursor-pointer"
              />
              <span className="text-[8px] text-zinc-500">
                PAN: {ch.pan < 0 ? `L${Math.abs(ch.pan)}` : ch.pan > 0 ? `R${ch.pan}` : 'C'}
              </span>
            </div>

            {/* Mute & Solo Buses */}
            <div className="flex flex-col w-full gap-1 pt-2 border-t border-zinc-800">
              <button
                onClick={() => toggleMute(ch.id)}
                className={`w-full py-1 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                  ch.muted
                    ? 'bg-red-950 text-red-400 border-red-800 shadow-[0_0_6px_rgba(239,68,68,0.3)]'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                M
              </button>
              <button
                onClick={() => toggleSolo(ch.id)}
                className={`w-full py-1 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                  ch.soloed
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.3)]'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                S
              </button>
            </div>
          </div>
        ))}

        {/* Master Channel Strip */}
        <div className="flex flex-col h-full bg-emerald-950/20 border border-emerald-500/40 rounded-lg p-2 justify-between items-center text-center">
          <div className="w-full flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-emerald-400">MASTER</span>
            <span className="text-[10px] text-zinc-200 font-bold">BUS</span>

            <div className="w-3 h-20 bg-zinc-900 border border-zinc-800 rounded-sm relative overflow-hidden flex flex-col justify-end my-1">
              <div
                className="w-full bg-amber-400 transition-all duration-100 shadow-[0_0_6px_#f59e0b]"
                style={{ height: `${masterVol}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col items-center my-auto w-full gap-2">
            <span className="text-[9px] text-amber-400 font-bold">{masterVol}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVol}
              onChange={(e) => setMasterVol(Number(e.target.value))}
              className="w-24 -rotate-90 my-6 accent-emerald-500 cursor-pointer"
            />
            <span className="text-[8px] text-zinc-400">WIDTH: 100%</span>
          </div>

          <div className="flex flex-col w-full gap-1 pt-2 border-t border-zinc-800">
            <div className="w-full py-1 text-[9px] font-bold bg-zinc-900 text-emerald-400 border border-zinc-800 rounded">
              DSP OK
            </div>
          </div>
        </div>

      </div>

      {/* Footer Status */}
      <div className="flex justify-between items-center text-[9px] text-zinc-500 px-1 shrink-0">
        <span>Independent channel faders, stereo panning, mute/solo buses, and master limiter active.</span>
        <span className="text-emerald-400 font-bold">LATENCY: 4.2ms (STABLE)</span>
      </div>

    </div>
  );
}

export default MixerView;
