import React from 'react';

export default function App() {
  return (
    <div className="daw-container" style={{ minWidth: '1600px', width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0d0f12', color: '#fff', boxSizing: 'border-box' }}>
      {/* Header */}
      <header style={{ padding: '20px 24px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#12141c' }}>
        <h1 style={{ margin: 0, fontSize: '20px', letterSpacing: '1px' }}>BredForge Mobile DAW v1.1 <span style={{ fontSize: '12px', color: '#3b82f6', background: '#1e3a8a33', padding: '4px 8px', borderRadius: '4px' }}>Panoramic Workstation</span></h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Bank A</button>
          <button style={{ padding: '8px 16px', background: '#1f2937', color: '#9ca3af', border: 'none', borderRadius: '6px' }}>Bank B</button>
          <button style={{ padding: '8px 16px', background: '#1f2937', color: '#9ca3af', border: 'none', borderRadius: '6px' }}>Bank C</button>
          <button style={{ padding: '8px 16px', background: '#1f2937', color: '#9ca3af', border: 'none', borderRadius: '6px' }}>Bank D</button>
        </div>
      </header>

      {/* Main Panoramic Workspace (1600px Bento Split) */}
      <main style={{ display: 'flex', flex: 1, padding: '24px', gap: '24px', boxSizing: 'border-box' }}>
        {/* Left Stage: Performance Pads Matrix (65% width) */}
        <section style={{ flex: '0 0 65%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#161922', padding: '20px', borderRadius: '12px', border: '1px solid #2a2e3d', flex: 1 }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#9ca3af', letterSpacing: '0.5px' }}>PERFORMANCE PADS (BANK A)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', height: 'calc(100% - 40px)' }}>
              {[...Array(16)].map((_, i) => (
                <div key={i} style={{ background: '#1f2430', borderRadius: '8px', border: '1px solid #333a4d', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', minHeight: '110px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa' }}>{i + 1}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>SYNTH</span>
                  <span style={{ fontSize: '10px', color: '#4b5563', textAlign: 'right' }}>+</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Stage: Chopper, Filter & Control Decks (35% width) */}
        <section style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#161922', padding: '20px', borderRadius: '12px', border: '1px solid #2a2e3d' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#9ca3af' }}>Sample Chopper & Trimmer</h3>
            <div style={{ height: '80px', background: '#0f1117', borderRadius: '6px', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
              Waveform Display Area
            </div>
          </div>

          <div style={{ background: '#161922', padding: '20px', borderRadius: '12px', border: '1px solid #2a2e3d', flex: 1 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#9ca3af' }}>Filter Routing Deck</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <span style={{ padding: '4px 12px', background: '#2563eb', borderRadius: '4px', fontSize: '12px' }}>LPF</span>
              <span style={{ padding: '4px 12px', background: '#1f2937', borderRadius: '4px', fontSize: '12px', color: '#9ca3af' }}>HPF</span>
              <span style={{ padding: '4px 12px', background: '#1f2937', borderRadius: '4px', fontSize: '12px', color: '#9ca3af' }}>BPF</span>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>Cutoff Freq: 16.3 kHz</div>
          </div>
        </section>
      </main>

      {/* Footer Tracker */}
      <footer style={{ background: '#11131a', padding: '16px 24px', borderTop: '1px solid #222', fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa' }}>
        M8 Tracker Grid (Right Stage) • Panoramic Mode Active (1600px Studio Canvas)
      </footer>
    </div>
  );
}
