// ============================================================================
// BREDFORGE v1.0 — MASTER APPLICATION CONTAINER & VIEW ROUTER [REF: APP-01]
// ============================================================================

import React, { useState } from 'react';
import { DualScreenWorkspace } from './components/tracker/DualScreenWorkspace';
import { ChainView } from './components/tracker/ChainView';
import { SongView } from './components/tracker/SongView';
import { MixerView } from './components/tracker/MixerView';
import { GlobalFxView } from './components/tracker/GlobalFxView';

type ViewMode = 'project' | 'workspace' | 'chain' | 'song' | 'mixer' | 'fx';

export function App() {
  const [activeView, setActiveView] = useState<ViewMode>('workspace');
  const [projectName, setProjectName] = useState<string>('BRED_PROJECT_01');
  const [tempo, setTempo] = useState<number>(124.0);

  const navTabs: { id: ViewMode; label: string; shortcut: string }[] = [
    { id: 'project', label: 'PROJECT', shortcut: 'V1' },
    { id: 'workspace', label: 'WORKSPACE', shortcut: 'V2' },
    { id: 'chain', label: 'CHAIN', shortcut: 'V3' },
    { id: 'song', label: 'SONG', shortcut: 'V4' },
    { id: 'mixer', label: 'MIXER', shortcut: 'V5' },
    { id: 'fx', label: 'GLOBAL FX', shortcut: 'V6' },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-mono select-none overflow-hidden p-2 gap-2">
      
      {/* ================================================================== */}
      {/* MASTER TOP HARDWARE NAVIGATION & SYSTEM STATUS BAR                */}
      {/* ================================================================== */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg shrink-0 gap-2 shadow-md">
        
        {/* Brand & Project Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500 text-zinc-950 px-2 py-1 rounded font-bold text-xs tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            <span>BREDFORGE</span>
            <span className="text-[9px] bg-zinc-950 text-amber-400 px-1 rounded">v1.0</span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
            <span className="text-[10px] text-zinc-400">PROJ:</span>
            <span className="text-[10px] font-bold text-amber-400">{projectName}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
            <span className="text-[10px] text-zinc-400">BPM:</span>
            <span className="text-[10px] font-bold text-emerald-400">{tempo.toFixed(1)}</span>
          </div>
        </div>

        {/* Core 6 Views Navigation Switcher */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`px-2.5 py-1.5 text-[10px] font-bold rounded border cursor-pointer transition-all flex items-center gap-1.5 ${
                activeView === tab.id
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[8px] px-1 rounded ${activeView === tab.id ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-900 text-zinc-500'}`}>
                {tab.shortcut}
              </span>
            </button>
          ))}
        </nav>

      </header>

      {/* ================================================================== */}
      {/* ACTIVE VIEWPORT CONTAINER                                          */}
      {/* ================================================================== */}
      <main className="flex-1 min-h-0 relative overflow-hidden bg-zinc-950/80 rounded-lg border border-zinc-800/80">
        
        {/* VIEW 1: Project Home & Setup */}
        {activeView === 'project' && (
          <div className="flex flex-col h-full p-6 justify-center items-center text-center gap-4 animate-fadeIn">
            <div className="max-w-md bg-zinc-900/60 border border-zinc-800 p-6 rounded-xl shadow-lg flex flex-col gap-4">
              <span className="text-sm font-bold text-amber-500">PROJECT MANAGEMENT & META</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Welcome to Bredforge — the high-performance, M8-inspired PWA workstation engineered for iPad. Manage your project files, sample pools, and export settings here.
              </p>
              <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Project Title:</span>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-amber-400 font-bold text-xs text-right w-40"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Master Tempo:</span>
                  <input
                    type="number"
                    value={tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                    className="bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-emerald-400 font-bold text-xs text-right w-40"
                  />
                </div>
              </div>
              <button
                onClick={() => setActiveView('workspace')}
                className="mt-2 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded transition-all cursor-pointer shadow-md"
              >
                OPEN DUAL-SCREEN WORKSPACE →
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: Dual-Screen Workspace (Tracker + Workbench + Pads) */}
        {activeView === 'workspace' && (
          <div className="h-full w-full animate-fadeIn">
            <DualScreenWorkspace projectName={projectName} tempo={tempo} />
          </div>
        )}

        {/* VIEW 3: Chain View (Phrase Sequencing) */}
        {activeView === 'chain' && (
          <div className="h-full w-full animate-fadeIn p-2">
            <ChainView chainId="CH-00" chainName="MASTER_DRUM_CHAIN" />
          </div>
        )}

        {/* VIEW 4: Song View (Master Arrangement) */}
        {activeView === 'song' && (
          <div className="h-full w-full animate-fadeIn p-2">
            <SongView songName={projectName} tempo={tempo} />
          </div>
        )}

        {/* VIEW 5: Mixer View (8-Channel DSP Matrix) */}
        {activeView === 'mixer' && (
          <div className="h-full w-full animate-fadeIn p-2">
            <MixerView masterVolume={85} masterLimiter={true} />
          </div>
        )}

        {/* VIEW 6: Global FX (Punch-In Macro Laboratory) */}
        {activeView === 'fx' && (
          <div className="h-full w-full animate-fadeIn p-2">
            <GlobalFxView />
          </div>
        )}

      </main>

    </div>
  );
}

export default App;
