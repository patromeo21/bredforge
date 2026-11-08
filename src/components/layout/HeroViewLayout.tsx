// ============================================================================
// BREDFORGE v1.0 — FULL-SCREEN HERO VIEW LAYOUT MODE [REF: M48]
// ============================================================================

import React, { useState } from 'react';
import { PhraseGrid } from '../tracker/PhraseGrid';
import { AudioVisualizerCanvas } from '../visualizer/AudioVisualizerCanvas';
import { FileMenuModal } from '../hud/FileMenuModal';

export function HeroViewLayout() {
  const [isHeroMode, setIsHeroMode] = useState<boolean>(true);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tracker' | 'visualizer' | 'pads'>('tracker');

  const toggleHeroMode = () => {
    setIsHeroMode((prev) => !prev);
  };

  return (
    <div
      className={`w-full h-screen h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col font-mono overflow-hidden select-none transition-all duration-300 ${
        isHeroMode ? 'p-1 bg-black' : 'p-4 bg-zinc-900'
      }`}
    >
      {/* Top Main Navigation / Hero Header */}
      <header className="flex items-center justify-between px-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-lg mb-1 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-amber-500 font-black text-sm tracking-widest uppercase">
            BREDFORGE <span className="text-[10px] text-zinc-500 font-normal">v1.0 [REF: M48]</span>
          </span>
          <div className="h-4 w-px bg-zinc-800"></div>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            {isHeroMode ? 'HERO VIEW [FULL]' : 'COMPACT VIEW'}
          </span>
        </div>

        {/* Quick View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFileMenuOpen(true)}
            className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors"
          >
            SYSTEM I/O
          </button>
          <button
            onClick={toggleHeroMode}
            className={`px-2.5 py-1 text-xs font-bold rounded border transition-all ${
              isHeroMode
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            {isHeroMode ? 'EXIT HERO' : 'HERO MODE'}
          </button>
        </div>
      </header>

      {/* Hero Display Canvas / Top Section */}
      <div className="w-full h-36 bg-zinc-950 border border-zinc-800 rounded-lg mb-1 overflow-hidden relative shadow-inner">
        <AudioVisualizerCanvas />
      </div>

      {/* Main Workspace Frame */}
      <main className="flex-1 min-h-0 bg-zinc-950 border border-zinc-800 rounded-lg p-2 overflow-hidden flex flex-col">
        {/* Module View Tabs */}
        <div className="flex items-center gap-1 mb-2 border-b border-zinc-900 pb-1.5">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-3 py-1 text-xs rounded font-bold transition-all ${
              activeTab === 'tracker'
                ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            TRACKER GRID
          </button>
          <button
            onClick={() => setActiveTab('pads')}
            className={`px-3 py-1 text-xs rounded font-bold transition-all ${
              activeTab === 'pads'
                ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            PAD MATRIX (4x4)
          </button>
        </div>

        {/* View Content */}
        <div className="flex-1 min-h-0 relative">
          {activeTab === 'tracker' && <PhraseGrid />}
          {activeTab === 'pads' && (
            <div className="w-full h-full flex items-center justify-center border border-dashed border-zinc-800 rounded-lg text-zinc-600 text-xs">
              [ 4x4 PAD MATRIX MODULE - BANK A ACTIVE ]
            </div>
          )}
        </div>
      </main>

      {/* System File Menu Overlay */}
      <FileMenuModal
        isOpen={isFileMenuOpen}
        onClose={() => setIsFileMenuOpen(false)}
      />
    </div>
  );
}

export default HeroViewLayout;