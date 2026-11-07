// ============================================================================
// BREDFORGE v1.0 — MAIN WORKSPACE APP (App.tsx)
// ============================================================================

import React, { useState } from 'react';
import { SequencerAudioBridge } from './services/audio/SequencerAudioBridge';
import { AudioVisualizerCanvas } from './components/visualizer/AudioVisualizerCanvas';

export function App() {
  const [audioBridge, setAudioBridge] = useState<SequencerAudioBridge | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState<boolean>(false);

  const initAudio = () => {
    if (!audioBridge) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const bridge = new SequencerAudioBridge(ctx);
      setAudioBridge(bridge);
      setIsAudioInitialized(true);
      
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 p-4 select-none">
      {/* Top Navigation & Visualizer Bar */}
      <header className="flex justify-between items-center bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-3 mb-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="font-mono font-bold text-emerald-400 text-lg tracking-widest">
            BREDFORGE <span className="text-xs text-slate-400 font-normal">v1.0 // IPAD 9TH GEN</span>
          </h1>
        </div>

        {/* Real-Time 60FPS Audio Visualizer & VU Meter */}
        <div className="w-72 sm:w-96">
          <AudioVisualizerCanvas 
            visualizerService={audioBridge?.getVisualizerService()} 
            width={360} 
            height={70} 
          />
        </div>
      </header>

      {/* Main Workspace Area / Audio Start Overlay */}
      <main className="flex-1 flex flex-col items-center justify-center bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 relative overflow-hidden">
        {!isAudioInitialized ? (
          <div className="flex flex-col items-center text-center gap-4 z-10">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 max-w-md">
              <h2 className="font-mono font-semibold text-base mb-1">AUDIO ENGINE STANDBY</h2>
              <p className="text-xs text-slate-300 font-sans">
                Tap below to activate the Web Audio context, start the 60fps visualizer, and unlock low-latency iPad performance.
              </p>
            </div>
            <button
              onClick={initAudio}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-sm rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              INITIALIZE AUDIO ENGINE // START
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 w-full h-full text-center">
            <div className="font-mono text-emerald-400 text-sm tracking-widest">
              SYSTEM ACTIVE // READY FOR PHASE 14 (PAD BANK MANAGER)
            </div>
            <button
              onClick={() => audioBridge?.triggerVoice('channel-1', 440, 0.3)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-mono text-xs text-slate-200 transition active:scale-95 cursor-pointer"
            >
              TEST VOICE TRIGGER (440Hz Sine)
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;