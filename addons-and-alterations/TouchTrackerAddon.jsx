import React, { useState, useEffect } from 'react';

/**
 * Addon Module: Touch-Optimized M8 Tracker Core (Right-Side Layout)
 * Optimized for Mobile Chrome (Android/iOS) and Safari using Pointer Events
 * and touch-action suppression to prevent viewport panning/scrolling bugs.
 */
export default function TouchTrackerAddon({ currentStep = 0, onStepSelect }) {
  // Simulated 4-channel M8 tracker rows (Note, Instrument, Volume, Command)
  const [rows, setRows] = useState([
    { id: 0, notes: ['C-4', '01', '64', 'P01'], active: true },
    { id: 1, notes: ['...', '--', '--', '---'], active: false },
    { id: 2, notes: ['D-4', '01', '50', '---'], active: false },
    { id: 3, notes: ['...', '--', '--', '---'], active: false },
    { id: 4, notes: ['E-4', '02', '64', 'C05'], active: false },
    { id: 5, notes: ['...', '--', '--', '---'], active: false },
    { id: 6, notes: ['G-4', '02', '55', '---'], active: false },
    { id: 7, notes: ['...', '--', '--', '---'], active: false },
  ]);

  const handleRowTouch = (index) => {
    if (onStepSelect) onStepSelect(index);
  };

  return (
    <div 
      className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-gray-200 font-mono shadow-2xl overflow-hidden select-none"
      style={{ touchAction: 'none' }} // Prevents mobile browser gesture conflicts / zooming
    >
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-800">
        <span className="text-[11px] uppercase tracking-wider text-sky-400 font-bold">M8 Tracker Grid (Right Stage)</span>
        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">Chrome Mobile Ready</span>
      </div>

      {/* Tracker Header */}
      <div className="grid grid-cols-5 text-[10px] text-gray-500 mb-1 px-1 font-bold text-center">
        <span>ROW</span>
        <span className="text-sky-400">NOTE</span>
        <span className="text-purple-400">INS</span>
        <span className="text-emerald-400">VOL</span>
        <span className="text-amber-400">CMD</span>
      </div>

      {/* Tracker Matrix Rows with 44x44px mobile touch targets */}
      <div className="space-y-1 max-h-64 overflow-y-auto overscroll-contain">
        {rows.map((row, idx) => {
          const isActive = idx === (currentStep % rows.length);
          return (
            <div
              key={row.id}
              onPointerDown={() => handleRowTouch(idx)}
              className={`grid grid-cols-5 items-center text-center py-2 px-1 rounded transition-colors cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 shadow-md'
                  : 'bg-gray-900/80 border border-gray-800/60 hover:bg-gray-800 text-gray-300'
              }`}
            >
              <span className="text-[10px] text-gray-500 font-bold">
                {idx < 10 ? `0${idx}` : idx}
              </span>
              <span className="text-xs font-bold text-sky-300">{row.notes[0]}</span>
              <span className="text-xs text-purple-300">{row.notes[1]}</span>
              <span className="text-xs text-emerald-300">{row.notes[2]}</span>
              <span className="text-xs text-amber-300">{row.notes[3]}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-[9px] text-gray-500 text-center">
        Tap any row for instant step selection • Optimized for Mobile Chrome & Safari
      </div>
    </div>
  );
}
