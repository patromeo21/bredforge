// ============================================================================
// BREDFORGE v1.0 — DUAL-SCREEN WORKSPACE (TRACKER + WORKBENCH + PADS) [REF: DUAL-01]
// ============================================================================

import React, { useState } from 'react';
import { PadMatrix } from './PadMatrix';
import { SampleWorkbench, SliceMarker } from './SampleWorkbench';

interface DualScreenWorkspaceProps {
  projectName?: string;
  tempo?: number;
}

export function DualScreenWorkspace({
  projectName = 'BRED_PROJECT_01',
  tempo = 124.0,
}: DualScreenWorkspaceProps) {
  // --------------------------------------------------------------------------
  // WORKSPACE STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [showWorkbench, setShowWorkbench] = useState<boolean>(true);
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Sample Workbench State
  const [currentAudioBuffer, setCurrentAudioBuffer] = useState<AudioBuffer | null>(null);
  const [sampleName, setSampleName] = useState<string>('kick_808_raw.wav');
  const [trimStart, setTrimStart] = useState<number>(0.0);
  const [trimEnd, setTrimEnd] = useState<number>(1.0);
  const [slices, setSlices] = useState<SliceMarker[]>([]);

  // 4x4 Pad Matrix State (64 pads across Banks A-D)
  const [pads, setPads] = useState(
    Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      name: `Pad ${i + 1}`,
      note: `C-${Math.floor(i / 4) + 1}`,
      sampleName: i === 0 ? 'kick_808_raw.wav' : i === 1 ? 'snare_clap.wav' : undefined,
      audioBuffer: i < 2 ? ({} as AudioBuffer) : null, // Mock initial state
    }))
  );

  // --------------------------------------------------------------------------
  // EVENT HANDLERS
  // --------------------------------------------------------------------------
  const handleTriggerPad = (pad: typeof pads[0]) => {
    console.log(`[Pad Trigger] Bank ${activeBank} Pad ${pad.id} (${pad.note}) triggered.`);
    // Audio engine playback trigger logic goes here
  };

  const handleM8Action = (command: string) => {
    console.log(`[M8 Hardware Action] Executed command: ${command}`);
    // M8 navigation or Punch-In FX trigger goes here
  };

  const handleTrimChange = (start: number, end: number) => {
    setTrimStart(start);
    setTrimEnd(end);
  };

  const handleSlicesChange = (newSlices: SliceMarker[]) => {
    setSlices(newSlices);
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-2 gap-2 select-none overflow-hidden">
      
      {/* Top System Bar: Project Status & Workbench Toggle */}
      <div className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            {projectName}
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            {tempo.toFixed(1)} BPM
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWorkbench(!showWorkbench)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
              showWorkbench
                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {showWorkbench ? 'HIDE WORKBENCH' : 'SHOW WORKBENCH'}
          </button>
        </div>
      </div>

      {/* Main Dual-Screen Viewport */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-0">
        
        {/* LEFT PANEL: M8 Tracker 16-Step Phrase Grid */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 flex flex-col min-h-0 overflow-hidden">
          <div className="flex justify-between items-center mb-2 shrink-0 border-b border-zinc-800 pb-2">
            <span className="text-[11px] font-bold text-emerald-400 tracking-wider">
              M8 TRACKER // PHRASE GRID (TRACK 1)
            </span>
            <span className="text-[9px] text-zinc-500">STEP: 00 / 64</span>
          </div>

          {/* Tracker Step Rows */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex justify-between items-center px-3 py-1.5 rounded text-xs border ${
                  idx === 0
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="w-8 text-zinc-600 font-bold">
                  {idx < 10 ? `0${idx}` : idx}
                </span>
                <span className="w-12 text-amber-400">C-3</span>
                <span className="w-10 text-sky-400">01</span>
                <span className="w-16 text-zinc-300">{idx === 0 ? 'S01' : '---'}</span>
                <span className="text-[9px] text-zinc-500 uppercase">
                  {idx === 0 ? 'Kick (Slice 1)' : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Dynamic Stack (Non-Disruptive Workbench + Pad Matrix / M8 Buttons) */}
        <div className="flex flex-col h-full gap-2 min-h-0">
          
          {/* Non-Disruptive Sample Workbench (Collapsible Top Section) */}
          {showWorkbench && (
            <div className="h-44 shrink-0 transition-all duration-200 animate-fadeIn">
              <SampleWorkbench
                audioBuffer={currentAudioBuffer}
                sampleName={sampleName}
                trimStart={trimStart}
                trimEnd={trimEnd}
                slices={slices}
                onUpdateTrim={handleTrimChange}
                onUpdateSlices={handleSlicesChange}
                onClose={() => setShowWorkbench(false)}
              />
            </div>
          )}

          {/* 4x4 Pad Matrix & M8 Hardware Flip Grid (Dynamically Scaled) */}
          <div className="flex-1 min-h-0 flex flex-col">
            <PadMatrix
              activeBank={activeBank}
              onSelectBank={setActiveBank}
              pads={pads}
              onTriggerPad={handleTriggerPad}
              onM8Action={handleM8Action}
            />
          </div>

        </div>

      </div>

    </div>
  );
}

export default DualScreenWorkspace;
