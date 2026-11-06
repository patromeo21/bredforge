// ============================================================================
// STAGE F - PAGE 3: CHAIN VIEW MICRO-ARRANGEMENT (ChainView.tsx)
// ============================================================================

import React, { useState } from 'react';

export interface ChainStep {
  step: string;
  phraseId: string;
  transpose: string;
  volumeOffset: string;
}

export const ChainView: React.FC = () => {
  const [activeChainId, setActiveChainId] = useState<string>('C01');
  const [selectedRow, setSelectedRow] = useState<number>(0);

  // M8 Chain step table (Step -> Phrase ID -> Transpose -> Volume Offset)
  const chainSteps: ChainStep[] = [
    { step: '00', phraseId: '01', transpose: '+00', volumeOffset: '--' },
    { step: '01', phraseId: '01', transpose: '+00', volumeOffset: '--' },
    { step: '02', phraseId: '02', transpose: '+02', volumeOffset: '--' },
    { step: '03', phraseId: '03', transpose: '-02', volumeOffset: '--' },
    { step: '04', phraseId: '--', transpose: '---', volumeOffset: '--' },
    { step: '05', phraseId: '--', transpose: '---', volumeOffset: '--' },
    { step: '06', phraseId: '--', transpose: '---', volumeOffset: '--' },
    { step: '07', phraseId: '--', transpose: '---', volumeOffset: '--' },
    { step: '08', phraseId: '--', transpose: '---', volumeOffset: '--' },
    { step: '09', phraseId: '--', transpose: '---', volumeOffset: '--' },
    { step: '0A', phraseId: '--', transpose: '---', volumeOffset: '--' },
    { step: '0B', phraseId: '--', transpose: '---', volumeOffset: '--' },
    { step: '0C', phraseId: '--', transpose: '---', volumeOffset: '--' },
    { step: '0D', phraseId: '--', transpose: '---', volumeOffset: '--' },
    { step: '0E', phraseId: '--', transpose: '---', volumeOffset: '--' },
    { step: '0F', phraseId: '--', transpose: '---', volumeOffset: '--' },
  ];

  return (
    <div className="flex flex-col h-full bg-black/40 border border-emerald-500/20 rounded p-2 font-mono text-[11px] overflow-hidden">
      {/* Chain Selector Header */}
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold tracking-wider">[ CHAIN VIEW ]</span>
          <div className="flex gap-1">
            {['C01', 'C02', 'C03', 'C04'].map((id) => (
              <button
                key={id}
                onClick={() => setActiveChainId(id)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                  activeChainId === id
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                    : 'bg-zinc-950 text-emerald-500/70 border-emerald-500/20 hover:border-emerald-500/40'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
        <span className="text-[9px] text-emerald-600">MICRO-ARRANGE MATRIX</span>
      </div>

      {/* Chain Step Table */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
        {chainSteps.map((row, idx) => {
          const isSelected = selectedRow === idx;
          return (
            <div
              key={row.step}
              onClick={() => setSelectedRow(idx)}
              className={`flex items-center justify-between px-3 py-1.5 rounded border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-emerald-500/70 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center gap-6">
                <span className="text-emerald-600 font-bold">{row.step}</span>
                <span className="tracking-widest">PHRASE: <strong className="text-emerald-400">{row.phraseId}</strong></span>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span>TRANS: {row.transpose}</span>
                <span>VOL: {row.volumeOffset}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};