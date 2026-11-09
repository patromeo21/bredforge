// ============================================================================
// BREDFORGE v1.0 — DUAL SCREEN TRACKER & 4X4 PAD / M8 GRID WORKSPACE [REF: WS-02]
// ============================================================================

import React, { useState } from 'react';

export function DualScreenWorkspace() {
  const [gridMode, setGridMode] = useState<'4x4' | 'm8'>('4x4');
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

  // 4x4 Pad definitions
  const pads = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    name: `PAD ${i + 1}`,
    note: `C${Math.floor(i / 4) + 1}`,
    assignedIns: `INS 0${(i % 4) + 1}`,
  }));

  // M8 Keypad mapping definition
  const m8Keys = [
    { label: 'UP', key: '▲', cmd: 'NAV_UP' },
    { label: 'DOWN', key: '▼', cmd: 'NAV_DOWN' },
    { label: 'LEFT', key: '◄', cmd: 'NAV_LEFT' },
    { label: 'RIGHT', key: '►', cmd: 'NAV_RIGHT' },
    { label: 'EDIT', key: 'E', cmd: 'EDIT_VAL' },
    { label: 'OPTION', key: 'O', cmd: 'OPT_MENU' },
    { label: 'SHIFT', key: 'S', cmd: 'MOD_SHIFT' },
    { label: 'PLAY', key: 'P', cmd: 'SEQ_PLAY' },
  ];

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono select-none overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-2 mb-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded border border-amber-500/40">
            [M8/MPC]
          </span>
          <span className="font-bold tracking-wider text-xs text-zinc-200">
            DUAL-SCREEN TRACKER & DYNAMIC GRID WORKSPACE
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">IPAD 9TH GEN // TOUCH & KEYBOARD READY</span>
      </div>

      {/* Main Dual Screen Container */}
      <div className="flex-1 relative min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        
        {/* LEFT SCREEN: M8 GRID TRACKER (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
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

        {/* RIGHT SCREEN: SAMPLE EDIT & DYNAMIC GRID CONTAINER (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3 min-h-0 overflow-hidden">
          
          {/* Top Panel: Sample Edit & Step Parameters */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2 shrink-0">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
              <span className="text-[11px] font-bold text-amber-400">
                SAMPLE EDIT & INSPECTOR // STEP {selectedStep.toString().padStart(2, '0')}
              </span>
              <span className="text-[9px] text-emerald-400 font-bold">INS 01</span>
            </div>

            {/* Mini Waveform & Trim Preview */}
            <div className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-x-0 h-0.5 bg-amber-500/30"></div>
              <span className="text-[9px] text-zinc-600">[ WAVEFORM CANVAS PREVIEW ]</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex justify-between bg-zinc-950 p-1.5 rounded border border-zinc-800">
                <span className="text-zinc-500">TRIM START:</span>
                <span className="text-zinc-200">0.00s</span>
              </div>
              <div className="flex justify-between bg-zinc-950 p-1.5 rounded border border-zinc-800">
                <span className="text-zinc-500">TRIM END:</span>
                <span className="text-zinc-200">1.24s</span>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Flip Toggle & Dynamic Grid Target */}
          <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 flex flex-col min-h-0 overflow-hidden">
            
            {/* Grid Flip Switcher Header */}
            <div className="flex justify-between items-center mb-2 shrink-0">
              <div className="flex gap-1.5">
                {(['A', 'B', 'C', 'D'] as const).map((bank) => (
                  <button
                    key={bank}
                    onClick={() => setActiveBank(bank)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded border cursor-pointer ${
                      activeBank === bank
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    BANK {bank}
                  </button>
                ))}
              </div>

              {/* Dedicated Grid Flip Toggle */}
              <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800">
                <button
                  onClick={() => setGridMode('4x4')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${
                    gridMode === '4x4'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  4X4 PADS
                </button>
                <button
                  onClick={() => setGridMode('m8')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${
                    gridMode === 'm8'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  M8 BUTTONS
                </button>
              </div>
            </div>

            {/* Dynamic Grid Viewport */}
            <div className="flex-1 min-h-0">
              {gridMode === '4x4' ? (
                /* 4x4 MPC Pad Grid */
                <div className="grid grid-cols-4 gap-2 h-full">
                  {pads.map((pad) => (
                    <button
                      key={pad.id}
                      className="flex flex-col justify-between p-2 bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 rounded-lg text-left active:bg-amber-500 active:text-zinc-950 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[9px] font-bold text-amber-400 group-active:text-zinc-950">
                          P{pad.id < 10 ? `0${pad.id}` : pad.id}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-200 group-active:text-zinc-950">
                        {pad.note}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                /* M8 Hardware Button Grid */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 h-full">
                  {m8Keys.map((k, idx) => (
                    <button
                      key={idx}
                      className="flex flex-col justify-center items-center p-2 bg-zinc-900 border border-zinc-800 hover:border-amber-400/60 rounded-lg active:bg-amber-500 active:text-zinc-950 cursor-pointer transition-all"
                    >
                      <span className="text-sm font-bold text-amber-400">{k.key}</span>
                      <span className="text-[9px] font-bold tracking-wider text-zinc-300">{k.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default DualScreenWorkspace;