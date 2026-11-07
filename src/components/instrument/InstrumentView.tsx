// ============================================================================
// BREDFORGE v1.0 — INSTRUMENT / SAMPLER VIEW (InstrumentView.tsx)
// ============================================================================

import React, { useState } from 'react';

interface InstrumentParams {
  name: string;
  samplePath: string;
  startOffset: number; // Hex or sample frame
  loopMode: 'OFF' | 'FWD' | 'PINGPONG';
  pitch: number;       // Semitones (-24 to +24)
  fineTune: number;    // Cents (-50 to +50)
  cutoff: number;      // Hz (20 - 20000)
  resonance: number;   // Q factor
  attack: number;      // ms
  release: number;     // ms
}

export const InstrumentView: React.FC = () => {
  const [instrument, setInstrument] = useState<InstrumentParams>({
    name: '00: 808 SUB BASS',
    samplePath: 'SUB_01.WAV',
    startOffset: 0,
    loopMode: 'OFF',
    pitch: 0,
    fineTune: 0,
    cutoff: 12500,
    resonance: 2.5,
    attack: 5,
    release: 250,
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl select-none font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-slate-100 text-sm tracking-wider">
            INSTRUMENT VIEW // {instrument.name}
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            Sample Waveform, ADSR Envelope & Resampling Pitch Parameters
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold">
          INST (4,1)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Left Column: 1-Bit Monochrome Waveform Canvas */}
        <div className="flex flex-col gap-2 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>SAMPLE: {instrument.samplePath}</span>
            <span>LOOP: {instrument.loopMode}</span>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center relative min-h-[180px] overflow-hidden">
            {/* Simulated 1-bit waveform display */}
            <div className="absolute inset-0 flex items-center justify-center opacity-80">
              <svg className="w-full h-full text-emerald-400" viewBox="0 0 300 100" preserveAspectRatio="none">
                <path
                  d="M0,50 Q25,10 50,50 T100,50 T150,20 T200,80 T250,50 T300,50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <span className="relative z-10 text-[10px] bg-slate-900/80 px-2 py-1 rounded border border-slate-700 text-emerald-300">
              START: 0000 // END: 7FFF
            </span>
          </div>
        </div>

        {/* Right Column: Hex Parameter Matrix */}
        <div className="flex flex-col gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1">
              PARAMETER MATRIX
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between bg-slate-950 px-3 py-2 rounded border border-slate-800">
                <span className="text-slate-400">PITCH:</span>
                <span className="text-emerald-400 font-bold">{instrument.pitch >= 0 ? `+${instrument.pitch}` : instrument.pitch} ST</span>
              </div>
              <div className="flex justify-between bg-slate-950 px-3 py-2 rounded border border-slate-800">
                <span className="text-slate-400">FINE:</span>
                <span className="text-cyan-400 font-bold">{instrument.fineTune} c</span>
              </div>
              <div className="flex justify-between bg-slate-950 px-3 py-2 rounded border border-slate-800">
                <span className="text-slate-400">CUTOFF:</span>
                <span className="text-amber-400 font-bold">{instrument.cutoff} Hz</span>
              </div>
              <div className="flex justify-between bg-slate-950 px-3 py-2 rounded border border-slate-800">
                <span className="text-slate-400">RESONANCE:</span>
                <span className="text-amber-400 font-bold">{instrument.resonance} Q</span>
              </div>
              <div className="flex justify-between bg-slate-950 px-3 py-2 rounded border border-slate-800">
                <span className="text-slate-400">ATTACK:</span>
                <span className="text-purple-400 font-bold">{instrument.attack} ms</span>
              </div>
              <div className="flex justify-between bg-slate-950 px-3 py-2 rounded border border-slate-800">
                <span className="text-slate-400">RELEASE:</span>
                <span className="text-purple-400 font-bold">{instrument.release} ms</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-800">
            Use [EDIT + ARROWS] to adjust parameter values in hex increments.
          </div>
        </div>
      </div>
    </div>
  );
};