import React, { useRef, useState } from 'react';
import { AudioEngine } from './services/AudioEngine';

export default function App() {
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [activePad, setActivePad] = useState<number | null>(null);

  // Guard to filter micro-second duplicate triggers on touch devices
  const lastTriggerRef = useRef<number>(0);

  const handlePadDown = (padIndex: number, e: React.PointerEvent) => {
    // Prevent synthetic mouse clicks and default page scrolling/zooming
    e.preventDefault();

    const now = performance.now();
    if (now - lastTriggerRef.current < 30) return; // 30ms debounce guard
    lastTriggerRef.current = now;

    // Unlock and trigger audio engine buffer or synth voice
    AudioEngine.unlock();
    AudioEngine.triggerPad(padIndex);

    setActivePad(padIndex);
  };

  const handlePadUp = (padIndex: number) => {
    if (activePad === padIndex) {
      setActivePad(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100dvh',
      backgroundColor: '#0a0b0e',
      color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      touchAction: 'none'
    }}>
      {/* Header Bar */}
      <header style={{
        height: '52px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        backgroundColor: '#0f172a',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '15px', fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>
            BredForge Mobile DAW
          </h1>
          <span style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>
            Panoramic Workstation v1.1
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 500 }}>
          Audio Engine: Active
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '12px',
        padding: '12px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Left Section: Performance Pads */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '8px',
          padding: '12px',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.5px' }}>
              PERFORMANCE PADS (BANK {activeBank})
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['A', 'B', 'C', 'D'] as const).map(bank => (
                <button
                  key={bank}
                  onClick={() => setActiveBank(bank)}
                  style={{
                    backgroundColor: activeBank === bank ? '#3b82f6' : '#1f2937',
                    color: activeBank === bank ? '#ffffff' : '#9ca3af',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {bank}
                </button>
              ))}
            </div>
          </div>

          {/* 16 Pad Matrix */}
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: '8px',
            minHeight: 0
          }}>
            {Array.from({ length: 16 }).map((_, index) => {
              const isActive = activePad === index;
              return (
                <div
                  key={index}
                  onPointerDown={(e) => handlePadDown(index, e)}
                  onPointerUp={() => handlePadUp(index)}
                  onPointerLeave={() => handlePadUp(index)}
                  onPointerCancel={() => handlePadUp(index)}
                  style={{
                    backgroundColor: isActive ? '#3b82f6' : '#1f2937',
                    border: `1px solid ${isActive ? '#60a5fa' : '#374151'}`,
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '10px',
                    cursor: 'pointer',
                    transition: 'background-color 0.05s ease, border-color 0.05s ease',
                    boxShadow: isActive ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: isActive ? '#e0f2fe' : '#6b7280' }}>
                    <span>{index + 1}</span>
                    <span>WAV</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#ffffff' : '#d1d5db' }}>
                    SMP {index + 1}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10px', color: '#4b5563' }}>
                    VOL
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: Sample Chopper / Filter Deck */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'hidden'
        }}>
          {/* Sample Editor Module */}
          <div style={{
            flex: 1,
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '8px' }}>
              SAMPLE CHOPPER
            </span>
            <div style={{
              flex: 1,
              backgroundColor: '#030712',
              border: '1px dashed #374151',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4b5563',
              fontSize: '12px',
              textAlign: 'center',
              padding: '12px'
            }}>
              Waveform Display Area<br/>(Load Audio File)
            </div>
          </div>

          {/* Filter / FX Deck */}
          <div style={{
            height: '140px',
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>
              FILTER / FX RACK
            </span>
            <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#9ca3af' }}>
              <div style={{ backgroundColor: '#1f2937', padding: '6px 10px', borderRadius: '4px' }}>LPF</div>
              <div style={{ backgroundColor: '#1f2937', padding: '6px 10px', borderRadius: '4px' }}>HPF</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}