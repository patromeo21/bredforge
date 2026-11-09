// ============================================================================
// BREDFORGE v1.0 — DUAL-SCREEN WORKSPACE WITH AUDIO ENGINE BRIDGE [REF: DUAL-04]
// ============================================================================

import React, { useState } from 'react';
import { PadMatrix, PadData } from './PadMatrix';
import { SampleWorkbench, SliceMarker } from './SampleWorkbench';
import { useLiveStepRecord, PhraseStep } from '../../hooks/useLiveStepRecord';
import { audioEngine } from '../../services/AudioEngine';

interface DualScreenWorkspaceProps {
  projectName?: string;
  tempo?: number;
}

export function DualScreenWorkspace({
  projectName = 'BRED_PROJECT_01',
  tempo = 124.0,
}: DualScreenWorkspaceProps) {
  const [showWorkbench, setShowWorkbench] = useState<boolean>(true);
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLiveRecArmed, setIsLiveRecArmed] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [activePunchInFx, setActivePunchInFx] = useState<string | null>(null);

  const [phraseSteps, setPhraseSteps] = useState<PhraseStep[]>(
    Array.from({ length: 16 }, (_, idx) => ({
      stepIndex: idx,
      note: idx === 0 ? 'C-3' : '---',
      instrument: idx === 0 ? '01' : '--',
      command: idx === 0 ? 'S01' : '---',
      description: idx === 0 ? 'Kick (Slice 1)' : '—',
    }))
  );

  // Shared Audio Buffer & Sample State
  const [currentAudioBuffer, setCurrentAudioBuffer] = useState<AudioBuffer | null>(null);
  const [sampleName] = useState<string>('kick_808_raw.wav');
  const [trimStart, setTrimStart] = useState<number>(0.0);
  const [trimEnd, setTrimEnd] = useState<number>(1.0);
  const [slices, setSlices] = useState<SliceMarker[]>([]);

  const [pads] = useState<PadData[]>(
    Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      name: `Pad ${i + 1}`,
      note: `C-${Math.floor(i / 4) + 1}`,
      sampleName: i === 0 ? 'kick_808_raw.wav' : i === 1 ? 'snare_clap.wav' : undefined,
      audioBuffer: currentAudioBuffer,
    }))
  );

  const { recordPadHit } = useLiveStepRecord({
    isArmed: isLiveRecArmed,
    isPlaying,
    currentStep,
    onUpdateStep: (stepIdx, updatedData) => {
      setPhraseSteps((prev) => {
        const next = [...prev];
        next[stepIdx] = updatedData;
        return next;
      });
    },
  });

  // Trigger Pad with Real Web Audio Playback
  const handleTriggerPad = async (pad: PadData) => {
    console.log(`[Pad Trigger] Bank ${activeBank} Pad ${pad.id} (${pad.note}) triggered.`);
    
    if (pad.audioBuffer) {
      const startFrame = Math.floor(trimStart * pad.audioBuffer.length);
      const endFrame = Math.floor(trimEnd * pad.audioBuffer.length);
      await audioEngine.playSlice(pad.audioBuffer, startFrame, endFrame, 0);
    }

    recordPadHit(pad.id, activeBank);
  };

  const handleM8Action = (command: string) => {
    console.log(`[M8 Hardware Action] Executed: ${command}`);
    if (command === 'SEQ_PLAY') {
      setIsPlaying((prev) => !prev);
    } else if (command === 'EDIT_VAL') {
      triggerPunchInEffect('TAPE STOP / BRAKE [EDIT]');
    } else if (command === 'OPT_MENU') {
      triggerPunchInEffect('BITCRUSH / LO-FI [OPTION]');
    } else if (command === 'MOD_SHIFT') {
      triggerPunchInEffect('GATER / STUTTER [SHIFT]');
    } else {
      triggerPunchInEffect(`FILTER SWEEP (${command.replace('NAV_', '')})`);
    }
  };

  const triggerPunchInEffect = (effectName: string) => {
    setActivePunchInFx(effectName);
    setTimeout(() => {
      setActivePunchInFx((current) => (current === effectName ? null : current));
    }, 600);
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-2 gap-2 select-none overflow-hidden">
      
      <div className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            {projectName}
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            {tempo.toFixed(1)} BPM
          </span>

          {activePunchInFx && (
            <span className="text-[10px] font-bold text-amber-950 bg-amber-400 px-2 py-0.5 rounded animate-pulse shadow-[0_0_10px_#f59e0b]">
              ⚡ FX ACTIVE: {activePunchInFx}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLiveRecArmed(!isLiveRecArmed)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
              isLiveRecArmed
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {isLiveRecArmed ? '● LIVE REC ARMED' : '○ ARM LIVE REC'}
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
              isPlaying
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {isPlaying ? '■ PAUSE' : '▶ PLAY'}
          </button>

          <button
            onClick={() => setShowWorkbench(!showWorkbench)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
              showWorkbench
                ? 'bg-amber-500 text-zinc-950 border-amber-400'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {showWorkbench ? 'HIDE WORKBENCH' : 'SHOW WORKBENCH'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-0">
        
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 flex flex-col min-h-0 overflow-hidden">
          <div className="flex justify-between items-center mb-2 shrink-0 border-b border-zinc-800 pb-2">
            <span className="text-[11px] font-bold text-emerald-400 tracking-wider">
              M8 TRACKER // PHRASE GRID (TRACK 1)
            </span>
            <span className="text-[9px] text-zinc-500">
              STEP: {currentStep < 10 ? `0${currentStep}` : currentStep} / 64 {isLiveRecArmed && isPlaying ? '(RECORDING)' : ''}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {phraseSteps.map((step, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`flex justify-between items-center px-3 py-1.5 rounded text-xs border cursor-pointer transition-all ${
                  currentStep === idx
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-bold shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="w-8 text-zinc-600 font-bold">
                  {idx < 10 ? `0${idx}` : idx}
                </span>
                <span className="w-12 text-amber-400">{step.note}</span>
                <span className="w-10 text-sky-400">{step.instrument}</span>
                <span className="w-16 text-zinc-300">{step.command}</span>
                <span className="text-[9px] text-zinc-500 uppercase truncate">
                  {step.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col h-full gap-2 min-h-0">
          
          {showWorkbench && (
            <div className="h-44 shrink-0 transition-all duration-200 animate-fadeIn">
              <SampleWorkbench
                audioBuffer={currentAudioBuffer}
                sampleName={sampleName}
                trimStart={trimStart}
                trimEnd={trimEnd}
                slices={slices}
                onUpdateTrim={(start, end) => {
                  setTrimStart(start);
                  setTrimEnd(end);
                }}
                onUpdateSlices={(newSlices) => setSlices(newSlices)}
                onClose={() => setShowWorkbench(false)}
              />
            </div>
          )}

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
