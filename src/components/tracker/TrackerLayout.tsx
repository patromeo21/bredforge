// ============================================================================
// BREDFORGE v1.0 — MASTER TRACKER LAYOUT & AUDIO BINDING (TrackerLayout.tsx)
// ============================================================================

import React, { useState } from 'react';
import { PhraseGrid } from './PhraseGrid';
import { GridController } from './GridController';
import { PadMatrix } from './PadMatrix';
import { ArrangerGrid } from './ArrangerGrid';
import { MixerView } from './MixerView';
import { ChainView } from './ChainView';
import { ChopView } from './ChopView';
import { AudioEngine } from '../../services/audio/AudioEngine'; // Adjust path if needed

type NavigationTab = 'WORKSPACE' | 'SONG' | 'CHAIN' | 'CHOP';

export const TrackerLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('WORKSPACE');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(124);

  // Mock selection state with column type-assertion for GridController compatibility
  const [gridSelection, setGridSelection] = useState<{ rowIndex: number; columnIndex: any }>({ rowIndex: 0, columnIndex: 0 });

  // Live Audio Engine Pad Trigger (SP-Style Zero-Latency Audition & Synth Fallback)
  const handlePadTrigger = async (bankIdx: number, padIdx: number, hexId: string) => {
    await AudioEngine.init();
    AudioEngine.playPad(hexId);
    console.log(`[SP AUDITION] Triggered Bank ${bankIdx} | Pad ${padIdx + 1} (Hex: ${hexId})`);
  };

  // Conditional step entry when REC transport is active
  const handleRecordStep = (padId: number) => {
    if (isRecording) {
      console.log(`[REC STEP] Recorded Pad ${padId} to active sequence row.`);
    }
  };

  const handleGlobalTouch = async () => {
    await AudioEngine.init();
  };

  return (
    <div 
      onClick={handleGlobalTouch}
      onTouchStart={handleGlobalTouch}
      className="flex flex-col h-screen w-screen bg-[#050810] text-emerald-400 font-mono select-none overflow-hidden p-2 gap-2"
    >
      
      {/* ================================================================== */}
      {/* HARDWARE TOP HEADER & 4-PAGE NAVIGATION ROUTER                     */}
      {/* ================================================================== */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-zinc-950/90 border border-emerald-500/30 rounded p-2 gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        
        {/* Brand & Status HUD */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-emerald-300 tracking-widest text-xs">BREDFORGE v1.0</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-emerald-500/70 border-l border-emerald-500/20 pl-3">
            <span>BPM: <strong className="text-emerald-400">{bpm}</strong></span>
            <span>TARGET: <strong className="text-emerald-400">IPAD 9TH GEN (60FPS)</strong></span>
          </div>
        </div>

        {/* 4-Page M8/SP Hardware Navigation Tabs */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded border border-emerald-500/20">
          {[
            { id: 'WORKSPACE', label: '1. WORKSPACE' },
            { id: 'SONG',      label: '2. SONG / MIXER' },
            { id: 'CHAIN',     label: '3. CHAIN' },
            { id: 'CHOP',      label: '4. CHOP' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NavigationTab)}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'text-emerald-500/70 hover:text-emerald-300 hover:bg-emerald-500/10'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Global Transport Controls (PLAY / REC) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
              isPlaying
                ? 'bg-emerald-400 text-black border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                : 'bg-zinc-900 text-emerald-500/80 border-emerald-500/30 hover:border-emerald-500/60'
            }`}
          >
            {isPlaying ? '■ STOP' : '▶ PLAY'}
          </button>
          
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-3 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
              isRecording
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.7)] animate-pulse'
                : 'bg-zinc-900 text-red-500/70 border-red-900/50 hover:border-red-500/40'
            }`}
          >
            ● REC {isRecording ? 'ARMED' : ''}
          </button>
        </div>

      </div>

      {/* ================================================================== */}
      {/* MAIN VIEWPORT ROUTER                                               */}
      {/* ================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PAGE 1: 50/50 DUAL-SCREEN SPLIT WORKSPACE */}
        {activeTab === 'WORKSPACE' && (
          <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden">
            {/* Left Half (50%): Tracker Phrase Grid & Controller */}
            <div className="flex-1 flex flex-col bg-zinc-950/40 border border-emerald-500/20 rounded p-2 overflow-hidden">
              <div className="flex justify-between items-center pb-1 mb-1 border-b border-emerald-500/20 text-[10px] text-emerald-500/70">
                <span>[ PHRASE STEP SEQUENCER ]</span>
                <span>ROW: 00 / 64</span>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden gap-2">
                <PhraseGrid />
                <GridController selection={gridSelection} />
              </div>
            </div>

            {/* Right Half (50%): 4x4 Sample Pad Matrix + Punch Mute/Solo */}
            <div className="flex-1 flex flex-col bg-zinc-950/40 border border-emerald-500/20 rounded p-2 overflow-hidden">
              <PadMatrix
                isRecording={isRecording}
                onPadTrigger={handlePadTrigger}
                onRecordStep={handleRecordStep}
              />
            </div>
          </div>
        )}

        {/* PAGE 2: SONG & MIXER SPLIT VIEW */}
        {activeTab === 'SONG' && (
          <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden">
            <div className="flex-1 flex flex-col bg-zinc-950/40 border border-emerald-500/20 rounded p-2 overflow-hidden">
              <ArrangerGrid />
            </div>
            <div className="w-full md:w-[380px] flex flex-col bg-zinc-950/40 border border-emerald-500/20 rounded p-2 overflow-hidden">
              <MixerView />
            </div>
          </div>
        )}

        {/* PAGE 3: CHAIN VIEW */}
        {activeTab === 'CHAIN' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChainView />
          </div>
        )}

        {/* PAGE 4: SAMPLE CHOP & ASSIGN */}
        {activeTab === 'CHOP' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChopView />
          </div>
        )}

      </div>

    </div>
  );
};
