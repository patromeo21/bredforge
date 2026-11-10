// ============================================================================
// BREDFORGE v1.0 — DUAL SCREEN WORKSPACE [REF: WORKSPACE-01]
// ============================================================================

import React, { useState } from 'react';
import { TransportBar } from './TransportBar';
import { MixerView } from './MixerView';
import { SampleWorkbench } from './SampleWorkbench';
import { TrackerGrid } from './TrackerGrid';
import { AudioVisualizerCanvas } from './AudioVisualizerCanvas';
import { PadBankManager } from './PadBankManager';

export interface DualScreenWorkspaceProps {
  projectName?: string;
  tempo?: number;
  [key: string]: any;
}

export function DualScreenWorkspace({ projectName, tempo }: DualScreenWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'tracker' | 'mixer' | 'workbench' | 'pads'>('tracker');

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 p-2 gap-2 font-mono overflow-hidden select-none">
      
      {/* Top Master Transport Bar */}
      <TransportBar />

      {/* Project Banner / Workspace Header if passed from App */}
      {(projectName || tempo) && (
        <div className="flex items-center justify-between px-3 py-1 bg-zinc-900/50 border border-zinc-800/60 rounded-lg text-[11px] text-zinc-400">
          <span>PROJECT: <strong className="text-amber-400">{projectName || 'BREDFORGE_UNTITLED'}</strong></span>
          {tempo && <span>DEFAULT TEMPO: <strong className="text-amber-400">{tempo} BPM</strong></span>}
        </div>
      )}

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs shadow-inner overflow-x-auto">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer whitespace-nowrap ${
            activeTab === 'tracker'
              ? 'bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          TRACKER GRID
        </button>
        <button
          onClick={() => setActiveTab('pads')}
          className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer whitespace-nowrap ${
            activeTab === 'pads'
              ? 'bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          PAD BANKS (A-D)
        </button>
        <button
          onClick={() => setActiveTab('mixer')}
          className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer whitespace-nowrap ${
            activeTab === 'mixer'
              ? 'bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          MIXER VIEW
        </button>
        <button
          onClick={() => setActiveTab('workbench')}
          className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer whitespace-nowrap ${
            activeTab === 'workbench'
              ? 'bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          SAMPLE WORKBENCH
        </button>
      </div>

      {/* Main Active Workspace View Container */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 overflow-hidden">
        <div className="flex-1 flex flex-col bg-zinc-900/30 border border-zinc-800/80 rounded-2xl overflow-hidden p-3 shadow-2xl backdrop-blur-sm">
          {activeTab === 'tracker' && <TrackerGrid />}
          {activeTab === 'pads' && <PadBankManager />}
          {activeTab === 'mixer' && <MixerView />}
          {activeTab === 'workbench' && <SampleWorkbench />}
        </div>

        {/* Side Panel: Master Audio Visualizer */}
        <div className="w-full lg:w-80 flex flex-col gap-2">
          <AudioVisualizerCanvas />
        </div>
      </div>

    </div>
  );
}

export default DualScreenWorkspace;
