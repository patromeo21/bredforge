import React, { useState, useEffect, useRef } from 'react';

type TabMode = 'F1_F2' | 'F3_MIXER' | 'F4_BENCH' | 'F5_SONG' | 'F6_MENU';
type RightPanelMode = 'PADS' | 'NAV';
type F6SubView = 'MAIN' | 'PROJECT_SETTINGS' | 'SYNTH_ENGINE' | 'TABLE_EDITOR' | 'FX_CONFIG';

interface DualScreenWorkspaceProps {
  projectName?: string;
  tempo?: number;
}

interface TableRow {
  step: number;
  pitch: string;
  vol: string;
  cmd: string;
  del: number;
}

interface SongSlot {
  id: string;
  pattern: string;
  bars: number;
  status: 'ACTIVE' | 'QUEUED' | 'EMPTY';
}

// Expanded Synth Engine State Interface
interface SynthParams {
  waveform: OscillatorType;
  filterCutoff: number; // 100Hz to 10000Hz
  filterRes: number;    // 0 to 20 dB Q
  attack: number;       // 0.001s to 1.0s
  decay: number;        // 0.05s to 2.0s
}

export const DualScreenWorkspace: React.FC<DualScreenWorkspaceProps> = ({
  projectName = 'BREDFORGE_M8_PROJ',
  tempo: initialTempo = 120,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('F1_F2');
  const [rightMode, setRightMode] = useState<RightPanelMode>('PADS');
  const [fxModeActive, setFxModeActive] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [tempo, setTempo] = useState<number>(initialTempo);
  const [activePad, setActivePad] = useState<string | null>(null);
  const [activeFxTrigger, setActiveFxTrigger] = useState<string | null>(null);
  const [f6SubView, setF6SubView] = useState<F6SubView>('MAIN');
  const [lastTriggeredInfo, setLastTriggeredInfo] = useState<string>('SYS_READY');

  // Interactive Synth Parameters
  const [synthParams, setSynthParams] = useState<SynthParams>({
    waveform: 'sawtooth',
    filterCutoff: 3500,
    filterRes: 4,
    attack: 0.01,
    decay: 0.25,
  });

  const [tableSpeed, setTableSpeed] = useState<number>(1);
  const [selectedTableRow, setSelectedTableRow] = useState<number>(0);
  const [tableRows, setTableRows] = useState<TableRow[]>([
    { step: 0, pitch: '+00', vol: 'FF', cmd: 'TSP', del: 3 },
    { step: 1, pitch: '-02', vol: 'C0', cmd: '---', del: 0 },
    { step: 2, pitch: '-05', vol: '80', cmd: 'CUT', del: -2 },
    { step: 3, pitch: '-12', vol: '00', cmd: '---', del: 0 },
    { step: 4, pitch: '+00', vol: 'FF', cmd: '---', del: 1 },
    { step: 5, pitch: '+00', vol: 'FF', cmd: '---', del: 0 },
    { step: 6, pitch: '+00', vol: 'FF', cmd: '---', del: 0 },
    { step: 7, pitch: '+00', vol: 'FF', cmd: '---', del: 0 },
  ]);

  const [songSlots, setSongSlots] = useState<SongSlot[]>([
    { id: '1', pattern: 'PAT_A (Intro Beat)', bars: 4, status: 'ACTIVE' },
    { id: '2', pattern: 'PAT_A (Verse Build)', bars: 4, status: 'QUEUED' },
    { id: '3', pattern: 'PAT_B (Drop Kick)', bars: 8, status: 'EMPTY' },
    { id: '4', pattern: 'PAT_C (Breakdown)', bars: 4, status: 'EMPTY' },
  ]);

  const addSongSlot = () => {
    const newId = String(songSlots.length + 1);
    setSongSlots([...songSlots, { id: newId, pattern: 'PAT_D (Outro)', bars: 4, status: 'EMPTY' }]);
  };

  const cycleSlotStatus = (id: string) => {
    setSongSlots(prev => prev.map(slot => {
      if (slot.id === id) {
        const nextStatus: SongSlot['status'] = 
          slot.status === 'ACTIVE' ? 'QUEUED' : 
          slot.status === 'QUEUED' ? 'EMPTY' : 'ACTIVE';
        return { ...slot, status: nextStatus };
      }
      return slot;
    }));
  };

  const exportProjectState = () => {
    const projectData = {
      app: 'bredforge',
      version: '1.0.0',
      projectName,
      tempo,
      synthParams,
      tableSpeed,
      tableRows,
      songSlots,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_state.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setLastTriggeredInfo('PROJECT EXPORTED');
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Expanded Web Audio Synth & Sample Trigger Engine
  const triggerPadAudio = (padName: string) => {
    setActivePad(padName);
    setLastTriggeredInfo(`PAD: ${padName}`);

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      const now = audioCtx.currentTime;

      if (padName.includes('KICK') || padName.includes('SUB')) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
      } else if (padName.includes('SNARE') || padName.includes('CLAP')) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
      } else if (padName.includes('SYNTH') || padName.includes('BASS')) {
        // Full Synth Engine Routing: OSC -> Filter -> Gain Envelope -> Output
        osc.type = synthParams.waveform;
        osc.frequency.setValueAtTime(padName.includes('BASS') ? 110 : 440, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(synthParams.filterCutoff, now);
        filter.Q.setValueAtTime(synthParams.filterRes, now);

        // Envelope attack & decay
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + synthParams.attack);
        gain.gain.exponentialRampToValueAtTime(0.001, now + synthParams.attack + synthParams.decay);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
      }

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Fallback
    }

    setTimeout(() => setActivePad(null), 120);
  };

  const adjustTableTick = (delta: number) => {
    setTableRows(prev => prev.map((row, idx) => {
      if (idx === selectedTableRow) {
        const newDel = Math.max(-8, Math.min(8, row.del + delta));
        return { ...row, del: newDel };
      }
      return row;
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const sliceWidth = canvas.width / 100;
      let x = 0;

      for (let i = 0; i < 100; i++) {
        const v = Math.sin(phase + i * 0.1) * (canvas.height / 2.5) * (isPlaying ? 1 : 0.2);
        const y = canvas.height / 2 + v;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.stroke();
      phase += isPlaying ? 0.15 : 0.02;
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 bg-[#0a0f0d] text-emerald-400 font-mono select-none flex flex-col overflow-hidden text-xs md:text-sm p-1.5 md:p-3 border-4 border-neutral-900 shadow-2xl">
      
      {/* 1. TOP HARDWARE BEZEL HEADER & WAVEFORM BANNER */}
      <div className="relative bg-neutral-900/90 border border-emerald-900/60 rounded p-2 flex items-center justify-between shrink-0 shadow-inner">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={32} 
          className="absolute inset-x-24 inset-y-1 opacity-30 pointer-events-none"
        />
        
        <div className="flex items-center space-x-3 z-10">
          <span className="font-bold tracking-widest text-emerald-300 bg-black/40 px-2 py-0.5 rounded border border-emerald-800/50">[●] {projectName}</span>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-300">BPM: {tempo}</span>
          <span className="text-neutral-600">|</span>
          <span className="text-amber-400 font-bold tracking-wide">{lastTriggeredInfo}</span>
        </div>

        <div className="flex items-center space-x-2 z-10">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1 rounded border transition-all ${isPlaying ? 'bg-emerald-500 text-black border-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-neutral-800 border-neutral-700 text-emerald-400 hover:bg-neutral-700'}`}
          >
            {isPlaying ? '[■ STOP]' : '[▶ PLAY]'}
          </button>
        </div>
      </div>

      {/* 2. MAIN VIEWPORT */}
      <div className="flex-1 flex overflow-hidden py-2 gap-2">
        
        {/* --- [F1 / F2] MULTI-VIEW TAB --- */}
        {activeTab === 'F1_F2' && (
          <>
            <div className="flex-1 bg-neutral-900/70 border border-emerald-900/40 rounded-lg flex flex-col overflow-hidden shadow-lg">
              <div className="bg-neutral-800/90 px-3 py-1.5 text-xs font-bold text-neutral-300 border-b border-emerald-900/40 flex justify-between items-center">
                <span className="tracking-wider">TRACKER SEQUENCER (64 ROWS)</span>
                <span className="text-emerald-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">PAT: 01</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
                <div className="grid grid-cols-5 text-neutral-500 border-b border-neutral-800 pb-1 mb-1 font-bold">
                  <span>ROW</span><span>T1(KIK)</span><span>T2(SNR)</span><span>T3(HAT)</span><span>T4(SYN)</span>
                </div>
                {Array.from({ length: 64 }).map((_, r) => (
                  <div key={r} className={`grid grid-cols-5 py-0.5 px-1 rounded transition-colors ${r === currentRow ? 'bg-emerald-950 text-emerald-200 border-l-2 border-emerald-400 font-bold' : 'text-neutral-400 hover:bg-neutral-800/40'}`}>
                    <span className="text-neutral-500">{String(r).padStart(2, '0')}{r === currentRow ? '▶' : ' '}</span>
                    <span>{r === 0 ? 'C-4 01 64' : '--- -- --'}</span>
                    <span>{r === 4 ? 'E-4 02 50' : '--- -- --'}</span>
                    <span>{r % 2 === 0 ? 'G-3 03 40' : '--- -- --'}</span>
                    <span>--- -- --</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-80 flex flex-col gap-2 shrink-0">
              <div className="h-36 bg-neutral-900/70 border border-emerald-900/40 rounded-lg p-2 flex flex-col justify-between shadow-lg">
                <div className="text-[11px] font-bold text-neutral-300 flex justify-between items-center">
                  <span>MINI WORKBENCH</span>
                  <span className="text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded border border-neutral-800">01_BREAK</span>
                </div>
                <div className="flex-1 bg-black/80 border border-neutral-800 rounded my-1 relative flex items-center px-2">
                  <div className="w-full h-8 flex items-center justify-between text-emerald-500 opacity-90 font-bold">
                    <span>|</span><span>/\/\_/\/\</span><span>|</span><span>/\_/\/\_</span><span>|</span>
                  </div>
                </div>
                <div className="text-[10px] text-neutral-400 flex justify-between">
                  <span>START: 00.00</span>
                  <span>SLICES: 04</span>
                  <span>END: 02.50</span>
                </div>
              </div>

              <div className="flex-1 bg-neutral-900/70 border border-emerald-900/40 rounded-lg p-2 flex flex-col shadow-lg">
                <div className="flex bg-neutral-950 p-1 rounded border border-neutral-800 mb-2">
                  <button 
                    onClick={() => setRightMode('PADS')}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold transition-all ${rightMode === 'PADS' ? 'bg-emerald-600 text-black shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                  >
                    4X4 PADS
                  </button>
                  <button 
                    onClick={() => setRightMode('NAV')}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold transition-all ${rightMode === 'NAV' ? 'bg-emerald-600 text-black shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                  >
                    M8 NAV / FX
                  </button>
                </div>

                {rightMode === 'PADS' && (
                  <div className="flex-1 grid grid-cols-4 gap-1.5 p-1">
                    {['KICK_01', 'SNARE_01', 'HIHAT_01', 'SYNTH_01', 'CHOP_01', 'CHOP_02', 'CHOP_03', 'CHOP_04', 'PERC_01', 'PERC_02', 'VOCAL_1', 'BASS_01', 'FX_01', 'FX_02', 'CRASH_1', 'SUB_01'].map((pad, idx) => (
                      <button 
                        key={idx} 
                        onMouseDown={() => triggerPadAudio(pad)}
                        onTouchStart={() => triggerPadAudio(pad)}
                        className={`border rounded-md flex flex-col items-center justify-center p-1 text-[10px] transition-all shadow-sm ${activePad === pad ? 'bg-emerald-400 text-black border-emerald-200 font-bold scale-95 shadow-[0_0_12px_rgba(16,185,129,0.9)]' : 'bg-neutral-800/90 hover:bg-emerald-900/50 border-neutral-700 text-neutral-300'}`}
                      >
                        <span className="text-[9px] text-emerald-500 font-bold">{idx + 1}</span>
                        <span className="truncate w-full text-center">{pad}</span>
                      </button>
                    ))}
                  </div>
                )}

                {rightMode === 'NAV' && (
                  <div className="flex-1 flex flex-col justify-center items-center p-2 space-y-3">
                    {!fxModeActive ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 w-full">
                          <div />
                          <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-2 rounded text-center active:bg-emerald-500 active:text-black font-bold shadow">▲ UP</button>
                          <div />
                          <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-2 rounded text-center active:bg-emerald-500 active:text-black font-bold shadow">◄</button>
                          <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-2 rounded text-center text-xs active:bg-emerald-500 active:text-black font-bold shadow">EDIT</button>
                          <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-2 rounded text-center active:bg-emerald-500 active:text-black font-bold shadow">►</button>
                          <div />
                          <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-2 rounded text-center active:bg-emerald-500 active:text-black font-bold shadow">▼ DOWN</button>
                          <div />
                        </div>
                        <div className="grid grid-cols-3 gap-2 w-full text-xs">
                          <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-1.5 rounded active:bg-emerald-500 active:text-black font-bold shadow">OPTION</button>
                          <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-1.5 rounded active:bg-emerald-500 active:text-black font-bold shadow">SHIFT</button>
                          <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-1.5 rounded active:bg-emerald-500 active:text-black font-bold shadow">PLAY</button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full grid grid-cols-3 gap-1.5">
                        {['DJFX LOOP', 'TAPE STOP', 'STUTTER', 'BITCRUSH', 'HP FILTER', 'LP FILTER', 'REVERSE', 'VINYL SIM', 'PITCH DROP'].map((fx, i) => (
                          <button 
                            key={i} 
                            onMouseDown={() => setActiveFxTrigger(fx)}
                            onMouseUp={() => setActiveFxTrigger(null)}
                            className={`p-2 rounded text-[10px] font-bold border transition-all ${activeFxTrigger === fx ? 'bg-amber-400 text-black border-white shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-neutral-900 border-amber-600/60 text-amber-400 hover:bg-amber-950/40'}`}
                          >
                            {fx}
                          </button>
                        ))}
                      </div>
                    )}

                    <button 
                      onClick={() => setFxModeActive(!fxModeActive)}
                      className={`w-full py-2 rounded border font-bold text-xs transition-all ${fxModeActive ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.7)] animate-pulse' : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-neutral-200'}`}
                    >
                      {fxModeActive ? '⚡ [FX MODE ACTIVE: PUNCH-IN ENGAGED]' : '⚡ [9th BTN: FX MODE OFF]'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* --- [F3] MIXER TAB --- */}
        {activeTab === 'F3_MIXER' && (
          <div className="flex-1 bg-neutral-900/70 border border-emerald-900/40 rounded-lg p-4 flex flex-col shadow-lg">
            <div className="font-bold text-emerald-300 mb-3 border-b border-neutral-800 pb-2 tracking-wide">MASTER MIX & 7 TRACK CHANNELS (PARALLEL DYNAMICS)</div>
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-2">
              <div className="bg-neutral-900 border border-emerald-600/60 p-2.5 rounded-md flex items-center justify-between shadow">
                <span className="font-bold text-emerald-300 w-28">MASTER BUS</span>
                <span className="text-neutral-300">Vol: 85%</span>
                <span className="text-neutral-300">Limiter Mix: 100%</span>
                <div className="space-x-1.5">
                  <button className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-xs">MUTE</button>
                  <button className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-xs">SOLO</button>
                </div>
              </div>

              {['T1 (Kick)', 'T2 (Snare)', 'T3 (HiHat)', 'T4 (Synth)', 'T5 (Bass)', 'T6 (Pad)', 'T7 (FX)'].map((trk, i) => (
                <div key={i} className="bg-neutral-900/60 border border-neutral-800 p-2 rounded-md flex items-center justify-between">
                  <span className="text-neutral-300 w-28 font-bold">{trk}</span>
                  <span className="text-neutral-400">Vol: 80%</span>
                  <span className="text-neutral-400">Comp Mix: {50 + i * 5}%</span>
                  <div className="space-x-1">
                    <button className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-neutral-300 text-xs">M</button>
                    <button className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-neutral-300 text-xs">S</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- [F4] BENCH TAB --- */}
        {activeTab === 'F4_BENCH' && (
          <div className="flex-1 flex gap-2">
            <div className="flex-1 bg-neutral-900/70 border border-emerald-900/40 rounded-lg p-4 flex flex-col justify-between shadow-lg">
              <div className="font-bold text-emerald-300 tracking-wide">DEDICATED SAMPLE WORKBENCH & PRECISION CHOPPER</div>
              <div className="flex-1 bg-black/80 border border-neutral-800 rounded-md my-2 flex items-center justify-center text-neutral-500">
                [ LOAD OR DRAG AUDIO FILE FOR SURGICAL WAVEFORM SLICING ]
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>ZOOM: 100%</span>
                <span>ZERO-CROSSING SNAP: ON</span>
                <span>TOUCH-DRAG START/END: ENABLED</span>
              </div>
            </div>
            <div className="w-72 bg-neutral-900/70 border border-emerald-900/40 rounded-lg p-3 flex flex-col items-center justify-center space-y-4 shadow-lg">
              <div className="text-xs font-bold text-neutral-300">M8 NAVIGATION WINDOW</div>
              <div className="grid grid-cols-3 gap-2 w-full text-center">
                <div />
                <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-1.5 rounded shadow">▲</button>
                <div />
                <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-1.5 rounded shadow">◄</button>
                <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-1.5 rounded shadow">EDIT</button>
                <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-1.5 rounded shadow">►</button>
                <div />
                <button className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-1.5 rounded shadow">▼</button>
                <div />
              </div>
              <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded shadow">ASSIGN CHOP TO [F1/F2] PADS</button>
            </div>
          </div>
        )}

        {/* --- [F5] SONG ARRANGER TAB --- */}
        {activeTab === 'F5_SONG' && (
          <div className="flex-1 bg-neutral-900/70 border border-emerald-900/40 rounded-lg p-4 flex flex-col shadow-lg">
            <div className="flex justify-between items-center mb-3 border-b border-neutral-800 pb-2">
              <span className="font-bold text-emerald-300 tracking-wide">SONG ARRANGER // SP-404SX PATTERN CHAIN WORKFLOW</span>
              <button onClick={addSongSlot} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded text-xs shadow">+ ADD CHAIN SLOT</button>
            </div>
            
            <div className="text-neutral-400 text-xs mb-3">
              Click any slot status to toggle between <span className="text-emerald-400 font-bold">[ACTIVE]</span>, <span className="text-amber-400 font-bold">[QUEUED]</span>, and <span className="text-neutral-500">[EMPTY]</span>.
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {songSlots.map((slot, index) => (
                <div 
                  key={slot.id} 
                  className={`p-3 rounded-md border flex justify-between items-center transition-all ${
                    slot.status === 'ACTIVE' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                    slot.status === 'QUEUED' ? 'bg-amber-950/40 border-amber-600 text-amber-300' :
                    'bg-neutral-900/80 border-neutral-800 text-neutral-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-neutral-500 font-bold">SLOT {String(index + 1).padStart(2, '0')}</span>
                    <span className="font-bold text-white">{slot.pattern}</span>
                    <span className="text-xs text-neutral-400">({slot.bars} Bars)</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => cycleSlotStatus(slot.id)}
                      className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                        slot.status === 'ACTIVE' ? 'bg-emerald-600 text-black border-emerald-400' :
                        slot.status === 'QUEUED' ? 'bg-amber-500 text-black border-amber-400' :
                        'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                      }`}
                    >
                      [{slot.status}]
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- [F6] MENU & PRESET MANAGER TAB --- */}
        {activeTab === 'F6_MENU' && (
          <div className="flex-1 bg-neutral-900/70 border border-emerald-900/40 rounded-lg p-4 flex flex-col shadow-lg">
            <div className="flex justify-between items-center mb-3 border-b border-neutral-800 pb-2">
              <span className="font-bold text-emerald-300 tracking-wide">MENU & PRESET MANAGER {f6SubView !== 'MAIN' ? `// ${f6SubView}` : ''}</span>
              {f6SubView !== 'MAIN' && (
                <button onClick={() => setF6SubView('MAIN')} className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs">← BACK TO MENU</button>
              )}
            </div>

            {f6SubView === 'MAIN' && (
              <div className="space-y-2 text-neutral-300">
                <div onClick={() => setF6SubView('PROJECT_SETTINGS')} className="p-2.5 bg-neutral-900 hover:bg-neutral-800 rounded-md border border-neutral-800 hover:border-emerald-500 cursor-pointer transition-colors">&gt; [1] PROJECT SETTINGS (Tempo, Swing, Master Scale, Export)</div>
                <div onClick={() => setF6SubView('SYNTH_ENGINE')} className="p-2.5 bg-neutral-900 hover:bg-neutral-800 rounded-md border border-neutral-800 hover:border-emerald-500 cursor-pointer transition-colors">&gt; [2] SYNTH ENGINE (Waveform, Filter LPF, Envelope ADSR)</div>
                <div onClick={() => setF6SubView('TABLE_EDITOR')} className="p-2.5 bg-neutral-900 hover:bg-neutral-800 rounded-md border border-neutral-800 hover:border-emerald-500 cursor-pointer transition-colors">&gt; [3] TABLE EDITOR (Sub-Step Sequencing & Micro-Timing Ticks)</div>
                <div onClick={() => setF6SubView('FX_CONFIG')} className="p-2.5 bg-neutral-900 hover:bg-neutral-800 rounded-md border border-neutral-800 hover:border-emerald-500 cursor-pointer transition-colors">&gt; [4] FX PARAMETER CONFIG & PUNCH-IN MAPS</div>
                <div className="p-2.5 bg-neutral-900 hover:bg-neutral-800 rounded-md border border-neutral-800 hover:border-emerald-500 cursor-pointer transition-colors">&gt; [5] SYSTEM & AUDIO INFO (iPad 9th Gen Audio Latency / 256ms)</div>
              </div>
            )}

            {f6SubView === 'PROJECT_SETTINGS' && (
              <div className="space-y-3 text-xs text-neutral-300">
                <div className="flex justify-between items-center bg-neutral-900 p-2.5 rounded-md border border-neutral-800">
                  <span>MASTER TEMPO (BPM)</span>
                  <input type="number" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} className="bg-neutral-800 text-emerald-400 px-2 py-1 rounded w-20 text-center border border-neutral-700" />
                </div>
                <div className="flex justify-between items-center bg-neutral-900 p-2.5 rounded-md border border-neutral-800">
                  <span>SWING AMOUNT</span>
                  <span className="text-emerald-400">50% (OFF)</span>
                </div>
                <div className="pt-2">
                  <button 
                    onClick={exportProjectState}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded shadow transition-all flex items-center justify-center space-x-2"
                  >
                    <span>💾 EXPORT PROJECT STATE (.JSON)</span>
                  </button>
                </div>
              </div>
            )}

            {/* SYNTH ENGINE PARAMETERS EDITOR */}
            {f6SubView === 'SYNTH_ENGINE' && (
              <div className="space-y-3 text-xs text-neutral-300 flex-1 overflow-y-auto">
                <div className="bg-neutral-900 p-2.5 rounded-md border border-neutral-800 flex justify-between items-center">
                  <span className="font-bold text-emerald-300">OSCILLATOR WAVEFORM</span>
                  <div className="flex space-x-1">
                    {(['sawtooth', 'square', 'sine', 'triangle'] as OscillatorType[]).map(type => (
                      <button 
                        key={type} 
                        onClick={() => setSynthParams(p => ({ ...p, waveform: type }))}
                        className={`px-2 py-1 rounded text-[11px] font-bold uppercase transition-all ${synthParams.waveform === type ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-900 p-2.5 rounded-md border border-neutral-800 flex justify-between items-center">
                  <span>LOW PASS FILTER CUTOFF ({synthParams.filterCutoff} Hz)</span>
                  <input 
                    type="range" 
                    min={200} 
                    max={8000} 
                    step={100} 
                    value={synthParams.filterCutoff} 
                    onChange={e => setSynthParams(p => ({ ...p, filterCutoff: Number(e.target.value) }))}
                    className="w-40 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="bg-neutral-900 p-2.5 rounded-md border border-neutral-800 flex justify-between items-center">
                  <span>FILTER RESONANCE / Q ({synthParams.filterRes} dB)</span>
                  <input 
                    type="range" 
                    min={0} 
                    max={15} 
                    step={1} 
                    value={synthParams.filterRes} 
                    onChange={e => setSynthParams(p => ({ ...p, filterRes: Number(e.target.value) }))}
                    className="w-40 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="bg-neutral-900 p-2.5 rounded-md border border-neutral-800 flex justify-between items-center">
                  <span>ENVELOPE ATTACK ({synthParams.attack.toFixed(2)}s)</span>
                  <input 
                    type="range" 
                    min={0.001} 
                    max={0.5} 
                    step={0.01} 
                    value={synthParams.attack} 
                    onChange={e => setSynthParams(p => ({ ...p, attack: Number(e.target.value) }))}
                    className="w-40 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="bg-neutral-900 p-2.5 rounded-md border border-neutral-800 flex justify-between items-center">
                  <span>ENVELOPE DECAY ({synthParams.decay.toFixed(2)}s)</span>
                  <input 
                    type="range" 
                    min={0.05} 
                    max={1.5} 
                    step={0.05} 
                    value={synthParams.decay} 
                    onChange={e => setSynthParams(p => ({ ...p, decay: Number(e.target.value) }))}
                    className="w-40 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="p-2 bg-neutral-950/80 rounded border border-neutral-800 text-[11px] text-neutral-400">
                  💡 <span className="text-emerald-400 font-bold">Pro Tip:</span> Tap <span className="text-white font-bold">SYNTH_01</span> or <span className="text-white font-bold">BASS_01</span> on the 4x4 pads to audition your custom synth parameters live!
                </div>
              </div>
            )}

            {f6SubView === 'TABLE_EDITOR' && (
              <div className="flex-1 flex flex-col space-y-3 text-xs">
                <div className="flex justify-between items-center bg-neutral-900 p-2.5 rounded-md border border-neutral-800">
                  <span className="text-neutral-300 font-bold">TABLE ID: 01 // SPEED: {tableSpeed} TICK/STEP</span>
                  <div className="space-x-2">
                    <button onClick={() => setTableSpeed(s => Math.max(1, s - 1))} className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded font-bold">-</button>
                    <button onClick={() => setTableSpeed(s => Math.min(8, s + 1))} className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded font-bold">+</button>
                  </div>
                </div>

                <div className="grid grid-cols-5 font-bold text-neutral-500 border-b border-neutral-800 pb-1 px-1">
                  <span>STEP</span><span>PITCH</span><span>VOL</span><span>CMD (FX)</span><span>NUDGE (DEL)</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {tableRows.map((row, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedTableRow(idx)}
                      className={`grid grid-cols-5 py-1 px-1 rounded-sm cursor-pointer border transition-colors ${selectedTableRow === idx ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 font-bold' : 'bg-neutral-900/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800'}`}
                    >
                      <span>{String(row.step).padStart(2, '0')}{selectedTableRow === idx ? '▶' : ''}</span>
                      <span>{row.pitch}</span>
                      <span>{row.vol}</span>
                      <span>{row.cmd}</span>
                      <span className={row.del !== 0 ? 'text-amber-400 font-bold' : 'text-neutral-500'}>
                        {row.del > 0 ? `+${row.del}` : row.del} TICKS
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-neutral-900 p-2.5 rounded-md border border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-300">NUDGE STEP {selectedTableRow} Ticks:</span>
                  <div className="space-x-2">
                    <button onClick={() => adjustTableTick(-1)} className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded font-bold shadow">-1 TICK</button>
                    <button onClick={() => adjustTableTick(1)} className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded font-bold shadow">+1 TICK</button>
                  </div>
                </div>
              </div>
            )}

            {f6SubView === 'FX_CONFIG' && (
              <div className="space-y-2 text-xs text-neutral-300">
                <div className="bg-neutral-900 p-2.5 rounded-md border border-neutral-800 flex justify-between items-center">
                  <span>9th BTN PUNCH-IN FX MAP: DJFX LOOP</span>
                  <span className="text-emerald-400">RATE: 1/4 BEAT</span>
                </div>
                <div className="bg-neutral-900 p-2.5 rounded-md border border-neutral-800 flex justify-between items-center">
                  <span>TAPE STOP DECAY TIME</span>
                  <span className="text-emerald-400">250ms</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. BOTTOM HARDWARE SOFT-KEYS NAVIGATION BAR */}
      <div className="bg-neutral-900/90 border-t border-emerald-900/60 p-2.5 flex justify-around items-center shrink-0 rounded-b shadow-inner">
        <button 
          onClick={() => { setActiveTab('F1_F2'); setF6SubView('MAIN'); }}
          className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all shadow ${activeTab === 'F1_F2' ? 'bg-emerald-500 text-black border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700'}`}
        >
          [F1/F2] MULTI-VIEW{activeTab === 'F1_F2' ? '*' : ''}
        </button>
        <button 
          onClick={() => { setActiveTab('F3_MIXER'); setF6SubView('MAIN'); }}
          className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all shadow ${activeTab === 'F3_MIXER' ? 'bg-emerald-500 text-black border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700'}`}
        >
          [F3] MIXER{activeTab === 'F3_MIXER' ? '*' : ''}
        </button>
        <button 
          onClick={() => { setActiveTab('F4_BENCH'); setF6SubView('MAIN'); }}
          className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all shadow ${activeTab === 'F4_BENCH' ? 'bg-emerald-500 text-black border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700'}`}
        >
          [F4] BENCH{activeTab === 'F4_BENCH' ? '*' : ''}
        </button>
        <button 
          onClick={() => { setActiveTab('F5_SONG'); setF6SubView('MAIN'); }}
          className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all shadow ${activeTab === 'F5_SONG' ? 'bg-emerald-500 text-black border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700'}`}
        >
          [F5] SONG{activeTab === 'F5_SONG' ? '*' : ''}
        </button>
        <button 
          onClick={() => { setActiveTab('F6_MENU'); }}
          className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all shadow ${activeTab === 'F6_MENU' ? 'bg-emerald-500 text-black border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700'}`}
        >
          [F6] MENU{activeTab === 'F6_MENU' ? '*' : ''}
        </button>
      </div>

    </div>
  );
};

export default DualScreenWorkspace;
