// ============================================================================
// BREDFORGE v1.0 — DUAL-SCREEN WORKSPACE & MIDI BRIDGE [REF: WORKSPACE-01]
// ============================================================================

import React, { useState, useEffect } from 'react';
import { midiService } from '../../services/MidiService';

interface DualScreenWorkspaceProps {
  projectName?: string;
  tempo?: number;
}

export function DualScreenWorkspace({
  projectName = 'BRED_PROJECT_01',
  tempo = 124.0,
}: DualScreenWorkspaceProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [midiConnected, setMidiConnected] = useState<boolean>(false);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Initialize Web MIDI and bind note triggers on mount
  useEffect(() => {
    let unsubscribeNoteOn: (() => void) | undefined;

    async function setupMidi() {
      const success = await midiService.initMidi();
      if (success) {
        setMidiConnected(true);
        setConnectedDevices(midiService.getConnectedDevices());

        // Listen for incoming MIDI Note On events
        unsubscribeNoteOn = midiService.onNoteOn((note, velocity) => {
          // Map standard MIDI notes (e.g. C1/36 to D#2/51) to pads 0-15
          const padIndex = (note - 36) % 16;
          if (padIndex >= 0 && padIndex < 16) {
            setActivePad(padIndex);
            console.log(`[Workspace] MIDI Trigger -> Pad ${padIndex + 1} (Note: ${note}, Vel: ${velocity})`);
            
            // Flash pad highlight for 120ms
            setTimeout(() => {
              setActivePad((curr) => (curr === padIndex ? null : curr));
            }, 120);
          }
        });
      }
    }

    setupMidi();

    return () => {
      if (unsubscribeNoteOn) unsubscribeNoteOn();
    };
  }, []);

  const pads = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    name: `PAD ${i < 9 ? '0' + (i + 1) : i + 1}`,
    sample: `SAMPLE_${i + 1}.wav`,
  }));

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-2 gap-2 select-none overflow-hidden border border-zinc-800 rounded-lg">
      
      {/* Workspace Header & MIDI Status Bar */}
      <div className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            WORKSPACE // DUAL-SCREEN M8 & MPC ENGINE
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            {tempo.toFixed(1)} BPM
          </span>
        </div>

        {/* MIDI Hardware Status Indicator */}
        <div className="flex items-center gap-2 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
          <span className={`w-2 h-2 rounded-full ${midiConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-500'}`} />
          <span className="text-[10px] text-zinc-300">
            {midiConnected && connectedDevices.length > 0 ? `MIDI: ${connectedDevices[0]}` : 'MIDI: LISTENING...'}
          </span>
        </div>
      </div>

      {/* Main Dual-Screen Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 min-h-0">
        
        {/* Left Screen: 16-Step Phrase Tracker Matrix */}
        <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-zinc-800 text-[10px] font-bold text-zinc-400">
            <span>STEP TRACKER (PHRASE 00)</span>
            <span className="text-amber-400">NOTE // INST // VOL // FX</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {Array.from({ length: 16 }).map((_, stepIdx) => (
              <div
                key={stepIdx}
                onClick={() => setActiveStep(stepIdx)}
                className={`flex justify-between items-center px-3 py-1.5 rounded text-xs border cursor-pointer transition-all ${
                  activeStep === stepIdx
                    ? 'bg-amber-500/10 border-amber-500/80 text-amber-300 font-bold shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="w-8 text-zinc-600 font-bold">
                  {stepIdx < 10 ? `0${stepIdx}` : stepIdx}
                </span>
                <span className="font-mono text-amber-400">C#4</span>
                <span className="font-mono text-sky-400">01</span>
                <span className="font-mono text-emerald-400">64</span>
                <span className="font-mono text-purple-400">V03</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Screen: 4x4 Pad Bank Manager (SP-404 / MPC Mode) */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 flex flex-col min-h-0 justify-between">
          <div className="flex justify-between items-center pb-1.5 border-b border-zinc-800">
            <span className="text-[10px] font-bold text-amber-400">4x4 PAD MATRIX (BANK {activeBank})</span>
            <div className="flex gap-1">
              {(['A', 'B', 'C', 'D'] as const).map((bank) => (
                <button
                  key={bank}
                  onClick={() => setActiveBank(bank)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                    activeBank === bank
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.3)]'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {bank}
                </button>
              ))}
            </div>
          </div>

          {/* 4x4 Grid */}
          <div className="grid grid-cols-4 gap-2 my-auto py-2">
            {pads.map((pad, idx) => (
              <button
                key={pad.id}
                onClick={() => setActivePad(idx)}
                className={`flex flex-col justify-between p-2.5 h-20 rounded-lg border cursor-pointer transition-all ${
                  activePad === idx
                    ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-95 font-bold'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-amber-400'
                }`}
              >
                <div className="flex justify-between w-full text-[9px]">
                  <span className={activePad === idx ? 'text-zinc-950 font-bold' : 'text-zinc-500'}>
                    {pad.name}
                  </span>
                  <span className={activePad === idx ? 'text-zinc-950 font-bold' : 'text-emerald-400'}>
                    ●
                  </span>
                </div>
                <span className="text-[10px] truncate w-full text-left">
                  {pad.sample}
                </span>
              </button>
            ))}
          </div>

          <div className="text-[9px] text-zinc-500 text-center pt-1 border-t border-zinc-800">
            External MIDI Controller Notes 36–51 trigger Pads 1–16 instantly.
          </div>
        </div>

      </div>

    </div>
  );
}

export default DualScreenWorkspace;
