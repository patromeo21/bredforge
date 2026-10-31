import React, { useState, useEffect } from 'react';
import { initialSessionState } from './stateSchema';
import { DAWEventBus } from './EventBus';

// Import our quarantined sandbox addons (stepping up one level to root)
import WaveformChopperAddon from '../addons-and-alterations/WaveformChopperAddon';
import FilterRoutingAddon from '../addons-and-alterations/FilterRoutingAddon';
import TouchTrackerAddon from '../addons-and-alterations/TouchTrackerAddon';

export default function App() {
  const [session, setSession] = useState(initialSessionState);
  const [activeBank, setActiveBank] = useState('A');
  const [currentStep, setCurrentStep] = useState(0);

  // Wire up Route A: Zero-latency pad audio triggering & synthesis engine
  useEffect(() => {
    const handleBusTrigger = ({ bank, padIndex, sample }) => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        // Distinct frequency mapping per pad index for immediate acoustic feedback
        osc.frequency.setValueAtTime(120 + padIndex * 30, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
        
        console.log(`[BredForge Audio] Triggered Bank ${bank} Pad ${padIndex + 1}: ${sample?.name || 'Slot ' + (padIndex + 1)}`);
      } catch (err) {
        console.warn('Audio context awaiting user gesture interaction', err);
      }
    };

    DAWEventBus.on('PAD_TRIGGER', handleBusTrigger);
    return () => {
      DAWEventBus.off('PAD_TRIGGER', handleBusTrigger);
    };
  }, []);

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
    <div className="bredforge-app" style={{ background: '#0a0a0c', color: '#f0f0f5', minHeight: '100vh', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #222', paddingBottom: '0.75rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '0.05em' }}>BredForge <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '400' }}>Mobile DAW v0.9</span></h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['A', 'B', 'C', 'D'].map(bank => (
            <button
              key={bank}
              onClick={() => setActiveBank(bank)}
              style={{
                background: activeBank === bank ? '#3b82f6' : '#18181b',
                color: '#fff',
                border: '1px solid #333',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Bank {bank}
            </button>
          ))}
        </div>
      </header>

      {/* Main Bento Grid Layout */}
      <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        
        {/* MPC 4x4 Pad Performance Panel */}
        <section style={{ background: '#121216', border: '1px solid #26262b', borderRadius: '8px', padding: '1rem' }}>
          <h2 style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Performance Pads (Bank {activeBank})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {Array.from({ length: 16 }).map((_, i) => (
              <button
                key={i}
                onTouchStart={() => handlePadTrigger(i)}
                onMouseDown={() => handlePadTrigger(i)}
                style={{
                  aspectRatio: '1',
                  background: '#1e1e24',
                  border: '1px solid #33333d',
                  borderRadius: '6px',
                  color: '#e4e4e7',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation',
                  transition: 'background 0.1s'
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </section>

        {/* Sandbox Addons Integration */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#121216', border: '1px solid #26262b', borderRadius: '8px', padding: '1rem' }}>
            <WaveformChopperAddon />
          </div>
          <div style={{ background: '#121216', border: '1px solid #26262b', borderRadius: '8px', padding: '1rem' }}>
            <FilterRoutingAddon />
          </div>
        </section>

      </main>

      {/* Tracker & Touch Grid Footer */}
      <footer style={{ marginTop: '1rem', background: '#121216', border: '1px solid #26262b', borderRadius: '8px', padding: '1rem' }}>
        <TouchTrackerAddon currentStep={currentStep} />
      </footer>
    </div>
  );
}
