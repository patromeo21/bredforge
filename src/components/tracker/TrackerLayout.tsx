// ============================================================================
// STAGE F - DUAL-SCREEN WORKSPACE & M8 PUNCH-IN CORE (TrackerLayout.tsx)
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectStateSchema, createInitialTrackerState } from '../../services/tracker/TrackerState';
import { AudioGraph } from '../../services/audio/AudioGraph';
import { StorageVault } from '../../services/storage/StorageVault';
import { UIFrameProxy } from '../../services/tracker/UIFrameProxy';
import { AntiDriftClock } from '../../services/audio/AntiDriftClock';
import { PadMatrix } from './PadMatrix';
import { PhraseGrid } from './PhraseGrid';
import { GridController, GridSelectionState, handleGridCellEdit } from './GridController';
import { TransportFooter } from './TransportFooter';

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
  const [gridSelection, setGridSelection] = useState<GridSelectionState>({ rowIndex: 0, columnIndex: 'NOTE' });
  const [activeTab, setActiveTab] = useState<'WORKSPACE' | 'SONG_MIXER' | 'CHAIN' | 'CHOP'>('WORKSPACE');
  
  // M8 Punch-In Performance States (Mute & Solo)
  const [activeMuteTrack, setActiveMuteTrack] = useState<number | null>(null);
  const [activeSoloTrack, setActiveSoloTrack] = useState<number | null>(null);

  const audioGraphRef = useRef<AudioGraph | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const clockRef = useRef<AntiDriftClock | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtxClass();
        audioCtxRef.current = ctx;

        const graph = new AudioGraph(ctx);
        audioGraphRef.current = graph;

        const clock = new AntiDriftClock(ctx, projectState.bpm, (stepIndex) => {
          setActivePlayheadRow(stepIndex);
          if (isRecording) {
            setGridSelection((prev) => ({ ...prev, rowIndex: stepIndex }));
          }
        });
        clockRef.current = clock;

        const savedProject = await StorageVault.loadProject();
        if (savedProject) {
          setProjectState(savedProject);
        }
      } catch (err) {
        console.warn("TrackerLayout: Audio init deferred:", err);
      }
    };

    initAudio();

    return () => {
      if (clockRef.current) clockRef.current.stop();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [isRecording]);

  useEffect(() => {
    if (isPlaying) {
      UIFrameProxy.startLoop(() => {});
      if (clockRef.current) {
        clockRef.current.setBpm(projectState.bpm);
        clockRef.current.start();
      }
    } else {
      if (clockRef.current) clockRef.current.stop();
      UIFrameProxy.stopLoop();
      setActivePlayheadRow(-1);
    }
  }, [isPlaying, projectState.bpm]);

  // Clean Pad Trigger: Audio preview is instantaneous. Grid write ONLY occurs if REC is active.
  const handlePadTrigger = useCallback(async (bankIdx: number, padIdx: number, hexId: string) => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (audioGraphRef.current) {
      try {
        const graphAny = audioGraphRef.current as any;
        if (typeof graphAny.triggerPad === 'function') {
          graphAny.triggerPad(hexId, 0.8);
        }
      } catch (err) {
        console.warn("Trigger failed:", err);
      }
    }

    if (isRecording) {
      setProjectState((prevState) => {
        const activePhraseKey = prevState.activePhrase || '01';
        const padAbsoluteIndex = (bankIdx * 16) + padIdx;
        const updated = handleGridCellEdit(prevState, gridSelection, padAbsoluteIndex, activePhraseKey);
        
        const nextRow = (gridSelection.rowIndex + 1) % 16;
        setGridSelection((sel) => ({ ...sel, rowIndex: nextRow }));

        StorageVault.saveProject(updated).catch(console.error);
        return updated;
      });
    }
  }, [gridSelection, isRecording]);

  const handlePlayToggle = async () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    setIsPlaying((prev) => !prev);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsRecording(false);
    if (clockRef.current) clockRef.current.stop();
    setActivePlayheadRow(-1);
    setGridSelection((prev) => ({ ...prev, rowIndex: 0 }));
  };

  const activePhraseKey = projectState.activePhrase || '01';
  const currentPhrase = projectState.phrases[activePhraseKey];

  return (
    <div
      {...restProps}
      className="w-screen h-screen overflow-hidden flex flex-col p-2 bg-[#050810] text-emerald-500 font-mono select-none box-border shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"
    >
      {/* 1. TOP HEADER & 4-PAGE M8 NAV ROUTER */}
      <header className="flex justify-between items-center px-4 py-2 bg-zinc-900 border border-emerald-500/30 rounded-t shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] text-emerald-600 uppercase tracking-widest">SYSTEM</span>
            <span className="text-xs font-bold tracking-wider text-emerald-400">BRED-FORGE v1.0</span>
          </div>
          <div className="h-5 w-[1px] bg-emerald-500/30" />
          {/* 4-Page View Switcher */}
          <div className="flex gap-1">
            {(['WORKSPACE', 'SONG_MIXER', 'CHAIN', 'CHOP'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-1 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                    : 'bg-zinc-950 text-emerald-500/70 border-emerald-500/20 hover:border-emerald-500/40'
                }`}
              >
                {tab === 'WORKSPACE' ? '1. WORKSPACE' : tab === 'SONG_MIXER' ? '2. SONG/MIXER' : tab === 'CHAIN' ? '3. CHAIN' : '4. CHOP'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-emerald-600">BPM: <strong className="text-emerald-400">{projectState.bpm}</strong></span>
          <span className="text-[10px] text-emerald-600">PHR: <strong className="text-emerald-400">[{activePhraseKey}]</strong></span>
          <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-800'}`} />
        </div>
      </header>

      {/* 2. DYNAMIC PAGE ROUTER VIEWPORT */}
      <main className="flex-1 my-1.5 bg-zinc-900/80 border-x border-emerald-500/30 overflow-hidden flex flex-col p-2">
        {activeTab === 'WORKSPACE' && (
          /* PAGE 1: 50/50 DUAL-SCREEN SPLIT WORKSPACE */
          <div className="flex-1 flex gap-2 overflow-hidden">
            {/* Left Half (50%): Full Tracker Phrase View & Grid Controller */}
            <div className="w-1/2 flex flex-col bg-black/50 border border-emerald-500/20 rounded p-2 overflow-hidden">
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-emerald-500/20">
                <span className="text-[11px] font-bold tracking-wider text-emerald-400">TRACKER PHRASE VIEW</span>
                <GridController
                  selection={gridSelection}
                  onSelectionChange={(sel) => setGridSelection(sel)}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <PhraseGrid
                  phrase={currentPhrase}
                  activeRowIndex={activePlayheadRow}
                  selectedRowIndex={gridSelection.rowIndex}
                  onSelectRow={(idx) => setGridSelection((prev) => ({ ...prev, rowIndex: idx }))}
                />
              </div>
            </div>

            {/* Right Half (50%): 4x4 Pads + M8 Tactile Punch-FX & Mute/Solo Strips */}
            <div className="w-1/2 flex flex-col bg-black/50 border border-emerald-500/20 rounded p-2 gap-2 overflow-hidden justify-between">
              <div className="flex justify-between items-center pb-1 border-b border-emerald-500/20">
                <span className="text-[11px] font-bold tracking-wider text-emerald-400">PERFORM & PUNCH PADS</span>
                {/* M8 Tactile Mute & Solo Punch Strips */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveMuteTrack(activeMuteTrack === null ? 0 : null)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                      activeMuteTrack !== null ? 'bg-red-600 text-white border-red-500 shadow-[0_0_6px_rgba(220,38,38,0.5)]' : 'bg-zinc-950 text-red-500/70 border-red-900/40'
                    }`}
                  >
                    {activeMuteTrack !== null ? 'MUTE [ACT]' : 'MUTE'}
                  </button>
                  <button
                    onClick={() => setActiveSoloTrack(activeSoloTrack === null ? 0 : null)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                      activeSoloTrack !== null ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]' : 'bg-zinc-950 text-amber-500/70 border-amber-900/40'
                    }`}
                  >
                    {activeSoloTrack !== null ? 'SOLO [ACT]' : 'SOLO'}
                  </button>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <PadMatrix
                  activeBankIndex={activeBankIndex}
                  isPerformanceMode={true}
                  onPadTrigger={handlePadTrigger}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SONG_MIXER' && (
          /* PAGE 2: SONG VIEW & MIXER DUAL-SCREEN SPLIT */
          <div className="flex-1 flex gap-2 overflow-hidden p-4">
            <div className="w-1/2 flex flex-col bg-black/50 border border-emerald-500/20 rounded p-3 items-center justify-center">
              <span className="text-xs font-bold text-emerald-400 mb-2">[ SONG ARRANGEMENT VIEW ]</span>
              <span className="text-[11px] text-emerald-600">Chain sequencing and timeline blocks.</span>
            </div>
            <div className="w-1/2 flex flex-col bg-black/50 border border-emerald-500/20 rounded p-3 items-center justify-center">
              <span className="text-xs font-bold text-emerald-400 mb-2">[ MODERATE HARDWARE MIXER ]</span>
              <span className="text-[11px] text-emerald-600">Track volumes, panning, and mute/solo strips.</span>
            </div>
          </div>
        )}

        {activeTab === 'CHAIN' && (
          /* PAGE 3: CHAIN VIEW */
          <div className="flex-1 flex flex-col bg-black/50 border border-emerald-500/20 rounded p-4 items-center justify-center">
            <span className="text-sm font-bold text-emerald-400 mb-2">[ CHAIN VIEW WORKSPACE ]</span>
            <span className="text-xs text-emerald-600">Micro-arrangement pattern linking matrix.</span>
          </div>
        )}

        {activeTab === 'CHOP' && (
          /* PAGE 4: SAMPLE CHOP & ASSIGN */
          <div className="flex-1 flex flex-col bg-black/50 border border-emerald-500/20 rounded p-4 items-center justify-center">
            <span className="text-sm font-bold text-emerald-400 mb-2">[ SAMPLE CHOP & ASSIGN WORKSPACE ]</span>
            <span className="text-xs text-emerald-600">Waveform transient slicing and pad mapping.</span>
          </div>
        )}
      </main>

      {/* 3. BOTTOM TRANSPORT FOOTER */}
      <TransportFooter
        activeBankIndex={activeBankIndex}
        setActiveBankIndex={setActiveBankIndex}
        isRecording={isRecording}
        setIsRecording={setIsRecording}
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        onStop={handleStop}
      />
    </div>
  );
};