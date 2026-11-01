import React, { useState, useRef } from 'react';
import { AudioEngine } from './services/audio/AudioEngine';
import { PlayMode, ChokeGroup } from './services/audio/types';
import './index.css';

export default function App() {
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [selectedPad, setSelectedPad] = useState<number>(0);
  const [activePads, setActivePads] = useState<Record<number, boolean>>({});
  const [loadedSamples, setLoadedSamples] = useState<Record<number, string>>({});

  const lastTriggerRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bankOffset = { A: 0, B: 4, C: 8, D: 12 }[activeBank];

  const handlePadDown = (localPadIndex: number, e: React.PointerEvent) => {
    e.preventDefault();
    const globalPadIndex = bankOffset + localPadIndex;
    
    const now = performance.now();
    if (now - lastTriggerRef.current < 20) return;
    lastTriggerRef.current = now;

    AudioEngine.unlock();
    AudioEngine.triggerPad(globalPadIndex, e.pointerId);

    setSelectedPad(globalPadIndex);
    setActivePads(prev => ({ ...prev, [globalPadIndex]: true }));
  };

  const handlePadUp = (localPadIndex: number, e: React.PointerEvent) => {
    e.preventDefault();
    const globalPadIndex = bankOffset + localPadIndex;
    AudioEngine.releasePad(globalPadIndex, e.pointerId);
    setActivePads(prev => ({ ...prev, [globalPadIndex]: false }));
  };

  const currentConfig = AudioEngine.getPadConfig(selectedPad);

  const updateSelectedConfig = (updates: { playMode?: PlayMode; chokeGroup?: ChokeGroup }) => {
    AudioEngine.setPadConfig(selectedPad, updates);
    setSelectedPad((prev) => prev);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadedSamples(prev => ({ ...prev, [selectedPad]: file.name }));

    const arrayBuffer = await file.arrayBuffer();
    await AudioEngine.loadSampleToPad(selectedPad, arrayBuffer);
  };

  return (
    <div className="w-screen h-[100dvh] bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none [-webkit-touch-callout:none]">
      {/* TOP HEADER */}
      <header className="h-12 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-orange-500 tracking-wider">BREDFORGE</span>
          <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">Mobile DAW v0.2</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Status: <strong className="text-emerald-400">Ready</strong></span>
        </div>
      </header>

      {/* MAIN WORKSPACE (DUAL PANE) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
        
        {/* LEFT PANEL: SAMPLE CHOPPER & WORKSPACE */}
        <section className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-300">Sample Chopper & Workspace</h2>
            <span className="text-xs text-orange-400 font-mono">Pad {selectedPad + 1} Selected</span>
          </div>

          {/* Waveform Preview & File Loader */}
          <div className="flex-1 min-h-[160px] bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center p-4 relative">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelected} 
              accept="audio/*,.wav,.mp3,.m4a,.aiff,.flac" 
              className="hidden" 
            />
            
            {loadedSamples[selectedPad] ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-emerald-400 font-mono">Loaded: {loadedSamples[selectedPad]}</span>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-200 transition-colors cursor-pointer"
                >
                  Replace Sample
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">No sample loaded on Pad {selectedPad + 1}</span>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 font-medium text-xs rounded-lg text-white shadow-lg shadow-orange-900/40 transition-colors cursor-pointer"
                >
                  Load Audio File (.wav / .mp3)
                </button>
              </div>
            )}
          </div>

          {/* Pad Voice Parameters */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-3">
            <div className="text-xs font-medium text-slate-400">Voice Parameters (Pad {selectedPad + 1})</div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Play Mode Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Play Mode</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded border border-slate-800">
                  <button
                    onClick={() => updateSelectedConfig({ playMode: 'oneShot' })}
                    className={`text-xs py-1 rounded transition-colors ${currentConfig.playMode === 'oneShot' ? 'bg-orange-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    One-Shot
                  </button>
                  <button
                    onClick={() => updateSelectedConfig({ playMode: 'gate' })}
                    className={`text-xs py-1 rounded transition-colors ${currentConfig.playMode === 'gate' ? 'bg-orange-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Gate
                  </button>
                </div>
              </div>

              {/* Choke Group Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Choke Group</label>
                <div className="grid grid-cols-5 gap-1 bg-slate-900 p-1 rounded border border-slate-800">
                  {[0, 1, 2, 3, 4].map(group => (
                    <button
                      key={group}
                      onClick={() => updateSelectedConfig({ chokeGroup: group as ChokeGroup })}
                      className={`text-xs py-1 rounded transition-colors text-center ${currentConfig.chokeGroup === group ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {group === 0 ? 'Off' : group}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: 4x4 PAD GRID & BANKS */}
        <section className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 justify-between">
          
          {/* BANK SELECTORS */}
          <div className="grid grid-cols-4 gap-2">
            {(['A', 'B', 'C', 'D'] as const).map(bank => (
              <button
                key={bank}
                onClick={() => setActiveBank(bank)}
                className={`py-2 rounded-lg font-bold text-xs border transition-all ${
                  activeBank === bank
                    ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                BANK {bank}
              </button>
            ))}
          </div>

          {/* 4x4 PAD MATRIX */}
          <div className="grid grid-cols-4 gap-2.5 my-auto aspect-square max-w-[420px] mx-auto w-full">
            {Array.from({ length: 16 }).map((_, i) => {
              const mappedIndex = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3][i];
              const globalIdx = bankOffset + mappedIndex;
              const isActive = activePads[globalIdx];
              const isSelected = selectedPad === globalIdx;
              const hasSample = !!loadedSamples[globalIdx];

              return (
                <button
                  key={mappedIndex}
                  onPointerDown={(e) => handlePadDown(mappedIndex, e)}
                  onPointerUp={(e) => handlePadUp(mappedIndex, e)}
                  onPointerLeave={(e) => handlePadUp(mappedIndex, e)}
                  className={`rounded-xl border flex flex-col items-center justify-between p-2.5 transition-all active:scale-95 touch-none select-none [-webkit-touch-callout:none] relative overflow-hidden ${
                    isActive
                      ? 'bg-orange-500 border-orange-400 text-slate-950 shadow-inner shadow-orange-700'
                      : isSelected
                      ? 'bg-slate-800 border-orange-500/80 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-mono opacity-60 self-start">{activeBank}{mappedIndex + 1}</span>
                  <span className="font-bold text-sm tracking-wide">{mappedIndex + 1}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasSample ? 'bg-emerald-400' : 'bg-slate-800'} self-end`} />
                </button>
              );
            })}
          </div>

          {/* STATUS FOOTER */}
          <div className="text-center text-[10px] text-slate-500 font-mono">
            Layer 5: Touch Callout & File Acceptance Patched
          </div>
        </section>

      </main>
    </div>
  );
}