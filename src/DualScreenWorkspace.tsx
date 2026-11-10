import React, { useState, useEffect, useRef } from 'react';

type TabMode = 'F1_F2' | 'F3_MIXER' | 'F4_BENCH' | 'F5_SONG' | 'F6_MENU';
type RightPanelMode = 'PADS' | 'NAV';
type F6SubView = 'MAIN' | 'PROJECT_SETTINGS' | 'TABLE_EDITOR' | 'FX_CONFIG';

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

export const DualScreenWorkspace: React.FC<DualScreenWorkspaceProps> = ({
  projectName = 'BREDFORGE_PROJ_01',
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
  const [lastTriggeredInfo, setLastTriggeredInfo] = useState<string>('READY');

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

  // Interactive Song Arranger Pattern Chain State
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const triggerPadAudio = (padName: string) => {
    setActivePad(padName);
    setLastTriggeredInfo(`PAD: ${padName}`);

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (padName.includes('KICK') || padName.includes('SUB')) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      } else if (padName.includes('SNARE') || padName.includes('CLAP')) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      }

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
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
    <div className="fixed inset-0 bg-neutral-950 text-emerald-400 font-mono select-none flex flex-col overflow-hidden text-xs md:text-sm">
      
      {/* 1. TOP HEADER & WAVEFORM BANNER */}
      <div className="relative bg-neutral-900 border-b border-emerald-900/50 p-2 flex items-center justify-between shrink-0">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={32} 
          className="absolute inset-x-20 inset-y-1 opacity-40 pointer-events-none"
        />
        
        <div className="flex items-center space-x-3 z-10">
          <span className="font-bold tracking-wider text-emerald-300">[●] {projectName}</span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-300">BPM: {tempo}</span>
          <span className="text-neutral-500">|</span>
          <span className="text-amber-400 font-bold">{lastTriggeredInfo}</span>
        </div>

        <div className="flex items-center space-x-2 z-10">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1 rounded border ${isPlaying ? 'bg-emerald-600 text-black border-emerald-400 font-bold' : 'bg-neutral-800 border-neutral-700 text-emerald-400'}`}
          >
            {isPlaying ? '[■ STOP]' : '[▶ PLAY]'}
          </button>
        </div>
      </div>

      {/* 2. MAIN VIEWPORT */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2">
        
        {/* --- [F1 / F2] MULTI-VIEW TAB --- */}
        {activeTab === 'F1_F2' && (
          <>
            <div className="flex-1 bg-neutral-900/80 border border-emerald-900/40 rounded flex flex-col overflow-hidden">
              <div className="bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-300 border-b border-emerald-900/30 flex justify-between">
                <span>TRACKER SEQUENCER (64 ROWS)</span>
                <span className="text-emerald-400">PAT: 01</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
                <div className="grid grid-cols-5 text-neutral-500 border-b border-neutral-800 pb-1 mb-1 font-bold">
                  <span>ROW</span><span>T1(KIK)</span><span>T2(SNR)</span><span>T3(HAT)</span><span>T4(SYN)</span>
                </div>
                {Array.from({ length: 64 }).map((_, r) => (
                  <div key={r} className={`grid grid-cols-5 py-0.5 px-1 rounded ${r === currentRow ? 'bg-emerald-950/80 text-emerald-300 border-l-2 border-emerald-400' : 'text-neutral-400 hover:bg-neutral-800/40'}`}>
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
              <div className="h-36 bg-neutral-900/80 border border-emerald-900/40 rounded p-2 flex flex-col justify-between">
                <div className="text-[11px] font-bold text-neutral-300 flex justify-between items-center">
                  <span>MINI WORKBENCH</span>
                  <span className="text-emerald-500">SAMPLE: 01_BREAK</span>
                </div>
                <div className="flex-1 bg-black/60 border border-neutral-800 rounded my-1 relative flex items-center px-2">
                  <div className="w-full h-8 flex items-center justify-between text-emerald-600 opacity-80">
                    <span>|</span><span>/\/\_/\/\</span><span>|</span><span>/\_/\/\_</span><span>|</span>
                  </div>
                </div>
                <div className="text-[10px] text-neutral-400 flex justify-between">
                  <span>START: 00.00</span>
                  <span>SLICES: 04</span>
                  <span>END: 02.50</span>
                </div>
              </div>

              <div className="flex-1 bg-neutral-900/80 border border-emerald-900/40 rounded p-2 flex flex-col">
                <div className="flex bg-neutral-950 p-1 rounded border border-neutral-800 mb-2">
                  <button 
                    onClick={() => setRightMode('PADS')}
                    className={`flex-1 py-1 rounded text-[11px] font-bold ${rightMode === 'PADS' ? 'bg-emerald-600 text-black' : 'text-neutral-400'}`}
                  >
                    4X4 PADS
                  </button>
                  <button 
                    onClick={() => setRightMode('NAV')}
                    className={`flex-1 py-1 rounded text-[11px] font-bold ${rightMode === 'NAV' ? 'bg-emerald-600 text-black' : 'text-neutral-400'}`}
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
                        className={`border rounded flex flex-col items-center justify-center p-1 text-[10px] transition-all ${activePad === pad ? 'bg-emerald-400 text-black border-emerald-200 font-bold scale-95 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-neutral-800 hover:bg-emerald-900/60 border-neutral-700 text-neutral-300'}`}
                      >
                        <span className="text-[9px] text-emerald-500">{idx + 1}</span>
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
                          <button className="bg-neutral-800 border border-neutral-700 py-2 rounded text-center active:bg-emerald-500 active:text-black font-bold">▲ UP</button>
                          <div />
                          <button className="bg-neutral-800 border border-neutral-700 py-2 rounded text-center active:bg-emerald-500 active:text-black font-bold">◄</button>
                          <button className="bg-neutral-800 border border-neutral-700 py-2 rounded text-center text-xs active:bg-emerald-500 active:text-black font-bold">EDIT</button>
                          <button className="bg-neutral-800 border border-neutral-700 py-2 rounded text-center active:bg-emerald-500 active:text-black font-bold">►</button>
                          <div />
                          <button className="bg-neutral-800 border border-neutral-700 py-2 rounded text-center active:bg-emerald-500 active:text-black font-bold">▼ DOWN</button>
                          <div />
                        </div>
                        <div className="grid grid-cols-3 gap-2 w-full text-xs">
                          <button className="bg-neutral-800 border border-neutral-700 py-1.5 rounded active:bg-emerald-500 active:text-black font-bold">OPTION</button>
                          <button className="bg-neutral-800 border border-neutral-700 py-1.5 rounded active:bg-emerald-500 active:text-black font-bold">SHIFT</button>
                          <button className="bg-neutral-800 border border-neutral-700 py-1.5 rounded active:bg-emerald-500 active:text-black font-bold">PLAY</button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full grid grid-cols-3 gap-1.5">
                        {['DJFX LOOP', 'TAPE STOP', 'STUTTER', 'BITCRUSH', 'HP FILTER', 'LP FILTER', 'REVERSE', 'VINYL SIM', 'PITCH DROP'].map((fx, i) => (
                          <button 
                            key={i} 
                            onMouseDown={() => setActiveFxTrigger(fx)}
                            onMouseUp={() => setActiveFxTrigger(null)}
                            className={`p-2 rounded text-[10px] font-bold border ${activeFxTrigger === fx ? 'bg-amber-400 text-black border-white' : 'bg-neutral-900 border-amber-600/60 text-amber-400 hover:bg-amber-950/40'}`}
                          >
                            {fx}
                          </button>
                        ))}
                      </div>
                    )}

                    <button 
                      onClick={() => setFxModeActive(!fxModeActive)}
                      className={`w-full py-2 rounded border font-bold text-xs transition-all ${fxModeActive ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse' : 'bg-neutral-900 border-neutral-700 text-neutral-400'}`}
                    >
                      {fxModeActive ? '⚡ [FX MODE ACTIVE: PUNCH-IN FX ENGAGED]' : '⚡ [9th BTN: FX MODE OFF]'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* --- [F3] MIXER TAB --- */}
        {activeTab === 'F3_MIXER' && (
          <div className="flex-1 bg-neutral-950 border border-emerald-900/40 rounded p-4 flex flex-col">
            <div className="font-bold text-emerald-300 mb-2 border-b border-neutral-800 pb-2">MASTER MIX & 7 TRACK CHANNELS (PARALLEL DYNAMICS)</div>
            <div className="space-y-2 overflow-y-auto flex-1 pr-2">
              <div className="bg-neutral-900 border border-emerald-700/60 p-2 rounded flex items-center justify-between">
                <span className="font-bold text-emerald-400 w-28">MASTER BUS</span>
                <span className="text-neutral-400">Vol: 85%</span>
                <span className="text-neutral-400">Limiter Mix: 100%</span>
                <div className="space-x-1">
                  <button className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded">MUTE</button>
                  <button className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded">SOLO</button>
                </div>
              </div>

              {['T1 (Kick)', 'T2 (Snare)', 'T3 (HiHat)', 'T4 (Synth)', 'T5 (Bass)', 'T6 (Pad)', 'T7 (FX)'].map((trk, i) => (
                <div key={i} className="bg-neutral-900/60 border border-neutral-800 p-2 rounded flex items-center justify-between">
                  <span className="text-neutral-300 w-28 font-bold">{trk}</span>
                  <span className="text-neutral-400">Vol: 80%</span>
                  <span className="text-neutral-400">Comp Mix: {50 + i * 5}%</span>
                  <div className="space-x-1">
                    <button className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">M</button>
                    <button className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">S</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- [F4] BENCH TAB --- */}
        {activeTab === 'F4_BENCH' && (
          <div className="flex-1 flex gap-2">
            <div className="flex-1 bg-neutral-900/80 border border-emerald-900/40 rounded p-4 flex flex-col justify-between">
              <div className="font-bold text-emerald-300">DEDICATED SAMPLE WORKBENCH & PRECISION CHOPPER</div>
              <div className="flex-1 bg-black/60 border border-neutral-800 rounded my-2 flex items-center justify-center text-neutral-500">
                [ LOAD OR DRAG AUDIO FILE FOR SURGICAL WAVEFORM SLICING ]
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>ZOOM: 100%</span>
                <span>ZERO-CROSSING SNAP: ON</span>
                <span>TOUCH-DRAG START/END: ENABLED</span>
              </div>
            </div>
            <div className="w-72 bg-neutral-900/80 border border-emerald-900/40 rounded p-3 flex flex-col items-center justify-center space-y-4">
              <div className="text-xs font-bold text-neutral-300">M8 NAVIGATION WINDOW</div>
              <div className="grid grid-cols-3 gap-2 w-full text-center">
                <div />
                <button className="bg-neutral-800 border border-neutral-700 py-1.5 rounded">▲</button>
                <div />
                <button className="bg-neutral-800 border border-neutral-700 py-1.5 rounded">◄</button>
                <button className="bg-neutral-800 border border-neutral-700 py-1.5 rounded">EDIT</button>
                <button className="bg-neutral-800 border border-neutral-700 py-1.5 rounded">►</button>
                <div />
                <button className="bg-neutral-800 border border-neutral-700 py-1.5 rounded">▼</button>
                <div />
              </div>
              <button className="w-full py-2 bg-emerald-600 text-black font-bold rounded">ASSIGN CHOP TO [F1/F2] PADS</button>
            </div>
          </div>
        )}

        {/* --- [F5] SONG ARRANGER TAB (INTERACTIVE PATTERN CHAINING) --- */}
        {activeTab === 'F5_SONG' && (
          <div className="flex-1 bg-neutral-950 border border-emerald-900/40 rounded p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b border-neutral-800 pb-2">
              <span className="font-bold text-emerald-300">SONG ARRANGER // SP-404SX PATTERN CHAIN WORKFLOW</span>
              <button onClick={addSongSlot} className="px-3 py-1 bg-emerald-600 text-black font-bold rounded text-xs">+ ADD CHAIN SLOT</button>
            </div>
            
            <div className="text-neutral-400 text-xs mb-3">
              Click any slot status to toggle between <span className="text-emerald-400 font-bold">[ACTIVE]</span>, <span className="text-amber-400 font-bold">[QUEUED]</span>, and <span className="text-neutral-500">[EMPTY]</span>.
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {songSlots.map((slot, index) => (
                <div 
                  key={slot.id} 
                  className={`p-3 rounded border flex justify-between items-center transition-all ${
                    slot.status === 'ACTIVE' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                    slot.status === 'QUEUED' ? 'bg-amber-950/40 border-amber-600 text-amber-300' :
                    'bg-neutral-900 border-neutral-800 text-neutral-500'
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
                      className={`px-3 py-1 rounded text-xs font-bold border ${
                        slot.status === 'ACTIVE' ? 'bg-emerald-600 text-black border-emerald-400' :
                        slot.status === 'QUEUED' ? 'bg-amber-500 text-black border-amber-400' :
                        'bg-neutral-800 text-neutral-400 border-neutral-700'
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
          <div className="flex-1 bg-neutral-950 border border-emerald-900/40 rounded p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b border-neutral-800 pb-2">
              <span className="font-bold text-emerald-300">MENU & PRESET MANAGER {f6SubView !== 'MAIN' ? `// ${f6SubView}` : ''}</span>
              {f6SubView !== 'MAIN' && (
                <button onClick={() => setF6SubView('MAIN')} className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs">← BACK TO MENU</button>
              )}
            </div>

            {f6SubView === 'MAIN' && (
              <div className="space-y-2 text-neutral-300">
                <div onClick={() => setF6SubView('PROJECT_SETTINGS')} className="p-2 bg-neutral-900 rounded border border-neutral-800 hover:border-emerald-500 cursor-pointer">&gt; [1] PROJECT SETTINGS (Tempo, Swing, Master Scale)</div>
                <div className="p-2 bg-neutral-900 rounded border border-neutral-800 hover:border-emerald-500 cursor-pointer">&gt; [2] INSTRUMENT PRESETS & BENCH KITS</div>
                <div onClick={() => setF6SubView('TABLE_EDITOR')} className="p-2 bg-neutral-900 rounded border border-neutral-800 hover:border-emerald-500 cursor-pointer">&gt; [3] TABLE EDITOR (Sub-Step Sequencing & Micro-Timing Ticks)</div>
                <div onClick={() => setF6SubView('FX_CONFIG')} className="p-2 bg-neutral-900 rounded border border-neutral-800 hover:border-emerald-500 cursor-pointer">&gt; [4] FX PARAMETER CONFIG & PUNCH-IN MAPS</div>
                <div className="p-2 bg-neutral-900 rounded border border-neutral-800 hover:border-emerald-500 cursor-pointer">&gt; [5] SYSTEM & AUDIO INFO (iPad 9th Gen Audio Latency / 256ms)</div>
              </div>
            )}

            {f6SubView === 'PROJECT_SETTINGS' && (
              <div className="space-y-3 text-xs text-neutral-300">
                <div className="flex justify-between items-center bg-neutral-900 p-2 rounded">
                  <span>MASTER TEMPO (BPM)</span>
                  <input type="number" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} className="bg-neutral-800 text-emerald-400 px-2 py-1 rounded w-20 text-center border border-neutral-700" />
                </div>
                <div className="flex justify-between items-center bg-neutral-900 p-2 rounded">
                  <span>SWING AMOUNT</span>
                  <span className="text-emerald-400">50% (OFF)</span>
                </div>
              </div>
            )}

            {f6SubView === 'TABLE_EDITOR' && (
              <div className="flex-1 flex flex-col space-y-3 text-xs">
                <div className="flex justify-between items-center bg-neutral-900 p-2 rounded border border-neutral-800">
                  <span className="text-neutral-400">TABLE ID: 01 // SPEED: {tableSpeed} TICK/STEP</span>
                  <div className="space-x-2">
                    <button onClick={() => setTableSpeed(s => Math.max(1, s - 1))} className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded">-</button>
                    <button onClick={() => setTableSpeed(s => Math.min(8, s + 1))} className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded">+</button>
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
                      className={`grid grid-cols-5 py-1 px-1 rounded cursor-pointer border ${selectedTableRow === idx ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-neutral-900/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800'}`}
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

                <div className="bg-neutral-900 p-2 rounded border border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-400">NUDGE STEP {selectedTableRow} Ticks:</span>
                  <div className="space-x-2">
                    <button onClick={() => adjustTableTick(-1)} className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-700 font-bold">-1 TICK</button>
                    <button onClick={() => adjustTableTick(1)} className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-700 font-bold">+1 TICK</button>
                  </div>
                </div>
              </div>
            )}

            {f6SubView === 'FX_CONFIG' && (
              <div className="space-y-2 text-xs text-neutral-300">
                <div className="bg-neutral-900 p-2 rounded flex justify-between items-center">
                  <span>9th BTN PUNCH-IN FX MAP: DJFX LOOP</span>
                  <span className="text-emerald-400">RATE: 1/4 BEAT</span>
                </div>
                <div className="bg-neutral-900 p-2 rounded flex justify-between items-center">
                  <span>TAPE STOP DECAY TIME</span>
                  <span className="text-emerald-400">250ms</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. BOTTOM SOFT-KEYS NAVIGATION BAR */}
      <div className="bg-neutral-900 border-t border-emerald-900/50 p-2 flex justify-around items-center shrink-0">
        <button 
          onClick={() => { setActiveTab('F1_F2'); setF6SubView('MAIN'); }}
          className={`px-3 py-1 rounded font-bold ${activeTab === 'F1_F2' ? 'bg-emerald-600 text-black' : 'bg-neutral-800 text-emerald-400'}`}
        >
          [F1/F2] MULTI-VIEW{activeTab === 'F1_F2' ? '*' : ''}
        </button>
        <button 
          onClick={() => { setActiveTab('F3_MIXER'); setF6SubView('MAIN'); }}
          className={`px-3 py-1 rounded font-bold ${activeTab === 'F3_MIXER' ? 'bg-emerald-600 text-black' : 'bg-neutral-800 text-emerald-400'}`}
        >
          [F3] MIXER{activeTab === 'F3_MIXER' ? '*' : ''}
        </button>
        <button 
          onClick={() => { setActiveTab('F4_BENCH'); setF6SubView('MAIN'); }}
          className={`px-3 py-1 rounded font-bold ${activeTab === 'F4_BENCH' ? 'bg-emerald-600 text-black' : 'bg-neutral-800 text-emerald-400'}`}
        >
          [F4] BENCH{activeTab === 'F4_BENCH' ? '*' : ''}
        </button>
        <button 
          onClick={() => { setActiveTab('F5_SONG'); setF6SubView('MAIN'); }}
          className={`px-3 py-1 rounded font-bold ${activeTab === 'F5_SONG' ? 'bg-emerald-600 text-black' : 'bg-neutral-800 text-emerald-400'}`}
        >
          [F5] SONG{activeTab === 'F5_SONG' ? '*' : ''}
        </button>
        <button 
          onClick={() => { setActiveTab('F6_MENU'); }}
          className={`px-3 py-1 rounded font-bold ${activeTab === 'F6_MENU' ? 'bg-emerald-600 text-black' : 'bg-neutral-800 text-emerald-400'}`}
        >
          [F6] MENU{activeTab === 'F6_MENU' ? '*' : ''}
        </button>
      </div>

    </div>
  );
};

export default DualScreenWorkspace;
