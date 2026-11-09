// ============================================================================
// BREDFORGE v1.0 — HERO VIEW LAYOUT CONTAINER [REF: LAYOUT-01]
// ============================================================================

import React, { useState } from 'react';
import DualScreenWorkspace from '../tracker/DualScreenWorkspace';
import MixerMatrix from '../mixer/MixerMatrix';
import PunchInFXBus from '../tracker/PunchInFXBus';

export function HeroViewLayout() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'mixer' | 'fx'>('tracker');

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono select-none overflow-hidden">
      {/* Sub-Header Navigation */}
      <div className="flex justify-between items-center px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded">
            [WORKSPACE]
          </span>
          <span className="text-xs font-bold tracking-wider text-zinc-300">
            BREDFORGE ACTIVE ENGINE VIEW
          </span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded border border-zinc-800">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
              activeTab === 'tracker'
                ? 'bg-amber-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            TRACKER / PADS
          </button>
          <button
            onClick={() => setActiveTab('mixer')}
            className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
              activeTab === 'mixer'
                ? 'bg-amber-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            8-CH MIXER
          </button>
          <button
            onClick={() => setActiveTab('fx')}
            className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
              activeTab === 'fx'
                ? 'bg-amber-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            PUNCH-IN FX
          </button>
        </div>
      </div>

      {/* Active Viewport Content */}
      <div className="flex-1 relative min-h-0 p-2 overflow-hidden">
        {activeTab === 'tracker' && <DualScreenWorkspace />}
        {activeTab === 'mixer' && <MixerMatrix />}
        {activeTab === 'fx' && <PunchInFXBus />}
      </div>
    </div>
  );
}

export default HeroViewLayout;