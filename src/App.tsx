// ============================================================================
// BREDFORGE v1.0 — M8 HARDWARE SHELL (App.tsx)
// ============================================================================

import React, { useState } from 'react';
import { PhraseGrid } from './components/tracker/PhraseGrid';
import { GrooveView } from './components/tracker/GrooveView';

export function App() {
  const [activeView, setActiveView] = useState<'tracker' | 'groove'>('tracker');
  const [hardwareMode, setHardwareMode] = useState<string>('EDIT');

  return (
    <div className="flex flex-col h-screen w-screen bg-black p-2 md:p-4 text-zinc-100 font-mono overflow-hidden">
      {/* M8 Handheld Console Bezel Container */}
      <div className="flex flex-col flex-1 m8-console-bezel rounded-2xl border border-zinc-800 p-3 overflow-hidden">
        
        {/* Top Hardware Status Bar */}
        <div className="flex justify-between items-center bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-1.5 mb-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-widest text-emerald-400">BREDFORGE</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-300">M8-OS v1.0</span>
            <span className="text-zinc-500">|</span>
            <span className="text-cyan-400 font-bold">120 BPM</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold border border-zinc-700">
              MODE: {hardwareMode}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
              DSP: ACTIVE
            </span>
          </div>
        </div>

        {/* Main Viewport (Tracker vs Groove Matrix) */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'tracker' ? <PhraseGrid /> : <GrooveView />}
        </div>

        {/* Bottom Hardware Navigation / View Switcher Bar */}
        <div className="flex justify-between items-center bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 mt-3 text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('tracker')}
              className={`px-3 py-1 rounded font-bold text-xs transition-colors ${
                activeView === 'tracker'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              [1,0] PHRASE GRID
            </button>
            <button
              onClick={() => setActiveView('groove')}
              className={`px-3 py-1 rounded font-bold text-xs transition-colors ${
                activeView === 'groove'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              [3,0] GROOVE VIEW
            </button>
          </div>
          <div className="text-[10px] text-zinc-500 hidden sm:block">
            IPAD 9TH GEN // TOUCH & KEYBOARD OPTIMIZED
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;