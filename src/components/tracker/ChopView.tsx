// ============================================================================
// STAGE F - PAGE 4: SAMPLE CHOP & ASSIGN WORKSPACE (ChopView.tsx)
// ============================================================================

import React, { useState } from 'react';

export interface ChopSlice {
  id: number;
  startPoint: string;
  endPoint: string;
  assignedPad: string;
}

export const ChopView: React.FC = () => {
  const [selectedSlice, setSelectedSlice] = useState<number>(0);
  const [activeSample, setActiveSample] = useState<string>('SMPL_01.WAV');

  const slices: ChopSlice[] = [
    { id: 1, startPoint: '00.0%', endPoint: '12.5%', assignedPad: 'PAD 01' },
    { id: 2, startPoint: '12.5%', endPoint: '25.0%', assignedPad: 'PAD 02' },
    { id: 3, startPoint: '25.0%', endPoint: '37.5%', assignedPad: 'PAD 03' },
    { id: 4, startPoint: '37.5%', endPoint: '50.0%', assignedPad: 'PAD 04' },
    { id: 5, startPoint: '50.0%', endPoint: '62.5%', assignedPad: 'PAD 05' },
    { id: 6, startPoint: '62.5%', endPoint: '75.0%', assignedPad: 'PAD 06' },
    { id: 7, startPoint: '75.0%', endPoint: '87.5%', assignedPad: 'PAD 07' },
    { id: 8, startPoint: '87.5%', endPoint: '100.0%', assignedPad: 'PAD 08' },
  ];

  return (
    <div className="flex flex-col h-full bg-black/40 border border-emerald-500/20 rounded p-2 font-mono text-[11px] overflow-hidden gap-2">
      
      {/* Header & Sample Selector */}
      <div className="flex justify-between items-center pb-1 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold tracking-wider">[ SAMPLE CHOP & ASSIGN ]</span>
          <span className="text-emerald-300 bg-zinc-950 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
            {activeSample}
          </span>
        </div>
        <span className="text-[9px] text-emerald-600">TRANSIENT SLICER</span>
      </div>

      {/* Waveform Viewport Simulator */}
      <div className="h-28 bg-zinc-950 border border-emerald-500/30 rounded flex flex-col justify-between p-2 relative overflow-hidden">
        <div className="flex justify-between text-[9px] text-emerald-600 z-10">
          <span>00:00.000</span>
          <span>SLICE REGION [{selectedSlice + 1} / {slices.length}]</span>
          <span>00:04.500</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <div className="w-full h-12 flex items-center gap-0.5 px-2">
            {Array.from({ length: 64 }).map((_, i) => {
              const heightFactor = Math.sin(i * 0.4) * 50 + 50;
              return (
                <div
                  key={i}
                  className="flex-1 bg-emerald-400 rounded-sm"
                  style={{ height: `${Math.max(10, heightFactor)}%` }}
                />
              );
            })}
          </div>
        </div>

        <div className="flex justify-between text-[9px] text-emerald-400 z-10 border-t border-emerald-500/20 pt-1">
          <span>START: {slices[selectedSlice].startPoint}</span>
          <span>ASSIGNED: <strong className="text-emerald-300">{slices[selectedSlice].assignedPad}</strong></span>
          <span>END: {slices[selectedSlice].endPoint}</span>
        </div>
      </div>

      {/* Slices Table / Pad Mapping List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
        {slices.map((slice, idx) => {
          const isSelected = selectedSlice === idx;
          return (
            <div
              key={slice.id}
              onClick={() => setSelectedSlice(idx)}
              className={`flex items-center justify-between px-3 py-1.5 rounded border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-emerald-500/70 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center gap-6">
                <span className="text-emerald-600 font-bold">SLIC {String(slice.id).padStart(2, '0')}</span>
                <span className="tracking-widest">RANGE: <strong className="text-emerald-400">{slice.startPoint} — {slice.endPoint}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300 font-bold">
                  {slice.assignedPad}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
