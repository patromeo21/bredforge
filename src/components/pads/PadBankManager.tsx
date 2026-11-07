// ============================================================================
// BREDFORGE v1.0 — 4X4 PAD BANK MANAGER (PadBankManager.tsx)
// ============================================================================

import React, { useState } from 'react';
import { BankId, BankConfig, PlayMode, PadData } from '../../types/bank';

interface PadBankManagerProps {
  onPadTrigger?: (bankId: BankId, padId: number, semitoneOffset: number) => void;
}

const INITIAL_BANKS: Record<BankId, BankConfig> = {
  A: {
    id: 'A',
    label: 'BANK A: CHOPS',
    description: 'Vocal chops & melodic slice matrix',
    playMode: 'oneshot',
    rootPadId: 0,
    pads: Array.from({ length: 16 }, (_, i): PadData => ({
      id: i,
      name: `Slice ${i + 1}`,
      isLoaded: i < 8,
      color: 'emerald',
      volume: 1.0,
      pitch: 0,
    })),
  },
  B: {
    id: 'B',
    label: 'BANK B: DRUMS',
    description: 'One-shot kicks, snares & hats',
    playMode: 'oneshot',
    rootPadId: 0,
    pads: Array.from({ length: 16 }, (_, i): PadData => ({
      id: i,
      name: `Drum ${i + 1}`,
      isLoaded: i < 12,
      color: 'amber',
      volume: 1.0,
      pitch: 0,
    })),
  },
  C: {
    id: 'C',
    label: 'BANK C: BASS',
    description: 'Sub bass & chromatic synths',
    playMode: 'chromatic',
    rootPadId: 0,
    pads: Array.from({ length: 16 }, (_, i): PadData => ({
      id: i,
      name: `Bass Note ${i + 1}`,
      isLoaded: i < 16,
      color: 'cyan',
      volume: 1.0,
      pitch: i,
    })),
  },
  D: {
    id: 'D',
    label: 'BANK D: STABS',
    description: 'Accents, chords & FX hits',
    playMode: 'oneshot',
    rootPadId: 0,
    pads: Array.from({ length: 16 }, (_, i): PadData => ({
      id: i,
      name: `Stab ${i + 1}`,
      isLoaded: i < 4,
      color: 'rose',
      volume: 1.0,
      pitch: 0,
    })),
  },
};

export const PadBankManager: React.FC<PadBankManagerProps> = ({ onPadTrigger }) => {
  const [activeBank, setActiveBank] = useState<BankId>('A');
  const [banks, setBanks] = useState<Record<BankId, BankConfig>>(INITIAL_BANKS);

  const currentBank = banks[activeBank];

  const handlePlayModeToggle = () => {
    setBanks(prev => {
      const bank = prev[activeBank];
      const newMode: PlayMode = bank.playMode === 'oneshot' ? 'chromatic' : 'oneshot';
      return {
        ...prev,
        [activeBank]: {
          ...bank,
          playMode: newMode,
        },
      };
    });
  };

  const handlePadClick = (padId: number) => {
    let semitoneOffset = currentBank.pads[padId].pitch;

    if (currentBank.playMode === 'chromatic') {
      semitoneOffset = padId - currentBank.rootPadId;
    }

    if (onPadTrigger) {
      onPadTrigger(activeBank, padId, semitoneOffset);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl select-none">
      {/* Bank Selector Header & PARAMS + POLY Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-mono font-bold text-slate-100 text-sm tracking-wider">
              {currentBank.label}
            </h2>
            <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold ${
              currentBank.playMode === 'chromatic' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              MODE: {currentBank.playMode.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">{currentBank.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* PARAMS + POLY Toggle Button */}
          <button
            onClick={handlePlayModeToggle}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
              currentBank.playMode === 'chromatic'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle PARAMS + POLY Chromatic Spread across pads"
          >
            {currentBank.playMode === 'chromatic' ? 'PARAMS+POLY: ON' : 'PARAMS+POLY: OFF'}
          </button>
          
          {/* Bank Switcher Tabs A, B, C, D */}
          <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {(['A', 'B', 'C', 'D'] as BankId[]).map((bId) => (
              <button
                key={bId}
                onClick={() => setActiveBank(bId)}
                className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                  activeBank === bId
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {bId}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4x4 Pad Grid */}
      <div className="grid grid-cols-4 gap-3 flex-1 min-h-[360px]">
        {currentBank.pads.map((pad: PadData) => {
          const effectiveSemitone = currentBank.playMode === 'chromatic' 
            ? pad.id - currentBank.rootPadId 
            : pad.pitch;
          
          const rateMultiplier = Math.pow(2, effectiveSemitone / 12).toFixed(2);

          return (
            <button
              key={pad.id}
              onClick={() => handlePadClick(pad.id)}
              className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all active:scale-95 cursor-pointer text-left ${
                pad.isLoaded
                  ? 'bg-slate-900/90 border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-900 shadow-lg'
                  : 'bg-slate-900/30 border-slate-800/50 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-mono text-[10px] text-slate-400 tracking-wider">
                  {activeBank}{(pad.id + 1).toString().padStart(2, '0')}
                </span>
                <div className={`w-2 h-2 rounded-full ${pad.isLoaded ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
              </div>
              
              <div className="my-2">
                <div className="font-mono text-xs font-semibold text-slate-200 truncate">
                  {pad.name}
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {currentBank.playMode === 'chromatic' 
                    ? `Note: ${effectiveSemitone >= 0 ? '+' : ''}${effectiveSemitone}st` 
                    : (pad.isLoaded ? 'ASSIGNED' : 'EMPTY')}
                </div>
              </div>

              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 border-t border-slate-800/60 pt-1.5 w-full">
                <span>RATE: {rateMultiplier}x</span>
                <span>{effectiveSemitone !== 0 ? `${effectiveSemitone > 0 ? '+' : ''}${effectiveSemitone}st` : 'ROOT'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};