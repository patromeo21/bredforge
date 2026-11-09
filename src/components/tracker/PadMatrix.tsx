// ============================================================================
// BREDFORGE v1.0 — DYNAMIC PAD & M8 HARDWARE MATRIX FLIP [REF: PAD-M8-01]
// ============================================================================

import React, { useState } from 'react';

export interface PadData {
  id: number;
  name: string;
  note: string;
  sampleName?: string;
  audioBuffer?: AudioBuffer | null;
}

export interface PadMatrixProps {
  activeBank: 'A' | 'B' | 'C' | 'D';
  onSelectBank: (bank: 'A' | 'B' | 'C' | 'D') => void;
  pads: PadData[];
  onTriggerPad: (pad: PadData) => void;
  onM8Action: (command: string) => void;
}

export function PadMatrix({
  activeBank,
  onSelectBank,
  pads,
  onTriggerPad,
  onM8Action,
}: PadMatrixProps) {
  const [gridMode, setGridMode] = useState<'4x4' | 'm8'>('4x4');

  const m8Buttons = [
    { label: 'UP', icon: '▲', cmd: 'NAV_UP', desc: 'Cursor Up' },
    { label: 'EDIT', icon: 'E', cmd: 'EDIT_VAL', desc: 'Confirm / Edit' },
    { label: 'LEFT', icon: '◄', cmd: 'NAV_LEFT', desc: 'Cursor Left' },
    { label: 'RIGHT', icon: '►', cmd: 'NAV_RIGHT', desc: 'Cursor Right' },
    { label: 'DOWN', icon: '▼', cmd: 'NAV_DOWN', desc: 'Cursor Down' },
    { label: 'OPTION', icon: 'O', cmd: 'OPT_MENU', desc: 'Context / Cancel' },
    { label: 'SHIFT', icon: 'S', cmd: 'MOD_SHIFT', desc: 'Modifier Key' },
    { label: 'PLAY', icon: 'P', cmd: 'SEQ_PLAY', desc: 'Transport Play/Stop' },
  ];

  return (
    <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 flex flex-col min-h-0 overflow-hidden font-mono">
      
      {/* Header: Bank Selectors & Grid Flip Toggle */}
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="flex gap-1.5">
          {(['A', 'B', 'C', 'D'] as const).map((bank) => (
            <button
              key={bank}
              onClick={() => onSelectBank(bank)}
              className={`px-2 py-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
                activeBank === bank
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              BANK {bank}
            </button>
          ))}
        </div>

        {/* Grid Flip Switcher */}
        <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800">
          <button
            onClick={() => setGridMode('4x4')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
              gridMode === '4x4'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            4X4 PADS
          </button>
          <button
            onClick={() => setGridMode('m8')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
              gridMode === 'm8'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            M8 BUTTONS
          </button>
        </div>
      </div>

      {/* Dynamic Viewport: 4x4 MPC Pads vs M8 Hardware Controls */}
      <div className="flex-1 min-h-0 flex flex-col">
        {gridMode === '4x4' ? (
          <div className="grid grid-cols-4 gap-2 h-full">
            {pads.map((pad) => (
              <button
                key={pad.id}
                onClick={() => onTriggerPad(pad)}
                className={`flex flex-col justify-between p-2.5 rounded-lg text-left transition-all cursor-pointer group border ${
                  pad.audioBuffer
                    ? 'bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400 active:bg-emerald-500/30'
                    : 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/50 active:bg-amber-500/20'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className={`text-[10px] font-bold ${pad.audioBuffer ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {activeBank}{pad.id < 10 ? `0${pad.id}` : pad.id}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      pad.audioBuffer ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-zinc-700'
                    }`}
                  ></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-zinc-200 truncate">
                    {pad.sampleName ? pad.sampleName.split('.')[0] : pad.note}
                  </span>
                  <span className="text-[8px] text-zinc-500">
                    {pad.audioBuffer ? 'READY (AUDITION)' : 'EMPTY (LOAD)'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 h-full items-center p-2 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
            <div className="grid grid-cols-3 gap-1.5 h-full items-center justify-items-center bg-zinc-900/50 p-2 rounded border border-zinc-800">
              <div></div>
              <button
                onClick={() => onM8Action('NAV_UP')}
                className="w-full h-12 bg-zinc-800 hover:bg-amber-500/20 active:bg-amber-500 active:text-zinc-950 border border-zinc-700 rounded flex flex-col items-center justify-center cursor-pointer transition-all text-amber-400 font-bold text-sm"
              >
                ▲
              </button>
              <div></div>

              <button
                onClick={() => onM8Action('NAV_LEFT')}
                className="w-full h-12 bg-zinc-800 hover:bg-amber-500/20 active:bg-amber-500 active:text-zinc-950 border border-zinc-700 rounded flex flex-col items-center justify-center cursor-pointer transition-all text-amber-400 font-bold text-sm"
              >
                ◄
              </button>
              <div className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center text-[9px] text-zinc-600">
                PAD
              </div>
              <button
                onClick={() => onM8Action('NAV_RIGHT')}
                className="w-full h-12 bg-zinc-800 hover:bg-amber-500/20 active:bg-amber-500 active:text-zinc-950 border border-zinc-700 rounded flex flex-col items-center justify-center cursor-pointer transition-all text-amber-400 font-bold text-sm"
              >
                ►
              </button>

              <div></div>
              <button
                onClick={() => onM8Action('NAV_DOWN')}
                className="w-full h-12 bg-zinc-800 hover:bg-amber-500/20 active:bg-amber-500 active:text-zinc-950 border border-zinc-700 rounded flex flex-col items-center justify-center cursor-pointer transition-all text-amber-400 font-bold text-sm"
              >
                ▼
              </button>
              <div></div>
            </div>

            <div className="grid grid-cols-2 gap-2 h-full">
              {m8Buttons.slice(1).map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => onM8Action(btn.cmd)}
                  className="flex flex-col justify-center items-center p-2 bg-zinc-900 hover:bg-amber-500/20 border border-zinc-800 hover:border-amber-400/60 rounded-lg active:bg-amber-500 active:text-zinc-950 cursor-pointer transition-all shadow-sm"
                >
                  <span className="text-base font-bold text-amber-400 mb-0.5">{btn.icon}</span>
                  <span className="text-[10px] font-bold tracking-wider text-zinc-200">{btn.label}</span>
                  <span className="text-[7px] text-zinc-500">{btn.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default PadMatrix;
