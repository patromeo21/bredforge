// ============================================================================
// BREDFORGE v1.0 — DUAL SCREEN TRACKER & 4X4 PAD WORKSPACE [REF: WORKSPACE-01]
// ============================================================================

import React, { useState } from 'react';

export function DualScreenWorkspace() {
  const [activeSubView, setActiveSubView] = useState<'tracker' | 'pads'>('tracker');
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [selectedStep, setSelectedStep] = useState<number>(0);

  // Mock tracker rows (Tracks 1-4 visible)
  const trackerRows = Array.from({ length: 16 }, (_, i) => ({
    step: i,
    t1: { note: i % 4 === 0 ? 'C-3' : '---', ins: '01', cmd: i === 0 ? 'P01' : '---' },
    t2: { note: i % 8 === 0 ? 'G-2' : '---', ins: '02', cmd: '---' },
    t3: { note: '---', ins: '--', cmd: '---' },
    t4: { note: i % 2 === 0 ? 'C-4' : '---', ins: '03', cmd: 'F08' },
  }));

  // 4x4 Pad definitions for Phase 14 PadBankManager
  const pads = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    name: `PAD ${i + 1}`,
    note: `C${Math.floor(i / 4) + 1}`,
    assignedIns: `INS 0${(i % 4) + 1}`,
  }));

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono select-none overflow-hidden">
      {/* Sub-View Switcher Bar */}
      <div className="flex justify-between items-center pb-2 mb-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded border border-amber-500/40">
            [M8/MPC]
          </span>
          <span className="font-bold tracking-wider text-xs text-zinc-200">
            TRACKER SEQUENCE & 4X4 PAD BANK MANAGER
          </span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
          <button
            onClick={() => setActiveSubView('tracker')}
            className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
              activeSubView === 'tracker'
                ? 'bg-amber-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            GRID TRACKER
          </button>
          <button
            onClick={() => setActiveSubView('pads')}
            className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
              activeSubView === 'pads'
                ? 'bg-amber-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            4X4 PADS [BANK {activeBank}]
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 relative min-h-0 flex gap-3 overflow-hidden">
        {activeSubView === 'tracker' ? (
          /* M8 Tracker Grid View */
          <div className="flex-1 flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 bg-zinc-900 px-3 py-1.5 text-[10px] font-bold text-amber-400 border-b border-zinc-800 shrink-0 text-center">
              <span>STEP</span>
              <span>TRACK 1</span>
              <span>TRACK 2</span>
              <span>TRACK 3</span>
              <span>TRACK 4</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60">
              {trackerRows.map((row) => (
                <div
                  key={row.step}
                  onClick={() => setSelectedStep(row.step)}
                  className={`grid grid-cols-5 px-3 py-1.5 text-xs items-center text-center cursor-pointer transition-colors ${
                    selectedStep === row.step
                      ? 'bg-amber-500/15 border-l-2 border-amber-500 text-amber-300'
                      : 'hover:bg-zinc-900/60 text-zinc-300'
                  }`}
                >
                  <span className="text-zinc-500 font-bold">
                    {row.step.toString().padStart(2, '0')}
                  </span>
                  <span className="font-mono text-emerald-400">
                    {row.t1.note} <span className="text-[9px] text-zinc-500">{row.t1.ins}</span>
                  </span>
                  <span className="font-mono text-amber-400">
                    {row.t2.note} <span className="text-[9px] text-zinc-500">{row.t2.ins}</span>
                  </span>
                  <span className="font-mono text-zinc-600">
                    {row.t3.note}
                  </span>
                  <span className="font-mono text-cyan-400">
                    {row.t4.note} <span className="text-[9px] text-zinc-500">{row.t4.ins}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 4x4 Pad Bank Manager View */
          <div className="flex-1 flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 overflow-hidden">
            {/* Bank Selectors */}
            <div className="flex justify-between items-center mb-3 shrink-0">
              <span className="text-xs font-bold text-zinc-300">PERFORMANCE BANKS A-D</span>
              <div className="flex gap-1.5">
                {(['A', 'B', 'C', 'D'] as const).map((bank) => (
                  <button
                    key={bank}
                    onClick={() => setActiveBank(bank)}
                    className={`px-3 py-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
                      activeBank === bank
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    BANK {bank}
                  </button>
                ))}
              </div>
            </div>

            {/* 4x4 Grid */}
            <div className="grid grid-cols-4 gap-2 flex-1 min-h-0">
              {pads.map((pad) => (
                <button
                  key={pad.id}
                  className="flex flex-col justify-between p-3 bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 rounded-lg text-left active:bg-amber-500 active:text-zinc-950 transition-all cursor-pointer group shadow-inner"
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-[10px] font-bold text-amber-400 group-active:text-zinc-950">
                      PAD {pad.id < 10 ? `0${pad.id}` : pad.id}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-200 group-active:text-zinc-950">
                      {pad.assignedIns}
                    </span>
                    <span className="text-[9px] text-zinc-500 group-active:text-zinc-900">
                      NOTE: {pad.note}
                    </span>
                  </div>

                  <span className="text-[8px] text-zinc-600 uppercase tracking-wider group-active:text-zinc-900">
                    BANK {activeBank}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Side Inspector Panel */}
        <div className="w-56 bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 hidden sm:flex flex-col gap-3 shrink-0">
          <div className="text-[11px] font-bold text-amber-400 border-b border-zinc-800 pb-1.5">
            STEP INSPECTOR // CH 01
          </div>
          <div className="flex flex-col gap-2 text-[10px] text-zinc-400">
            <div className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800">
              <span>SELECTED STEP:</span>
              <span className="text-amber-400 font-bold">{selectedStep.toString().padStart(2, '0')}</span>
            </div>
            <div className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800">
              <span>INSTRUMENT:</span>
              <span className="text-emerald-400 font-bold">INS 01</span>
            </div>
            <div className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800">
              <span>NOTE VALUE:</span>
              <span className="text-zinc-200 font-bold">C-3</span>
            </div>
            <div className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800">
              <span>EFFECT CMD:</span>
              <span className="text-cyan-400 font-bold">P01 (Pitch)</span>
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-zinc-800 text-[9px] text-zinc-500">
            IPAD 9TH GEN // TOUCH ACCELERATED
          </div>
        </div>
      </div>
    </div>
  );
}

export default DualScreenWorkspace;