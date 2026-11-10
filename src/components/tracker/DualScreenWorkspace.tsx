// ============================================================================
// BREDFORGE v1.0 — DUAL SCREEN WORKSPACE [REF: WORKSPACE-01]
// ============================================================================

import React, { useState } from 'react';
import { TransportBar } from './TransportBar';
import { MixerView } from './MixerView';
import { SampleWorkbench } from './SampleWorkbench';

export function DualScreenWorkspace() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'mixer' | 'workbench'>('tracker');

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 p-2 gap-2 font-mono overflow-hidden select-none">
      
      {/* Top Master Transport Bar */}
      <TransportBar />

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs shadow-inner">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer ${
            activeTab === 'tracker'
              ? 'bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          TRACKER GRID
        </button>
        <button
          onClick={() => setActiveTab('mixer')}
          className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer ${
            activeTab === 'mixer'
              ? 'bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          MIXER VIEW
        </button>
        <button
          onClick={() => setActiveTab('workbench')}
          className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer ${
            activeTab === 'workbench'
              ? 'bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          SAMPLE WORKBENCH
        </button>
      </div>

      {/* Main Active Workspace View Container */}
      <div className="flex-1 flex flex-col bg-zinc-900/30 border border-zinc-800/80 rounded-2xl overflow-hidden p-3 shadow-2xl backdrop-blur-sm">
        {activeTab === 'tracker' && (
          <div className="flex-1 flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
            <div className="text-center p-6">
              <div className="text-amber-500 font-bold text-sm mb-1 tracking-wider">TRACKER VIEW ACTIVE</div>
              <p className="text-xs text-zinc-600">Dual-screen pattern sequencer grid ready for sync ticks.</p>
            </div>
          </div>
        )}

        {activeTab === 'mixer' && <MixerView />}

        {activeTab === 'workbench' && <SampleWorkbench />}
      </div>

    </div>
  );
}

export default DualScreenWorkspace;
