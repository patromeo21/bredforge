// ============================================================================
// BREDFORGE v1.0 — 100DVH BOUNDING CANVAS & UI SHELL (App.tsx)
// ============================================================================

import React from 'react';
import { useUIStore } from './store/useUIStore';
import { PhraseGrid } from './components/tracker/PhraseGrid';
import { GrooveView } from './components/tracker/GrooveView';
import { MixerMatrix } from './components/tracker/MixerMatrix';
import { PadMatrix } from './components/tracker/PadMatrix';

export function App() {
  const { activeView, setActiveView, isMenuOpen, toggleMenu } = useUIStore();

  return (
    <div className="h-screen max-h-[100dvh] w-screen max-w-[100dvw] overflow-hidden bg-black text-zinc-100 font-mono flex flex-col p-2 select-none">
      {/* Hero Canvas / Viewport Container with 100dvh lockdown */}
      <div className="relative flex-1 flex flex-col m8-console-bezel rounded-2xl border border-zinc-800 p-3 overflow-hidden">
        
        {/* Top Status Bar */}
        <div className="flex justify-between items-center bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-1.5 mb-2 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-widest text-emerald-400">BREDFORGE</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-300">100DVH WORKSPACE</span>
          </div>
          <button 
            onClick={toggleMenu}
            className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[10px]"
          >
            {isMenuOpen ? 'CLOSE MENU' : 'MENU'}
          </button>
        </div>

        {/* Main Canvas Viewport (Non-Destructive Layer Container) */}
        <div className="relative flex-1 overflow-hidden">
          {/* Tracker View [1,0] */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${activeView === 'tracker' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
            <PhraseGrid />
          </div>

          {/* Mixer View [2,0] */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${activeView === 'mixer' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
            <MixerMatrix />
          </div>

          {/* Pad Matrix View [2,1] */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${activeView === 'pads' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
            <PadMatrix />
          </div>

          {/* Groove View [3,0] */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${activeView === 'groove' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
            <GrooveView />
          </div>
        </div>

        {/* Sliding Menu Overlay */}
        <div className={`absolute top-0 right-0 h-full w-72 bg-zinc-900/95 border-l border-zinc-800 p-4 transform transition-transform duration-200 z-30 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
            <h3 className="font-bold text-sm text-zinc-200">SYSTEM MENU</h3>
            <button onClick={toggleMenu} className="text-zinc-400 hover:text-white text-xs">[ESC]</button>
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <button 
              onClick={() => { setActiveView('tracker'); toggleMenu(); }}
              className={`p-2 rounded text-left transition-colors ${activeView === 'tracker' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800'}`}
            >
              [1,0] Phrase Grid (Tracker)
            </button>
            <button 
              onClick={() => { setActiveView('mixer'); toggleMenu(); }}
              className={`p-2 rounded text-left transition-colors ${activeView === 'mixer' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800'}`}
            >
              [2,0] Mixer & Bus Matrix
            </button>
            <button 
              onClick={() => { setActiveView('pads'); toggleMenu(); }}
              className={`p-2 rounded text-left transition-colors ${activeView === 'pads' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800'}`}
            >
              [2,1] SP Pad Matrix
            </button>
            <button 
              onClick={() => { setActiveView('groove'); toggleMenu(); }}
              className={`p-2 rounded text-left transition-colors ${activeView === 'groove' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800'}`}
            >
              [3,0] Groove View (Launcher)
            </button>
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="flex justify-between items-center bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 mt-2 text-xs shrink-0">
          <div className="flex gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveView('tracker')}
              className={`px-2.5 py-1 rounded font-bold text-xs transition-colors ${
                activeView === 'tracker' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              [1,0] TRK
            </button>
            <button
              onClick={() => setActiveView('mixer')}
              className={`px-2.5 py-1 rounded font-bold text-xs transition-colors ${
                activeView === 'mixer' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              [2,0] MIX
            </button>
            <button
              onClick={() => setActiveView('pads')}
              className={`px-2.5 py-1 rounded font-bold text-xs transition-colors ${
                activeView === 'pads' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              [2,1] PADS
            </button>
            <button
              onClick={() => setActiveView('groove')}
              className={`px-2.5 py-1 rounded font-bold text-xs transition-colors ${
                activeView === 'groove' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              [3,0] GROOVE
            </button>
          </div>
          <div className="text-[10px] text-zinc-500 hidden md:block">
            IPAD 9TH GEN // 100DVH LOCKED
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;