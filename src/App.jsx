import React, { useState, useEffect } from 'react';
import { initialSessionState } from './stateSchema';
import { DAWEventBus } from './EventBus';

// Import our quarantined sandbox addons
import WaveformChopperAddon from './addons-and-alterations/WaveformChopperAddon';
import FilterRoutingAddon from './addons-and-alterations/FilterRoutingAddon';
import TouchTrackerAddon from './addons-and-alterations/TouchTrackerAddon';

export default function App() {
  const [session, setSession] = useState(initialSessionState);
  const [activeBank, setActiveBank] = useState('A');
  const [currentStep, setCurrentStep] = useState(0);

  // Pad trigger handler (Route A: Zero-latency audition, Route B: Sequencer staging)
  const handlePadTrigger = (padIndex) => {
    const padData = session.sampleBanks[activeBank][padIndex];
    
    // Dispatch to Internal Event Bus
    DAWEventBus.emit('PAD_TRIGGER', {
      bank: activeBank,
      padIndex,
      sample: padData,
      timestamp: performance.now()
    });
  };

  return (
    <div 
      className="min-h-screen bg-gray-950 text-gray-100 font-sans p-2 sm:p-4 select-none flex flex-col"
      style={{ touchAction: 'none' }} // Prevents mobile Chrome/Safari zooming and panning gestures
    >
      {/* Header Deck: Project Controls & BPM / Speed Metadata */}
      <header className="flex justify-between items-center bg-gray-900 border border-gray-800 rounded-lg p-3 mb-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-black tracking-widest text-amber-500 uppercase">BREDFORGE</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/40 font-mono">
            MOBILE HYBRID DAW
          </span>
        </div>

        <div className="flex items-center space-x-4 font-mono text-xs">
          <div className="flex items-center space-x-1 bg-gray-950 px-2.5 py-1 rounded border border-gray-800">
            <span className="text-gray-500">BPM</span>
            <span className="text-sky-400 font-bold">{session.bpm}</span>
          </div>
          <div className="flex items-center space-x-1 bg-gray-950 px-2.5 py-1 rounded border border-gray-800">
            <span className="text-gray-500">SPD</span>
            <span className="text-emerald-400 font-bold">{session.speed}</span>
          </div>
        </div>
      </header>

      {/* Main Bento Layout Grid (Left Stage: Sound Sculpting, Right Stage: Tracker Matrix) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-grow mb-3">
        {/* Left Bento Stage: Waveform Chopper & Filter Routing */}
        <section className="lg:col-span-6 flex flex-col space-y-3">
          <div className="bg-gray-900/90 border border-gray-800 rounded-lg p-3 shadow-md flex-grow">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-2 font-bold">
              Bento Deck 01 // Sample Chopper
            </span>
            <WaveformChopperAddon />
          </div>

          <div className="bg-gray-900/90 border border-gray-800 rounded-lg p-3 shadow-md flex-grow">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-2 font-bold">
              Bento Deck 02 // Filter Routing
            </span>
            <FilterRoutingAddon />
          </div>
        </section>

        {/* Right Stage: M8 Touch-Optimized Tracker Grid */}
        <section className="lg:col-span-6 bg-gray-900/90 border border-gray-800 rounded-lg p-3 shadow-md flex flex-col">
          <TouchTrackerAddon currentStep={currentStep} onStepSelect={setCurrentStep} />
        </section>
      </main>

      {/* Bottom Stage: 4x4 MPC-Style Performance Pad Drawer */}
      <footer className="bg-gray-900 border border-gray-800 rounded-lg p-3 shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono text-gray-400 font-bold uppercase">
            MPC Performance Pads // Bank {activeBank}
          </span>
          {/* Bank Selectors */}
          <div className="flex space-x-1 font-mono text-xs">
            {['A', 'B', 'C', 'D'].map(bank => (
              <button
                key={bank}
                onClick={() => setActiveBank(bank)}
                className={`px-3 py-1 rounded font-bold transition-colors ${
                  activeBank === bank
                    ? 'bg-amber-500 text-gray-950 shadow-md'
                    : 'bg-gray-950 text-gray-400 border border-gray-800 hover:text-gray-200'
                }`}
              >
                {bank}
              </button>
            ))}
          </div>
        </div>

        {/* 4x4 Pad Grid */}
        <div className="grid grid-cols-4 gap-2">
          {session.sampleBanks[activeBank].map((pad, idx) => (
            <button
              key={pad.id}
              onPointerDown={() => handlePadTrigger(idx)}
              className="h-14 bg-gray-950 border border-gray-800 active:bg-amber-500/30 active:border-amber-500 rounded-lg flex flex-col items-center justify-center font-mono text-xs text-gray-300 hover:border-gray-700 transition-all shadow-inner"
            >
              <span className="text-[10px] text-gray-500 font-bold">{pad.id}</span>
              <span className="text-[10px] text-sky-400 font-semibold truncate max-w-[80%]">{pad.name}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
