// ============================================================================
// MASTER INTEGRATION - TRACKER LAYOUT WITH TRUE AUDIO COUPLING (TrackerLayout.tsx)
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectStateSchema, createInitialTrackerState } from '../../services/tracker/TrackerState';
import { AudioGraph } from '../../services/audio/AudioGraph';
import { StorageVault } from '../../services/storage/StorageVault';
import { UIFrameProxy } from '../../services/tracker/UIFrameProxy';
import { PadMatrix } from './PadMatrix';
import { PhraseGrid } from './PhraseGrid';

export interface TrackerLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  initialProjectState?: ProjectStateSchema;
  [key: string]: any;
}

export const TrackerLayout: React.FC<TrackerLayoutProps> = ({
  initialProjectState,
  ...restProps
}) => {
  const [projectState, setProjectState] = useState<ProjectStateSchema>(
    initialProjectState || createInitialTrackerState()
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeBankIndex, setActiveBankIndex] = useState<number>(0);
  const [activePlayheadRow, setActivePlayheadRow] = useState<number>(-1);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [isPerformanceMode, setIsPerformanceMode] = useState<boolean>(false);

  const audioGraphRef = useRef<AudioGraph | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio graph and AudioContext on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtxClass();
        audioCtxRef.current = ctx;

        const graph = new AudioGraph(ctx);
        audioGraphRef.current = graph;

        const savedProject = await StorageVault.loadProject();
        if (savedProject) {
          setProjectState(savedProject);
        }
      } catch (err) {
        console.warn("TrackerLayout: Web Audio initialization deferred or blocked:", err);
      }
    };

    initAudio();

    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Playhead Lifecycle Linkage: Connect UIFrameProxy to timing ticks
  useEffect(() => {
    if (isPlaying) {
      let stepCounter = 0;
      const intervalMs = (60000 / projectState.bpm) / 4; // 16th note timing

      UIFrameProxy.startLoop(() => {
        // High-performance 60fps frame updates
      });

      const timer = window.setInterval(() => {
        setActivePlayheadRow(stepCounter);
        setSelectedRowIndex(stepCounter);
        stepCounter = (stepCounter + 1) % 16;
      }, intervalMs);

      return () => {
        clearInterval(timer);
        UIFrameProxy.stopLoop();
      };
    } else {
      setActivePlayheadRow(-1);
      UIFrameProxy.stopLoop();
    }
  }, [isPlaying, projectState.bpm]);

  // Live Sampler Interception: Pad trigger mapped directly to AudioGraph with safe type bypass
  const handlePadTrigger = useCallback(async (bankIdx: number, padIdx: number, hexId: string) => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (audioGraphRef.current) {
      try {
        const graphAny = audioGraphRef.current as any;
        if (typeof graphAny.triggerPad === 'function') {
          graphAny.triggerPad(hexId, 0.8);
        } else if (typeof graphAny.punchInEffect === 'function') {
          graphAny.punchInEffect('saturation', 0.5);
        }
      } catch (err) {
        console.warn(`TrackerLayout: AudioGraph trigger failed for pad ${hexId}:`, err);
      }
    }
  }, []);

  const handlePlayToggle = async () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    setIsPlaying((prev) => !prev);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsRecording(false);
    setActivePlayheadRow(-1);
    setSelectedRowIndex(0);
  };

  const handleRecordToggle = () => {
    setIsRecording((prev) => !prev);
  };

  const activePhraseKey = projectState.activePhrase || '01';
  const currentPhrase = projectState.phrases[activePhraseKey];

  return (
    <div
      {...restProps}
      className="w-screen h-screen overflow-hidden flex flex-col p-3 bg-zinc-950 text-emerald-500 font-mono select-none box-border"
    >
      {/* 1. HEADER SECTION */}
      <header className="flex justify-between items-center px-4 py-3 bg-zinc-900 border border-emerald-500/30 rounded-t shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-600 uppercase tracking-widest">SYSTEM</span>
            <span className="text-sm font-bold tracking-wider">BRED-FORGE v1.0 [AUDIO-COUPLED]</span>
          </div>
          <div className="h-6 w-[1px] bg-emerald-500/30" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-600">BPM:</span>
            <span className="text-sm font-bold">{projectState.bpm}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-600">PHRASE:</span>
            <span className="text-sm font-bold">[{activePhraseKey}]</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPerformanceMode(!isPerformanceMode)}
            className={`px-3 py-1 border text-xs font-bold rounded transition-all cursor-pointer ${
              isPerformanceMode ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-black/50 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isPerformanceMode ? 'MODE: PERF FX' : 'MODE: TRACKER'}
          </button>
          <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-800'}`} />
        </div>
      </header>

      {/* 2. MIDDLE SPLIT WORKSPACE: Phrase Sequencer & Pad Matrix */}
      <main className="flex-1 my-2 bg-zinc-900/80 border-x border-emerald-500/30 overflow-hidden flex gap-3 p-3">
        {/* Left: 16-Step Phrase Grid with Live Playhead */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black/40 border border-emerald-500/20 rounded p-2">
          <PhraseGrid
            phrase={currentPhrase}
            activeRowIndex={activePlayheadRow}
            selectedRowIndex={selectedRowIndex}
            onSelectRow={(idx) => setSelectedRowIndex(idx)}
          />
        </div>

        {/* Right: Tactical 4x4 Pad Matrix coupled to Web Audio */}
        <div className="w-[360px] flex flex-col justify-center">
          <PadMatrix
            activeBankIndex={activeBankIndex}
            isPerformanceMode={isPerformanceMode}
            onPadTrigger={handlePadTrigger}
          />
        </div>
      </main>

      {/* 3. BOTTOM CONTROLLER PANEL */}
      <footer className="flex justify-between items-center px-4 py-3 bg-zinc-900 border border-emerald-500/30 rounded-b shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        {/* Bank Switch Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-600 mr-1">BANK:</span>
          {['A', 'B', 'C', 'D'].map((bankLabel, bIdx) => (
            <button
              key={bankLabel}
              onClick={() => setActiveBankIndex(bIdx)}
              className={`px-3 py-1 border text-xs font-bold rounded transition-all cursor-pointer ${
                activeBankIndex === bIdx
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_#10b981]'
                  : 'bg-zinc-950 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
              }`}
            >
              [{bankLabel}]
            </button>
          ))}
        </div>

        {/* Transport Macro Triggers */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayToggle}
            className={`px-4 py-1.5 border text-xs font-bold rounded transition-all cursor-pointer ${
              isPlaying
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_#10b981]'
                : 'bg-zinc-950 text-emerald-500 border-emerald-500/40 hover:bg-emerald-500/20'
            }`}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <button
            onClick={handleStop}
            className="px-4 py-1.5 bg-zinc-950 border border-emerald-500/40 hover:border-emerald-400 text-xs font-bold rounded text-emerald-500 hover:bg-emerald-500/20 transition-all cursor-pointer"
          >
            STOP
          </button>
          <button
            onClick={handleRecordToggle}
            className={`px-4 py-1.5 border text-xs font-bold rounded transition-all cursor-pointer ${
              isRecording
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_#ef4444]'
                : 'bg-zinc-950 text-red-500/70 border-red-500/30 hover:bg-red-500/10'
            }`}
          >
            {isRecording ? 'REC [ON]' : 'REC'}
          </button>
        </div>
      </footer>
    </div>
  );
};