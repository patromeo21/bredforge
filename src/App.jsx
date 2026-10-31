import React, { useState, useEffect } from 'react';
import { initialSessionState } from './stateSchema';
import { DAWEventBus } from './EventBus';

import WaveformChopperAddon from '../addons-and-alterations/WaveformChopperAddon';
import FilterRoutingAddon from '../addons-and-alterations/FilterRoutingAddon';
import TouchTrackerAddon from '../addons-and-alterations/TouchTrackerAddon';

// In-memory audio buffer cache for zero-latency sample playback
const sampleBufferCache = {};

export default function App() {
  const [session, setSession] = useState(initialSessionState);
  const [activeBank, setActiveBank] = useState('A');
  const [currentStep, setCurrentStep] = useState(0);
  const [activeVoices, setActiveVoices] = useState(new Set());
  const [audioCtx, setAudioCtx] = useState(null);

  // Initialize unified AudioContext on first user interaction
  const getAudioContext = () => {
    if (!audioCtx) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioCtx(ctx);
      return ctx;
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  };

  // Unified Audio & Sequencer Engine (Sample Buffers + Fallback Synthesis)
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
        const ctx = getAudioContext();
        if (!ctx) return;

        const padKey = `${bank}_${padIndex}`;
        const cachedBuffer = sampleBufferCache[padKey];

        if (cachedBuffer) {
          // Path 1: Play decoded AudioBuffer (Real Sample Playback)
          const bufferSource = ctx.createBufferSource();
          const gainNode = ctx.createGain();
          bufferSource.buffer = cachedBuffer;
          gainNode.gain.setValueAtTime(0.8, ctx.currentTime);

          bufferSource.connect(gainNode);
          gainNode.connect(ctx.destination);
          bufferSource.start(0);
          console.log(`[BredForge Engine] Playing Sample Buffer for Bank ${bank} Pad ${padIndex + 1}`);
        } else {
          // Path 2: Hardware-emulated transient fallback synthesis
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(110 + padIndex * 28, ctx.currentTime);
          
          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.15);
          console.log(`[BredForge Engine] Transient Synth Fallback for Bank ${bank} Pad ${padIndex + 1}`);
        }

        // Sequencer Route B logging
        console.log(`[BredForge Tracker Staging] Step recorded | Bank: ${bank} | Pad: ${padIndex + 1} | Time: ${timestamp.toFixed(2)}ms`);
      } catch (err) {
        console.warn('AudioContext playback error:', err);
      }
    };

    DAWEventBus.on('PAD_TRIGGER', handleBusTrigger);
    return () => {
      DAWEventBus.off('PAD_TRIGGER', handleBusTrigger);
    };
  }, [audioCtx]);

  const handlePadTrigger = (padIndex) => {
    const padData = session.sampleBanks[activeBank][padIndex];
    
    DAWEventBus.emit('PAD_TRIGGER', {
      bank: activeBank,
      padIndex,
      sample: padData,
      timestamp: performance.now()
    });
  };

  // Sample file import handler for populating pad audio buffers
  const handleFileUpload = async (padIndex, file) => {
    if (!file) return;
    try {
      const ctx = getAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      const padKey = `${activeBank}_${padIndex}`;
      sampleBufferCache[padKey] = decodedBuffer;
      console.log(`[SampleManager] Loaded custom sample into Bank ${activeBank} Pad ${padIndex + 1}`);
    } catch (err) {
      console.error('Failed to decode audio file:', err);
    }
  };

  return (
    <div className="bredforge-app" style={{ background: '#0a0a0c', color: '#f0f0f5', minHeight: '100vh', padding: '1rem', fontFamily: 'system-ui, sans-serif', touchAction: 'manipulation' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #222', paddingBottom: '0.75rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '0.05em' }}>BredForge <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '400' }}>Mobile DAW v1.0</span></h1>
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
