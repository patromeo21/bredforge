// ============================================================================
// BREDFORGE v1.0 — 8-CHANNEL DSP MIXER & MASTER DYNAMICS [REF: MIXER-01]
// ============================================================================

import React, { useState } from 'react';
import { audioEngine } from '../../services/AudioEngine';

interface Channel {
  id: number;
  name: string;
  volume: number; // 0 - 100
  pan: number;    // -50 (L) to +50 (R)
  muted: boolean;
  solo: boolean;
}

export interface MixerViewProps {
  masterVolume?: number;
  masterLimiter?: boolean;
}

export function MixerView({ masterVolume: initialMasterVol = 85, masterLimiter = true }: MixerViewProps) {
  const [channels, setChannels] = useState<Channel[]>(
    Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `TRK 0${i + 1}`,
      volume: 80,
      pan: 0,
      muted: false,
      solo: false,
    }))
  );

  const [masterVolume, setMasterVolume] = useState<number>(initialMasterVol); // 0 - 100
  const [limiterThresh, setLimiterThresh] = useState<number>(-1.0); // -20dB to 0dB
  const [limiterRatio, setLimiterRatio] = useState<number>(20.0); // 1 to 20

  const handleChannelVolumeChange = (id: number, val: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, volume: val } : ch))
    );
  };

  const handleChannelPanChange = (id: number, val: number) => {
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
      prev.map((ch) => (ch.id === id ? { ...ch, solo: !ch.solo } : ch))
    );
  };

  const handleMasterVolumeChange = (val: number) => {
    setMasterVolume(val);
    audioEngine.setMasterVolume(val / 100);
  };

  const handleLimiterThreshChange = (val: number) => {
    setLimiterThresh(val);
    audioEngine.setMasterLimiterThreshold(val);
  };

  const handleLimiterRatioChange = (val: number) => {
    setLimiterRatio(val);
    audioEngine.setMasterLimiterRatio(val);
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-3 gap-3 select-none overflow-hidden border border-zinc-800 rounded-lg">
      
      {/* Mixer Header */}
      <div className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-lg shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            8-CHANNEL DSP MIXER // MASTER DYNAMICS
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            REAL-TIME WEB AUDIO BUS
          </span>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
          <span className={`w-2 h-2 rounded-full ${masterLimiter ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-zinc-600'}`} />
          <span className="text-[10px] text-zinc-300">
            {masterLimiter ? 'DSP LIMITER ACTIVE' : 'LIMITER BYPASSED'}
          </span>
        </div>
      </div>

      {/* Main Mixer Body: 8 Channel Strips + Master Strip */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 min-h-0 overflow-y-auto p-1">
        
        {/* 8 Channel Strips */}
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="flex flex-col justify-between p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl"
          >
            <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
              <span className="text-[10px] font-bold text-amber-400">{ch.name}</span>
              <span className="text-[9px] text-zinc-500">CH {ch.id}</span>
            </div>

            {/* Volume readout & Slider */}
            <div className="flex flex-col items-center my-2 gap-2">
              <span className="text-xs font-bold text-zinc-200">{ch.volume}%</span>
              <div className="h-32 flex items-center py-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ch.volume}
                  onChange={(e) => handleChannelVolumeChange(ch.id, Number(e.target.value))}
                  className="accent-amber-500 cursor-pointer w-28 -rotate-90 origin-center bg-zinc-950 rounded-lg appearance-none h-1.5"
                />
              </div>
            </div>

            {/* Pan & Mute/Solo */}
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <div className="flex justify-between text-[9px] text-zinc-400">
                <span>PAN</span>
                <span className="text-amber-400">{ch.pan === 0 ? 'C' : ch.pan < 0 ? `L${Math.abs(ch.pan)}` : `R${ch.pan}`}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={ch.pan}
                onChange={(e) => handleChannelPanChange(ch.id, Number(e.target.value))}
                className="accent-amber-500 cursor-pointer h-1 bg-zinc-950 rounded-lg appearance-none w-full"
              />

              <div className="grid grid-cols-2 gap-1 pt-1">
                <button
                  onClick={() => toggleMute(ch.id)}
                  className={`py-1 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                    ch.muted
                      ? 'bg-red-500 text-zinc-950 border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  MUTE
                </button>
                <button
                  onClick={() => toggleSolo(ch.id)}
                  className={`py-1 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                    ch.solo
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  SOLO
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Master Channel Strip */}
        <div className="flex flex-col justify-between p-3 bg-zinc-900/60 border border-amber-500/50 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
            <span className="text-[10px] font-bold text-amber-500">MASTER BUS</span>
            <span className="text-[9px] text-emerald-400">LIMITER</span>
          </div>

          <div className="flex flex-col items-center my-1 gap-1">
            <span className="text-xs font-bold text-amber-400">{masterVolume}%</span>
            <div className="h-28 flex items-center py-1">
              <input
                type="range"
                min="0"
                max="100"
                value={masterVolume}
                onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
                className="accent-amber-500 cursor-pointer w-24 -rotate-90 origin-center bg-zinc-950 rounded-lg appearance-none h-1.5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-800 text-[9px]">
            <div className="flex justify-between text-zinc-400">
              <span>THRESH</span>
              <span className="text-amber-400">{limiterThresh.toFixed(1)} dB</span>
            </div>
            <input
              type="range"
              min="-20"
              max="0"
              step="0.5"
              value={limiterThresh}
              onChange={(e) => handleLimiterThreshChange(Number(e.target.value))}
              className="accent-amber-500 cursor-pointer h-1 bg-zinc-950 rounded-lg appearance-none w-full"
            />

            <div className="flex justify-between text-zinc-400 pt-1">
              <span>RATIO</span>
              <span className="text-amber-400">{limiterRatio.toFixed(0)}:1</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={limiterRatio}
              onChange={(e) => handleLimiterRatioChange(Number(e.target.value))}
              className="accent-amber-500 cursor-pointer h-1 bg-zinc-950 rounded-lg appearance-none w-full"
            />
          </div>
        </div>

      </div>

    </div>
  );
}

export default MixerView;
