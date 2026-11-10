// ============================================================================
// BREDFORGE v1.0 — 4X4 PAD BANK MANAGER [REF: PAD-BANK-01]
// ============================================================================

import React, { useState } from 'react';
import { audioEngine } from '../../services/AudioEngine';

type BankId = 'A' | 'B' | 'C' | 'D';

interface PadConfig {
  id: number;
  semitoneOffset: number;
  sampleName: string;
}

export function PadBankManager() {
  const [activeBank, setActiveBank] = useState<BankId>('A');
  const [isPolyphonic, setIsPolyphonic] = useState<boolean>(true);
  const [isChromaticSpread, setIsChromaticSpread] = useState<boolean>(true);
  const [rootNoteOffset, setRootNoteOffset] = useState<number>(0);

  // Initialize 16 pads (4x4) with default semitone offsets
  const [banks, setBanks] = useState<Record<BankId, PadConfig[]>>({
    A: Array.from({ length: 16 }, (_, i) => ({ id: i, semitoneOffset: i, sampleName: `KICK_0${(i % 4) + 1}` })),
    B: Array.from({ length: 16 }, (_, i) => ({ id: i, semitoneOffset: i + 12, sampleName: `SNARE_0${(i % 4) + 1}` })),
    C: Array.from({ length: 16 }, (_, i) => ({ id: i, semitoneOffset: i + 24, sampleName: `CHORD_0${(i % 4) + 1}` })),
    D: Array.from({ length: 16 }, (_, i) => ({ id: i, semitoneOffset: i + 36, sampleName: `FX_0${(i % 4) + 1}` })),
  });

  const [activeTriggeredPad, setActiveTriggeredPad] = useState<number | null>(null);

  const handlePadPress = (padIndex: number) => {
    setActiveTriggeredPad(padIndex);
    const pad = banks[activeBank][padIndex];
    
    // Calculate final semitone or pitch index
    const computedOffset = isChromaticSpread ? pad.semitoneOffset + rootNoteOffset : rootNoteOffset;
    
    // Trigger audio engine with mapped index/pitch
    audioEngine.triggerPad(computedOffset, 110);

    setTimeout(() => {
      setActiveTriggeredPad(null);
    }, 120);
  };

  const handleSemitoneChange = (padIndex: number, delta: number) => {
    setBanks((prev) => {
      const updatedBank = [...prev[activeBank]];
      updatedBank[padIndex] = {
        ...updatedBank[padIndex],
        semitoneOffset: Math.max(-24, Math.min(48, updatedBank[padIndex].semitoneOffset + delta)),
      };
      return { ...prev, [activeBank]: updatedBank };
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 font-mono text-xs select-none gap-3 p-3 border border-zinc-800 rounded-2xl">
      
      {/* Header & Bank Selector Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-500 font-bold tracking-wider">PAD BANK:</span>
          <div className="flex gap-1">
            {(['A', 'B', 'C', 'D'] as BankId[]).map((bankKey) => (
              <button
                key={bankKey}
                onClick={() => setActiveBank(bankKey)}
                className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                  activeBank === bankKey
                    ? 'bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                }`}
              >
                BANK {bankKey}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter & Polyphony Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <button
            onClick={() => setIsPolyphonic(!isPolyphonic)}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              isPolyphonic
                ? 'bg-zinc-800 border-emerald-500/80 text-emerald-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500'
            }`}
          >
            POLY: {isPolyphonic ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setIsChromaticSpread(!isChromaticSpread)}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              isChromaticSpread
                ? 'bg-zinc-800 border-amber-500/80 text-amber-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500'
            }`}
          >
            CHROMATIC SPREAD: {isChromaticSpread ? 'ON' : 'OFF'}
          </button>

          <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 text-[10px]">ROOT:</span>
            <input
              type="number"
              value={rootNoteOffset}
              onChange={(e) => setRootNoteOffset(Number(e.target.value))}
              className="w-10 bg-zinc-900 text-amber-400 font-bold text-center rounded border border-zinc-800 outline-none"
            />
          </div>
        </div>

      </div>

      {/* 4x4 Pad Grid Matrix */}
      <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-2.5 min-h-[320px]">
        {banks[activeBank].map((pad, idx) => {
          const isTriggered = activeTriggeredPad === idx;

          return (
            <div
              key={pad.id}
              onClick={() => handlePadPress(idx)}
              className={`flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none group ${
                isTriggered
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-[0.98]'
                  : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-700 shadow-lg'
              }`}
            >
              {/* Top row of pad card */}
              <div className="flex justify-between items-center text-[10px]">
                <span className={isTriggered ? 'text-zinc-950 font-bold' : 'text-zinc-500'}>
                  PAD {idx < 9 ? `0${idx + 1}` : idx + 1}
                </span>
                <span className={`font-bold px-1 rounded ${isTriggered ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-950 text-amber-400 border border-zinc-800'}`}>
                  {pad.semitoneOffset >= 0 ? `+${pad.semitoneOffset}` : pad.semitoneOffset}ST
                </span>
              </div>

              {/* Center sample name */}
              <div className="text-center font-bold tracking-wider my-auto text-xs truncate">
                {pad.sampleName}
              </div>

              {/* Bottom semitone fine-tune controls */}
              <div className="flex justify-between items-center pt-1 border-t border-zinc-800/40 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSemitoneChange(idx, -1);
                  }}
                  className="px-1.5 py-0.5 bg-zinc-950 hover:bg-zinc-800 rounded text-[9px] text-zinc-400 cursor-pointer"
                  title="Decrease Semitone"
                >
                  -1
                </button>
                <span className="text-[9px] text-zinc-500">OFFSET</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSemitoneChange(idx, 1);
                  }}
                  className="px-1.5 py-0.5 bg-zinc-950 hover:bg-zinc-800 rounded text-[9px] text-zinc-400 cursor-pointer"
                  title="Increase Semitone"
                >
                  +1
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default PadBankManager;
