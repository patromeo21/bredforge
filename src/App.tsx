// ============================================================================
// BREDFORGE v1.0 — MASTER HARDWARE CHASSIS & VIEWPORT SHELL [REF: SHELL-01]
// ============================================================================

import React, { useState } from 'react';
import DualScreenWorkspace from './components/tracker/DualScreenWorkspace';
import MixerMatrix from './components/mixer/MixerMatrix';
import PunchInFXBus from './components/tracker/PunchInFXBus';

export function App() {
  const [activeView, setActiveView] = useState<'tracker' | 'mixer' | 'fx'>('tracker');
  const [systemPower, setSystemPower] = useState<boolean>(true);

  if (!systemPower) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center font-mono">
        <button
          onClick={() => setSystemPower(true)}
          className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-amber-500 rounded-lg hover:border-amber-500/50 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.1)]"
        >
          [ POWER ON // BREDFORGE v1.0 ]
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#09090b] text-zinc-100 font-mono select-none overflow-hidden flex flex-col p-2 sm:p-4 border-4 border-zinc-900 shadow-2xl">
      {/* Top Hardware Status Bar */}
      <header className="flex justify-between items-center bg-zinc-950 border border-zinc-800/80 rounded-t-lg px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
            <span className="font-extrabold tracking-wider text-xs text-zinc-100">BREDFORGE</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-zinc-900 text-amber-400 border border-zinc-800 rounded">
            M8/MPC HYBRID v1.0
          </span>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-md border border-zinc-800">
          <button
            onClick={() => setActiveView('tracker')}
            className={`px-3 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
              activeView === 'tracker'
                ? 'bg-amber-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            [1] TRACKER & PADS
          </button>
          <button
            onClick={() => setActiveView('mixer')}
            className={`px-3 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
              activeView === 'mixer'
                ? 'bg-amber-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            [2] 8-CH MIXER
          </button>
          <button
            onClick={() => setActiveView('fx')}
            className={`px-3 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
              activeView === 'fx'
                ? 'bg-amber-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            [3] PUNCH-IN FX
          </button>
        </nav>

        {/* System Hardware Controls */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-400">
          <span className="hidden sm:inline">CPU: 4.2% [120fps]</span>
          <button
            onClick={() => setSystemPower(false)}
            title="Power Off"
            className="px-2 py-1 bg-red-950/40 text-red-400 border border-red-900/60 rounded hover:bg-red-900/40 cursor-pointer"
          >
            PWR
          </button>
        </div>
      </header>

      {/* Main Viewport Workspace Container */}
      <main className="flex-1 relative min-h-0 bg-zinc-950/40 border-x border-b border-zinc-800/80 rounded-b-lg p-2 overflow-hidden shadow-inner">
        {activeView === 'tracker' && <DualScreenWorkspace />}
        {activeView === 'mixer' && <MixerMatrix />}
        {activeView === 'fx' && <PunchInFXBus />}
      </main>

      {/* Bottom Hardware Footer */}
      <footer className="flex justify-between items-center px-2 pt-2 text-[9px] text-zinc-600 shrink-0">
        <span>IPAD 9TH GEN // WEBAUDIO / CANVAS WORKLET BRIDGE</span>
        <span>STATUS: SYSTEM STABLE // READY</span>
      </footer>
    </div>
  );
}

export default App;