// ============================================================================
// BREDFORGE v1.0 — KOALA-STYLE PATTERN LAUNCH MATRIX & QUANTIZATION UI [REF: LAUNCH-01]
// ============================================================================

import React, { useState, useEffect } from 'react';
import { patternQueueManager, QuantizationMode } from '../../services/PatternQueueManager';

export function PatternLaunchView() {
  const [currentPattern, setCurrentPattern] = useState<number>(0);
  const [armedPattern, setArmedPattern] = useState<number | null>(null);
  const [mode, setMode] = useState<QuantizationMode>('1_bar');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    patternQueueManager.setOnStateUpdate(() => {
      setCurrentPattern(patternQueueManager.getCurrentPattern());
      setArmedPattern(patternQueueManager.getArmedPattern());
    });

    patternQueueManager.setOnPatternSwitch((patternId) => {
      setCurrentPattern(patternId);
    });

    // Start transport automatically on mount for live launching
    patternQueueManager.startTransport();
    setIsPlaying(true);

    return () => {
      patternQueueManager.stopTransport();
    };
  }, []);

  const handleModeChange = (newMode: QuantizationMode) => {
    patternQueueManager.setMode(newMode);
    setMode(newMode);
  };

  const handlePatternPress = (patternId: number) => {
    patternQueueManager.requestPatternSwitch(patternId);
  };

  const patterns = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    name: `PAT ${i < 9 ? '0' + (i + 1) : i + 1}`,
  }));

  const modes: { label: string; value: QuantizationMode }[] = [
    { label: 'THRU (INSTANT)', value: 'thru' },
    { label: '1 BEAT', value: '1_beat' },
    { label: '1/2 BAR', value: 'half_bar' },
    { label: '1 BAR', value: '1_bar' },
    { label: '2 BARS', value: '2_bars' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-3 gap-3 select-none overflow-hidden border border-zinc-800 rounded-lg">
      
      {/* Header & Quantization Mode Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-lg gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            PATTERN LAUNCHER // QUANTIZED QUEUE & THRU
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            {isPlaying ? 'TRANSPORT: PLAYING' : 'TRANSPORT: STOPPED'}
          </span>
        </div>

        {/* Quantization Mode Buttons */}
        <div className="flex flex-wrap gap-1">
          {modes.map((m) => {
            const isActive = mode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => handleModeChange(m.value)}
                className={`px-2 py-1 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4x4 Pattern Launcher Matrix */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 p-1 overflow-y-auto">
        {patterns.map((pat) => {
          const isPlayingNow = currentPattern === pat.id;
          const isArmed = armedPattern === pat.id;

          return (
            <button
              key={pat.id}
              onClick={() => handlePatternPress(pat.id)}
              className={`flex flex-col justify-between p-4 h-28 rounded-xl border cursor-pointer transition-all ${
                isPlayingNow
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)] font-bold'
                  : isArmed
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.4)] font-bold'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-amber-400'
              }`}
            >
              <div className="flex justify-between w-full text-[10px]">
                <span className={isPlayingNow ? 'text-emerald-400 font-bold' : isArmed ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                  {pat.id < 9 ? `0${pat.id + 1}` : pat.id + 1}
                </span>
                <span className="text-[9px]">
                  {isPlayingNow ? 'PLAYING' : isArmed ? 'ARMED ⏳' : 'READY'}
                </span>
              </div>

              <div className="flex flex-col items-center my-auto">
                <span className="text-sm font-extrabold tracking-wider">
                  {pat.name}
                </span>
              </div>

              <div className="flex justify-between items-center text-[8px] text-zinc-500 w-full pt-1 border-t border-zinc-800/60">
                <span>PHRASE 0{pat.id}</span>
                <span className={isPlayingNow ? 'text-emerald-400 font-bold' : isArmed ? 'text-amber-400 font-bold' : 'text-zinc-600'}>
                  ●
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[9px] text-zinc-500 px-1 shrink-0">
        <span>Thru Mode switches instantly. Quantized Queue arms switches for the next grid boundary.</span>
        <span className="text-amber-400 font-bold">KOALA-STYLE PATTERN SEQ</span>
      </div>

    </div>
  );
}

export default PatternLaunchView;
