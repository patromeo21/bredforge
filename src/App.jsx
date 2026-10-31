import React, { useState, useEffect } from 'react';
import { initialSessionState } from './stateSchema';
import { DAWEventBus } from './EventBus';

import WaveformChopperAddon from '../addons-and-alterations/WaveformChopperAddon';
import FilterRoutingAddon from '../addons-and-alterations/FilterRoutingAddon';
import TouchTrackerAddon from '../addons-and-alterations/TouchTrackerAddon';

export default function App() {
  const [session, setSession] = useState(initialSessionState);
  const [activeBank, setActiveBank] = useState('A');
  const [currentStep, setCurrentStep] = useState(0);
  const [activeVoices, setActiveVoices] = useState(new Set());

  // Unified Audio & Sequencer Engine (Route A + Route B + Touch Optimization)
  useEffect(() => {
    const handleBusTrigger = ({ bank, padIndex, sample, timestamp }) => {
      // Visual feedback state tracking
      setActiveVoices(prev => new Set(prev).add(padIndex));
      setTimeout(() => {
        setActiveVoices(prev => {
          const next = new Set(prev);
          next.delete(padIndex);
          return next;
        });
      }, 120);

      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        // Hardware-emulated transient synthesis for zero-latency preview
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110 + padIndex * 28, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);

        // Route B: Staging event to tracker timeline history log
        console.log(`[BredForge Tracker Staging] Step recorded | Bank: ${bank} | Pad: ${padIndex + 1} | Time: ${timestamp.toFixed(2)}ms`);
      } catch (err) {
        console.warn('Audio context restriction or gesture lock:', err);
      }
    };

    DAWEventBus.on('PAD_TRIGGER', handleBusTrigger);
    return () => {
      DAWEventBus.off('PAD_TRIGGER', handleBusTrigger);
    };
  }, []);

  const handlePadTrigger = (padIndex) => {
    const padData = session.sampleBanks[activeBank][padIndex];
    
    DAWEventBus.emit('PAD_TRIGGER', {
      bank: activeBank,
      padIndex,
      sample: padData,
      timestamp: performance.now()
    });
  };

  return (
    <div className="bredforge-app" style={{ background: '#0a0a0c', color: '#f0f0f5', minHeight: '100vh', padding: '1rem', fontFamily: 'system-ui, sans-serif', touchAction: 'manipulation' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #222', paddingBottom: '0.75rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '0.05em' }}>BredForge <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '400' }}>Mobile DAW v0.95</span></h1>
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

      <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <section style={{ background: '#121216', border: '1px solid #26262b', borderRadius: '8px', padding: '1rem' }}>
          <h2 style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Performance Pads (Bank {activeBank})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {Array.from({ length: 16 }).map((_, i) => {
              const isActive = activeVoices.has(i);
              return (
                <button
                  key={i}
                  onTouchStart={(e) => { e.preventDefault(); handlePadTrigger(i); }}
                  onMouseDown={() => handlePadTrigger(i)}
                  style={{
                    aspectRatio: '1',
                    background: isActive ? '#3b82f6' : '#1e1e24',
                    border: `1px solid ${isActive ? '#60a5fa' : '#33333d'}`,
                    borderRadius: '6px',
                    color: '#e4e4e7',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    transform: isActive ? 'scale(0.96)' : 'scale(1)',
                    transition: 'background 0.05s, transform 0.05s, border-color 0.05s'
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#121216', border: '1px solid #26262b', borderRadius: '8px', padding: '1rem' }}>
            <WaveformChopperAddon />
          </div>
          <div style={{ background: '#121216', border: '1px solid #26262b', borderRadius: '8px', padding: '1rem' }}>
            <FilterRoutingAddon />
          </div>
        </section>
      </main>

      <footer style={{ marginTop: '1rem', background: '#121216', border: '1px solid #26262b', borderRadius: '8px', padding: '1rem' }}>
        <TouchTrackerAddon currentStep={currentStep} />
      </footer>
    </div>
  );
}
