import React, { useRef, useState } from 'react';

export default function App() {
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [activePad, setActivePad] = useState<number | null>(null);

  // Guard to filter micro-second duplicate triggers on Chrome on iPadOS
  const lastTriggerRef = useRef<number>(0);

  const handlePadDown = (padIndex: number, e: React.PointerEvent) => {
    e.preventDefault();
    const now = performance.now();
    if (now - lastTriggerRef.current < 30) return;
    lastTriggerRef.current = now;

    setActivePad(padIndex);

    // Architectural gating: Bank D routes to Synth Engine, A-C route to Sample Buffers
    if (activeBank === 'D') {
      console.log(`[SYNTH ENGINE - Bank D] Voice ${padIndex + 1} Triggered (Attack)`);
    } else {
      console.log(`[SAMPLE BANK ${activeBank}] Pad ${padIndex + 1} Triggered (Play)`);
    }
  };

  const handlePadUp = (padIndex: number, e: React.PointerEvent) => {
    e.preventDefault();
    setActivePad(null);

    if (activeBank === 'D') {
      console.log(`[SYNTH ENGINE - Bank D] Voice ${padIndex + 1} Released (Release)`);
    } else {
      console.log(`[SAMPLE BANK ${activeBank}] Pad ${padIndex + 1} Released`);
    }
  };

  return (
    <div
      className="daw-container"
      style={{
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0d0f12',
        color: '#fff',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* Fixed Control Header */}
      <header
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #222',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#12141c',
          flexShrink: 0
        }}
      >
        <h1 style={{ margin: 0, fontSize: '18px', letterSpacing: '0.5px' }}>
          BredForge Mobile DAW{' '}
          <span style={{ fontSize: '11px', color: '#3b82f6', background: '#1e3a8a33', padding: '3px 6px', borderRadius: '4px', marginLeft: '8px' }}>
            Panoramic Workstation v1.2
          </span>
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['A', 'B', 'C', 'D'] as const).map((bank) => (
            <button
              key={bank}
              onClick={() => setActiveBank(bank)}
              style={{
                padding: '6px 14px',
                background: activeBank === bank ? (bank === 'D' ? '#7c3aed' : '#2563eb') : '#1f2937',
                color: activeBank === bank ? '#fff' : '#9ca3af',
                border: 'none',
                borderRadius: '6px',
                fontWeight: activeBank === bank ? 'bold' : 'normal',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              Bank {bank} {bank === 'D' ? '⚡' : ''}
            </button>
          ))}
        </div>
      </header>

      {/* Primary Studio Canvas (Responsive Bento Grid) */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: '62% 38%',
          gap: '16px',
          flex: 1,
          padding: '16px',
          boxSizing: 'border-box',
          minHeight: 0
        }}
      >
        {/* Left Deck: 4x4 Performance Pad Matrix */}
        <section style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <div
            style={{
              background: '#161922',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #2a2e3d',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '13px', color: '#9ca3af', letterSpacing: '0.5px' }}>
                PERFORMANCE PADS (BANK {activeBank})
              </h2>
              <span style={{ fontSize: '11px', color: activeBank === 'D' ? '#c084fc' : '#60a5fa', background: activeBank === 'D' ? '#581c8733' : '#1e3a8a33', padding: '2px 8px', borderRadius: '4px' }}>
                {activeBank === 'D' ? 'Synth Oscillators' : 'Sample Triggers'}
              </span>
            </div>
            
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridTemplateRows: 'repeat(4, 1fr)',
                gap: '8px',
                flex: 1,
                minHeight: 0
              }}
            >
              {[...Array(16)].map((_, i) => {
                const isPressed = activePad === i;
                const isSynthBank = activeBank === 'D';
                return (
                  <div
                    key={i}
                    onPointerDown={(e) => handlePadDown(i, e)}
                    onPointerUp={(e) => handlePadUp(i, e)}
                    onPointerLeave={(e) => handlePadUp(i, e)}
                    onPointerCancel={(e) => handlePadUp(i, e)}
                    style={{
                      background: isPressed ? (isSynthBank ? '#581c87' : '#1e3a8a') : '#1f2430',
                      borderRadius: '8px',
                      border: isPressed ? (isSynthBank ? '1px solid #c084fc' : '1px solid #3b82f6') : '1px solid #333a4d',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '10px',
                      userSelect: 'none',
                      touchAction: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.05s ease, border-color 0.05s ease'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: isPressed ? '#fff' : (isSynthBank ? '#c084fc' : '#60a5fa') }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '11px', color: isPressed ? '#e2e8f0' : '#9ca3af', textAlign: 'center' }}>
                      {isSynthBank ? `OSC ${i + 1}` : `SMP ${i + 1}`}
                    </span>
                    <span style={{ fontSize: '10px', color: '#4b5563', textAlign: 'right' }}>
                      {isSynthBank ? 'Hz' : 'WAV'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Deck: Sample Chopper & Filter Controls */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: 0 }}>
          <div style={{ background: '#161922', padding: '16px', borderRadius: '12px', border: '1px solid #2a2e3d' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#9ca3af' }}>Sample Chopper & Trimmer</h3>
            <div style={{ height: '70px', background: '#0f1117', borderRadius: '6px', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: '12px' }}>
              Waveform Display Area (Active Bank: {activeBank})
            </div>
          </div>

          <div style={{ background: '#161922', padding: '16px', borderRadius: '12px', border: '1px solid #2a2e3d', flex: 1 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#9ca3af' }}>Filter Routing Deck</h3>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <span style={{ padding: '4px 10px', background: activeBank === 'D' ? '#7c3aed' : '#2563eb', borderRadius: '4px', fontSize: '11px' }}>LPF</span>
              <span style={{ padding: '4px 10px', background: '#1f2937', borderRadius: '4px', fontSize: '11px', color: '#9ca3af' }}>HPF</span>
              <span style={{ padding: '4px 10px', background: '#1f2937', borderRadius: '4px', fontSize: '11px', color: '#9ca3af' }}>BPF</span>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>Cutoff Freq: 16.3 kHz</div>
            <div style={{ color: '#4b5563', fontSize: '11px', marginTop: '8px' }}>Routing Mode: {activeBank === 'D' ? 'Internal Synth Engine' : 'Sample Buffer Deck'}</div>
          </div>
        </section>
      </main>

      {/* Locked Dock Footer */}
      <footer
        style={{
          background: '#11131a',
          padding: '10px 20px',
          borderTop: '1px solid #222',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#60a5fa',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>M8 Tracker Grid (Docked Footer)</span>
        <span style={{ color: activeBank === 'D' ? '#c084fc' : '#3b82f6' }}>Mode: Bank {activeBank} Active</span>
      </footer>
    </div>
  );
}