// ============================================================================
// BREDFORGE v1.0 — MASTER HERO VIEW LAYOUT & DUAL-SCREEN SHELL [REF: M61]
// ============================================================================

import React, { useState, useRef } from 'react';
import { useFullscreen } from '../../hooks/useFullscreen';
import { DualScreenWorkspace } from '../tracker/DualScreenWorkspace';
import { MixerMatrix } from '../tracker/MixerMatrix';
import { AudioVisualizerCanvas } from '../visualizer/AudioVisualizerCanvas';

type ActiveView = 'tracker' | 'mixer' | 'visualizer';

export function HeroViewLayout() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
  const [activeView, setActiveView] = useState<ActiveView>('tracker');

  return (
    <div
      ref={containerRef}
      className="w-screen h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col font-mono select-none overflow-hidden p-2 md:p-3 gap-2"
    >
      {/* Top Navigation & App Header */}
      <header className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800/80 rounded-lg px-3 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="font-bold tracking-wider text-xs text-amber-400">
              BREDFORGE // v1.0
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 hidden sm:inline">
            IPAD 9TH GEN // 120HZ DUAL-SCREEN DAW
          </span>
        </div>

        {/* View Switching Tabs */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveView('tracker')}
            className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${
              activeView === 'tracker'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            TRACKER
          </button>
          <button
            onClick={() => setActiveView('mixer')}
            className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${
              activeView === 'mixer'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            MIXER
          </button>
          <button
            onClick={() => setActiveView('visualizer')}
            className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${
              activeView === 'visualizer'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            SCOPE
          </button>
        </div>

        {/* Fullscreen & Diagnostics Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-700/80 rounded text-[10px] font-bold transition-colors"
            title="Toggle Native Browser Fullscreen"
          >
            {isFullscreen ? '[ EXIT FULL ]' : '[ FULLSCREEN ]'}
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 relative min-h-0 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800/80">
        <div className={`absolute inset-0 ${activeView === 'tracker' ? 'block' : 'hidden'}`}>
          <DualScreenWorkspace />
        </div>
        <div className={`absolute inset-0 ${activeView === 'mixer' ? 'block' : 'hidden'}`}>
          <MixerMatrix />
        </div>
        <div className={`absolute inset-0 p-2 ${activeView === 'visualizer' ? 'block' : 'hidden'}`}>
          <AudioVisualizerCanvas />
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/60 rounded-lg text-[10px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-4">
          <span>CLOCK: 120 BPM [INTERNAL]</span>
          <span>DSP BUS: ACTIVE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-500/80">IPAD 9TH GEN TOUCH ENGINE READY</span>
        </div>
      </footer>
    </div>
  );
}

export default HeroViewLayout;