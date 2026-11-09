// ============================================================================
// BREDFORGE v1.0 — MAIN APPLICATION ROOT & VIEW ROUTER [REF: APP-01]
// ============================================================================

import React, { useState, useEffect } from 'react';
import { DualScreenWorkspace } from './components/tracker/DualScreenWorkspace';
import { MixerView } from './components/tracker/MixerView';
import { GlobalFxView } from './components/tracker/GlobalFxView';
import { SampleWorkbench } from './components/tracker/SampleWorkbench';
import { PatternLaunchView } from './components/tracker/PatternLaunchView';
import { audioEngine } from './services/AudioEngine';

type ViewMode = 'tracker' | 'patterns' | 'mixer' | 'fx' | 'samples';

export function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('tracker');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(124.0);
  const [masterVol, setMasterVol] = useState<number>(85);
  const [masterLimiter, setMasterLimiter] = useState<boolean>(true);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);

  // Initialize Audio & MIDI on first user gesture
  const handleUnlockAudio = async () => {
    if (!audioUnlocked) {
      const success = await audioEngine.initAudio();
      if (success) {
        setAudioUnlocked(true);
      }
    }
  };

  useEffect(() => {
    const unlockHandler = () => {
      handleUnlockAudio();
    };
    window.addEventListener('pointerdown', unlockHandler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockHandler);
    };
  }, [audioUnlocked]);

  const togglePlayback = () => {
    handleUnlockAudio();
    setIsPlaying((prev) => !prev);
  };

  return (
    <div
      onClick={handleUnlockAudio}
      className="flex flex-col h-[100dvh] w-screen bg-zinc-950 text-zinc-100 font-mono select-none overflow-hidden p-2 gap-2"
    >
      
      {/* Top Global Navigation & Transport Bar */}
      <header className="flex flex-col sm:flex-row justify-between items-center bg-zinc-900/80 border border-zinc-800 px-3 py-2 rounded-xl gap-2 shrink-0 shadow-lg">
        
        {/* Logo & Version */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/40 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-extrabold text-amber-400 tracking-wider">
              BREDFORGE
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 hidden md:inline">
            M8-STYLE PWA // A13 OPTIMIZED
          </span>
        </div>

        {/* View Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {[
            { id: 'tracker', label: 'TRACKER' },
            { id: 'patterns', label: 'PATTERNS' },
            { id: 'mixer', label: 'MIXER' },
            { id: 'fx', label: 'GLOBAL FX' },
            { id: 'samples', label: 'SAMPLES' },
          ].map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as ViewMode)}
                className={`px-3 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Global Transport & BPM Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
            <span className="text-[10px] text-zinc-400">BPM</span>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-12 bg-transparent text-amber-400 font-bold text-xs text-center focus:outline-none"
              min="40"
              max="300"
            />
          </div>

          <button
            onClick={togglePlayback}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              isPlaying
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                : 'bg-zinc-950 text-emerald-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {isPlaying ? '■ STOP' : '▶ PLAY'}
          </button>
        </div>

      </header>

      {/* Main View Router Container */}
      <main className="flex-1 min-h-0 relative flex flex-col">
        {currentView === 'tracker' && <DualScreenWorkspace projectName="BRED_PROJECT_01" tempo={bpm} />}
        {currentView === 'patterns' && <PatternLaunchView />}
        {currentView === 'mixer' && <MixerView masterVolume={masterVol} masterLimiter={masterLimiter} />}
        {currentView === 'fx' && <GlobalFxView />}
        {currentView === 'samples' && (
          <SampleWorkbench
            audioBuffer={null}
            trimStart={0}
            trimEnd={1}
            slices={[]}
            onUpdateTrim={() => {}}
            onUpdateSlices={() => {}}
          />
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 px-3 py-1 rounded-lg text-[9px] text-zinc-500 shrink-0">
        <span>AUDIO: {audioUnlocked ? 'ACTIVE (DSP UNLOCKED)' : 'TAP ANYWHERE TO UNLOCK AUDIO'}</span>
        <span className="text-amber-400 font-bold">120FPS CANVAS // PWA STANDALONE MODE</span>
      </footer>

    </div>
  );
}

export default App;
