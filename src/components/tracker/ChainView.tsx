// ============================================================================
// BREDFORGE v1.0 — CHAIN VIEW COMPONENT (PHRASE SEQUENCING) [REF: CHAIN-01]
// ============================================================================

import React, { useState } from 'react';

export interface ChainSlot {
  slotIndex: number;
  phraseId: string;
  transpose: number; // -12 to +12 semitones
  fxCommand: string; // e.g., "---", "F01", "VOL"
}

interface ChainViewProps {
  chainId?: string;
  chainName?: string;
  slots?: ChainSlot[];
  onUpdateSlot?: (slotIndex: number, slot: ChainSlot) => void;
  onSelectChain?: (chainId: string) => void;
}

export function ChainView({
  chainId = 'CH-00',
  chainName = 'DRUM_INTRO_CHAIN',
  slots: initialSlots,
  onUpdateSlot,
}: ChainViewProps) {
  const [activeChain, setActiveChain] = useState<string>(chainId);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number>(0);

  // 16 sequential chain slots forming a song building block
  const [slots, setSlots] = useState<ChainSlot[]>(
    initialSlots ||
      Array.from({ length: 16 }, (_, idx) => ({
        slotIndex: idx,
        phraseId: idx < 4 ? `P0${(idx % 2) + 1}` : '--',
        transpose: 0,
        fxCommand: idx === 3 ? 'F01 (Filter)' : idx === 7 ? 'REV (Reverse)' : '---',
      }))
  );

  const handleTransposeChange = (index: number, delta: number) => {
    setSlots((prev) => {
      const next = [...prev];
      const current = next[index];
      const newTranspose = Math.max(-12, Math.min(12, current.transpose + delta));
      next[index] = { ...current, transpose: newTranspose };
      if (onUpdateSlot) onUpdateSlot(index, next[index]);
      return next;
    });
  };

  const handlePhraseCycle = (index: number) => {
    const phrases = ['--', 'P01', 'P02', 'P03', 'P04'];
    setSlots((prev) => {
      const next = [...prev];
      const current = next[index];
      const currIdx = phrases.indexOf(current.phraseId);
      const nextPhrase = phrases[(currIdx + 1) % phrases.length];
      next[index] = { ...current, phraseId: nextPhrase };
      if (onUpdateSlot) onUpdateSlot(index, next[index]);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-3 gap-3 select-none overflow-hidden border border-zinc-800 rounded-lg">
      
      {/* Header: Chain Selector & Info */}
      <div className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-lg shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            CHAIN VIEW // {activeChain}: {chainName}
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            16 STEPS MAX
          </span>
        </div>

        {/* Chain Bank Quick Switcher */}
        <div className="flex gap-1">
          {['CH-00', 'CH-01', 'CH-02', 'CH-03'].map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChain(ch)}
              className={`px-2 py-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
                activeChain === ch
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chain Slots Table */}
      <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-lg p-2.5 flex flex-col min-h-0 overflow-hidden">
        
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 px-2">
          <span className="w-12">STEP</span>
          <span className="w-16">PHRASE ID</span>
          <span className="w-24">TRANSPOSE</span>
          <span className="flex-1">FX MACRO COMMAND</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedSlotIdx(idx)}
              className={`flex items-center justify-between px-3 py-2 rounded text-xs border cursor-pointer transition-all ${
                selectedSlotIdx === idx
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {/* Step Index */}
              <span className="w-12 text-zinc-600 font-bold">
                {idx < 10 ? `0${idx}` : idx}
              </span>

              {/* Phrase ID Selector */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePhraseCycle(idx);
                }}
                className="w-16 px-2 py-0.5 bg-zinc-900 hover:bg-amber-500/20 text-amber-400 border border-zinc-800 rounded text-center font-bold cursor-pointer"
              >
                {slot.phraseId}
              </button>

              {/* Transpose Controls */}
              <div className="w-24 flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTransposeChange(idx, -1);
                  }}
                  className="w-5 h-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 flex items-center justify-center text-[10px]"
                >
                  -
                </button>
                <span className="w-8 text-center text-sky-400 font-bold">
                  {slot.transpose > 0 ? `+${slot.transpose}` : slot.transpose}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTransposeChange(idx, 1);
                  }}
                  className="w-5 h-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 flex items-center justify-center text-[10px]"
                >
                  +
                </button>
              </div>

              {/* FX Command */}
              <span className="flex-1 text-zinc-300 text-[11px] truncate">
                {slot.fxCommand}
              </span>
            </div>
          ))}
        </div>

      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[9px] text-zinc-500 px-1 shrink-0">
        <span>Click Phrase ID to cycle variations. Use +/- to adjust pitch transposition per step.</span>
        <span className="text-emerald-400 font-bold">STATUS: READY FOR SONG ARRANGEMENT</span>
      </div>

    </div>
  );
}

export default ChainView;
