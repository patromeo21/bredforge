import React, { useState, useEffect, useRef } from 'react';

type ThemeMode = 'default' | 'pink-arranger' | 'retro-synth' | 'monochrome';
type ViewId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface WorkspaceProps {
  projectName?: string;
  tempo?: number;
  initialTempo?: number;
}

export const DualScreenWorkspace: React.FC<WorkspaceProps> = ({
  projectName = 'BREDFORGE_M8_PROJ',
  tempo: propTempo,
  initialTempo = 128,
}) => {
  const [currentView, setCurrentView] = useState<ViewId>(1);
  const [theme, setTheme] = useState<ThemeMode>('default');
  const [tempo, setTempo] = useState<number>(propTempo ?? initialTempo);
  const [shiftActive, setShiftActive] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [selectedPad, setSelectedPad] = useState<number | null>(null);

  // Theme 8 override rule
  const activeTheme: ThemeMode = currentView === 8 ? 'pink-arranger' : theme;

  const themeTokens = {
    default: {
      bg: 'bg-[#0B0F19]',
      panel: 'bg-[#121826] border-[#00BAFF]/40',
      text: 'text-[#7BE0FF]',
      accent: 'text-[#00BAFF]',
      border: 'border-[#00BAFF]/60',
      highlight: 'bg-[#00BAFF]/20 text-[#7BE0FF]',
    },
    'pink-arranger': {
      bg: 'bg-[#FFA6C9]',
      panel: 'bg-[#FF8DAF] border-[#111111]',
      text: 'text-[#111111]',
      accent: 'text-[#FFFFFF]',
      border: 'border-[#111111]',
      highlight: 'bg-[#111111] text-[#FFA6C9]',
    },
    'retro-synth': {
      bg: 'bg-[#000000]',
      panel: 'bg-[#0A0A0A] border-[#FF2A2A]/50',
      text: 'text-[#FFFFFF]',
      accent: 'text-[#FF2A2A]',
      border: 'border-[#FF2A2A]',
      highlight: 'bg-[#FF2A2A] text-[#000000]',
    },
    monochrome: {
      bg: 'bg-[#FFFFFF]',
      panel: 'bg-[#F2F2F2] border-[#000000]',
      text: 'text-[#1A1A1A]',
      accent: 'text-[#000000]',
      border: 'border-[#000000]',
      highlight: 'bg-[#000000] text-[#FFFFFF]',
    },
  }[activeTheme];

  // Canvas Oscilloscope / Waveform ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = activeTheme === 'retro-synth' ? '#FF2A2A' : activeTheme === 'pink-arranger' ? '#111111' : '#00BAFF';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = canvas.width / 120;
      let x = 0;

      for (let i = 0; i < 120; i++) {
        const v = Math.sin(phase + i * 0.12) * (canvas.height / 3);
        const y = canvas.height / 2 + v;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
      phase += isPlaying ? 0.2 : 0.02;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, activeTheme]);

  const mutateVal = (val: number, min: number, max: number, step = 1, delta: number) => {
    return Math.max(min, Math.min(max, val + delta * step));
  };

  return (
    <div className="fixed inset-0 bg-[#05070A] flex items-center justify-center font-mono select-none p-2 md:p-6 overflow-hidden">
      
      {/* ASPECT RATIO HARDWARE DISPLAY SHELL */}
      <div className={`w-full max-w-6xl aspect-[16/10] ${themeTokens.bg} ${themeTokens.text} border-4 ${themeTokens.border} rounded-xl shadow-2xl flex flex-col overflow-hidden p-3 md:p-4 transition-colors duration-300`}>
        
        {/* GLOBAL TOP NAVIGATION & THEME SELECTOR BAR */}
        <div className={`flex items-center justify-between border-b ${themeTokens.border} pb-2 mb-2 text-xs shrink-0`}>
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-widest px-2 py-0.5 bg-black/30 rounded border border-current">[●] {projectName}</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((v) => (
                <button
                  key={v}
                  onClick={() => setCurrentView(v as ViewId)}
                  className={`px-2 py-0.5 rounded border transition-all font-bold ${currentView === v ? themeTokens.highlight : 'opacity-60 hover:opacity-100'}`}
                >
                  V{v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden md:inline">THEME:</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeMode)}
              className="bg-black/40 border border-current px-2 py-0.5 rounded text-xs outline-none cursor-pointer"
            >
              <option value="default">Default (Cyber)</option>
              <option value="pink-arranger">Pink Arranger</option>
              <option value="retro-synth">Retro Synth</option>
              <option value="monochrome">Monochrome</option>
            </select>
          </div>
        </div>

        {/* MAIN THREE-COLUMN WORKSPACE SHELL */}
        <div className="flex-1 flex gap-3 overflow-hidden">
          
          {/* LEFT COLUMN NAVIGATION CLUSTER */}
          <div className={`w-28 md:w-36 ${themeTokens.panel} border rounded-lg p-3 flex flex-col justify-between shrink-0 shadow-inner`}>
            <div>
              <div className="text-[10px] opacity-70 mb-2 tracking-wider font-bold">NAV CLUSTER</div>
              <div className="grid grid-cols-3 gap-1 mb-4 text-center">
                <div />
                <button className="p-2 bg-black/30 border border-current rounded hover:bg-white/10 active:scale-95">▲</button>
                <div />
                <button className="p-2 bg-black/30 border border-current rounded hover:bg-white/10 active:scale-95">◄</button>
                <button className="p-2 bg-black/30 border border-current rounded hover:bg-white/10 active:scale-95 font-bold text-[10px]">OK</button>
                <button className="p-2 bg-black/30 border border-current rounded hover:bg-white/10 active:scale-95">►</button>
                <div />
                <button className="p-2 bg-black/30 border border-current rounded hover:bg-white/10 active:scale-95">▼</button>
                <div />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShiftActive(!shiftActive)}
                className={`w-full py-1.5 rounded border text-xs font-bold transition-all ${shiftActive ? themeTokens.highlight : 'bg-black/20 hover:bg-black/40'}`}
              >
                SHIFT {shiftActive ? '[ON]' : ''}
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-full py-1.5 rounded border text-xs font-bold transition-all ${isPlaying ? 'bg-emerald-500 text-black font-bold' : 'bg-black/20'}`}
              >
                {isPlaying ? 'PLAYING' : 'STOPPED'}
              </button>
            </div>
          </div>

          {/* CENTER DYNAMIC VIEW RENDER AREA */}
          <div className={`flex-1 ${themeTokens.panel} border rounded-lg p-3 flex flex-col overflow-hidden shadow-lg relative`}>
            
            {/* VIEW 1: SAMPLE & RECORD SCREEN [SP FUSION HUB] */}
            {currentView === 1 && (
              <div className="flex-1 flex flex-col space-y-2 overflow-hidden text-xs">
                <div className="flex justify-between items-center bg-black/30 px-3 py-1 rounded border border-current font-bold">
                  <span>REC | SRC: EXT | VOL: 94% | ARM: READY | SONG: 01</span>
                  <span className="text-red-500 animate-pulse font-bold">● LIVE WAV</span>
                </div>
                
                <div className="h-24 bg-black/80 border border-current rounded relative flex items-center px-2">
                  <canvas ref={canvasRef} width={600} height={80} className="w-full h-full opacity-90" />
                  <div className="absolute inset-y-0 left-1/3 w-0.5 bg-red-500 shadow-[0_0_8px_red]" />
                </div>

                <div className="grid grid-cols-5 gap-1 text-[11px]">
                  {['SLICE: 01', 'PLAY: ON', 'START: 0.00', 'LOOP: OFF', 'LEN: 2.0s', 'DET: +00', 'DEG: 02', 'FLT: LPF', 'CUT: 4kHz', 'RES: 04'].map((p, i) => (
                    <div key={i} className="bg-black/30 p-1.5 rounded border border-current flex justify-between">
                      <span className="opacity-70">{p.split(':')[0]}</span>
                      <span className="font-bold">{p.split(':')[1]}</span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 grid grid-cols-4 gap-1.5 pt-1">
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPad(idx + 1)}
                      className={`border rounded flex flex-col items-center justify-center p-1 transition-all ${selectedPad === idx + 1 ? themeTokens.highlight : 'bg-black/20 hover:bg-black/40'}`}
                    >
                      <span className="text-[9px] opacity-70">PAD {idx + 1}</span>
                      <span className="font-bold">SLICE_{String(idx + 1).padStart(2, '0')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 2: EFFECT SETTINGS SCREEN */}
            {currentView === 2 && (
              <div className="flex-1 flex flex-col space-y-3 overflow-y-auto text-xs">
                <div className="font-bold border-b border-current pb-1">EFFECT PROCESSORS // MODFX, DELAY, REVERB</div>
                
                {[
                  { group: 'MODFX', params: [['MOD TYPE', 'CHORUS'], ['RATE', '1.4Hz'], ['DEPTH', '65%'], ['MIX', '40%']] },
                  { group: 'DELAY', params: [['TIME L:R', '3/16'], ['FEEDBACK', '42%'], ['LPF CUT', '6.5kHz'], ['MIX', '30%']] },
                  { group: 'REVERB', params: [['ROOM SIZE', '85%'], ['DAMPING', '2.4kHz'], ['DECAY', '3.8s'], ['MIX', '25%']] },
                ].map((sec, idx) => (
                  <div key={idx} className="bg-black/30 p-3 rounded border border-current space-y-2">
                    <div className="font-bold opacity-80">&gt; {sec.group} PROCESSOR</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {sec.params.map(([k, v], i) => (
                        <div key={i} className="bg-black/40 p-2 rounded border border-current flex flex-col justify-between space-y-1">
                          <span className="text-[10px] opacity-70">{k}</span>
                          <div className="flex justify-between items-center font-bold">
                            <span>{v}</span>
                            <span className="text-[10px] px-1 bg-white/10 rounded">HEX: 8F</span>
                          </div>
                          <div className="w-full h-1 bg-black/60 rounded overflow-hidden">
                            <div className="w-3/4 h-full bg-current" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 3: PROJECT OVERVIEW SCREEN */}
            {currentView === 3 && (
              <div className="flex-1 flex flex-col space-y-3 overflow-y-auto text-xs">
                <div className="font-bold border-b border-current pb-1">PROJECT MASTER & DIRECTORY CONFIGURATION</div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { label: 'TEMPO', val: `${tempo} BPM`, action: () => setTempo(t => mutateVal(t, 60, 200, 1, 1)) },
                    { label: 'TRANSPOSE', val: '+00 SEMI', action: () => {} },
                    { label: 'GROOVE', val: 'SP-1200 64%', action: () => {} },
                    { label: 'SCALE', val: 'CHROMATIC', action: () => {} },
                    { label: 'LIVE QUANTIZ', val: '1/16 STEP', action: () => {} },
                  ].map((item, i) => (
                    <div key={i} onClick={item.action} className="bg-black/30 p-2.5 rounded border border-current cursor-pointer hover:bg-white/5">
                      <div className="text-[10px] opacity-70">{item.label}</div>
                      <div className="font-bold mt-1 text-sm">{item.val}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 flex-1">
                  {['MIDI CONFIG', 'SYSTEM SETTINGS', 'ROUTING MAPPINGS'].map((title, i) => (
                    <div key={i} className="bg-black/30 p-3 rounded border border-current flex flex-col justify-between">
                      <span className="font-bold">{title}</span>
                      <div className="space-y-1 text-[11px] opacity-80 my-2">
                        <div>CH 01: OMNI IN</div>
                        <div>CLK: INTERNAL</div>
                        <div>SYNC: MASTER</div>
                      </div>
                      <button className="py-1 bg-black/40 border border-current rounded text-[10px] font-bold">EDIT PORT</button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between gap-2 pt-1">
                  {['RENDER BUNDLE', 'PHRASES (64)', 'INST / TBL', 'VIEW INST. POOL'].map((btn, i) => (
                    <button key={i} className="flex-1 py-2 bg-black/40 hover:bg-black/60 border border-current rounded font-bold text-center">
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: AUDIO MIXER LEVEL SCREEN */}
            {currentView === 4 && (
              <div className="flex-1 flex flex-col space-y-3 overflow-hidden text-xs">
                <div className="h-6 bg-black/80 border border-current rounded flex items-center px-2">
                  <canvas ref={canvasRef} width={600} height={20} className="w-full h-full opacity-80" />
                </div>

                <div className="flex-1 grid grid-cols-9 gap-2">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="bg-black/30 border border-current rounded p-2 flex flex-col items-center justify-between">
                      <span className="font-bold text-[10px]">T{idx + 1}</span>
                      <div className="flex-1 w-4 bg-black/60 rounded my-2 relative overflow-hidden flex flex-col justify-end">
                        <div className="w-full h-3/4 bg-gradient-to-t from-emerald-500 via-amber-400 to-orange-500 rounded-b" />
                      </div>
                      <div className="space-y-0.5 text-[9px] text-center w-full">
                        <div className="bg-black/40 rounded px-0.5">EQ</div>
                        <div className="bg-black/40 rounded px-0.5">DB</div>
                        <div className="bg-black/40 rounded px-0.5">MX</div>
                      </div>
                    </div>
                  ))}

                  {/* MASTER BUS */}
                  <div className="bg-black/50 border border-current rounded p-2 flex flex-col items-center justify-between shadow">
                    <span className="font-bold text-[10px] text-red-400">MST</span>
                    <div className="flex-1 w-5 bg-black/80 rounded my-2 relative overflow-hidden flex flex-col justify-end">
                      <div className="w-full h-5/6 bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500 rounded-b animate-pulse" />
                    </div>
                    <span className="text-[9px] font-bold">0.0dB</span>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: TABLE AUTOMATION LAYER */}
            {currentView === 5 && (
              <div className="flex-1 flex flex-col space-y-2 overflow-hidden text-xs">
                <div className="flex justify-between items-center font-bold border-b border-current pb-1">
                  <span>TABLE AUTOMATION LAYER (HEX 00 TO 0F)</span>
                  <span>SPEED: 1 TICK</span>
                </div>
                <div className="grid grid-cols-5 text-[10px] opacity-70 border-b border-current pb-1 font-bold">
                  <span>INDEX ROW</span><span>VOL MULT (V)</span><span>MACRO FX1</span><span>MACRO FX2</span><span>MACRO FX3</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {Array.from({ length: 16 }).map((_, r) => {
                    const hexIdx = r.toString(16).toUpperCase();
                    return (
                      <div
                        key={r}
                        onClick={() => setSelectedRow(r)}
                        className={`grid grid-cols-5 py-1 px-2 rounded cursor-pointer border ${selectedRow === r ? themeTokens.highlight : 'bg-black/20 hover:bg-black/40 border-transparent'}`}
                      >
                        <span className="font-bold">TBL_{hexIdx}</span>
                        <span>FF</span>
                        <span>CUT (+{r * 4})</span>
                        <span>RES (0{r})</span>
                        <span>---</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 6: PHRASE SEQUENCER GRID */}
            {currentView === 6 && (
              <div className="flex-1 flex flex-col space-y-2 overflow-hidden text-xs">
                <div className="flex justify-between items-center font-bold border-b border-current pb-1">
                  <span>PHRASE SEQUENCER GRID (LINES 00 TO 0F)</span>
                  <span className="text-[#00F5D4] font-bold">ACTIVE SELECTION: ROW {selectedRow}</span>
                </div>
                <div className="grid grid-cols-6 text-[10px] opacity-70 border-b border-current pb-1 font-bold">
                  <span>LINE</span><span>PITCH (N)</span><span>VEL (V)</span><span>INST (I)</span><span>FX1</span><span>FX2</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {Array.from({ length: 16 }).map((_, r) => (
                    <div
                      key={r}
                      onClick={() => setSelectedRow(r)}
                      className={`grid grid-cols-6 py-1 px-2 rounded cursor-pointer border ${selectedRow === r ? 'border-[#00F5D4] bg-[#00F5D4]/20 font-bold' : 'bg-black/20 hover:bg-black/40 border-transparent'}`}
                    >
                      <span>{String(r).padStart(2, '0')}</span>
                      <span>{r % 2 === 0 ? 'C-4' : 'G-4'}</span>
                      <span>{r % 3 === 0 ? 'FF' : 'A0'}</span>
                      <span>01</span>
                      <span>TSP</span>
                      <span>---</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 7: SYNTH INSTRUMENT MATRIX */}
            {currentView === 7 && (
              <div className="flex-1 flex flex-col space-y-3 overflow-y-auto text-xs">
                <div className="font-bold border-b border-current pb-1">QUAD-OSCILLATOR SYNTH MATRIX & ENGINE</div>
                
                <div className="grid grid-cols-4 gap-2">
                  {['OSC A', 'OSC B', 'OSC C', 'OSC D'].map((osc, i) => (
                    <div key={i} className="bg-black/30 p-2.5 rounded border border-current space-y-1">
                      <div className="font-bold">{osc}</div>
                      <div className="text-[10px] opacity-70">WAVE: {i === 0 ? 'SAW' : i === 1 ? 'SQR' : i === 2 ? 'TRI' : 'SIN'}</div>
                      <div className="text-[10px] opacity-70">RATIO: 1.{i}x</div>
                      <div className="w-full h-1 bg-black/60 rounded mt-2">
                        <div className="w-2/3 h-full bg-current" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-black/30 p-3 rounded border border-current space-y-2">
                  <div className="font-bold opacity-80">&gt; GRANULAR ENGINE PARAMETERS</div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-[11px]">
                    {['MOD 1: 50%', 'MOD 2: 20%', 'FILTER: LPF', 'CUTOFF: 4.2k', 'RES: 08', 'PAN: CTR', 'DRY: 80%', 'CHO: 15%', 'DELAY: 25%', 'REV: 40%'].map((param, i) => (
                      <div key={i} className="bg-black/40 p-2 rounded border border-current flex flex-col justify-between">
                        <span className="text-[10px] opacity-70">{param.split(':')[0]}</span>
                        <span className="font-bold mt-1">{param.split(':')[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 8: SONG ARRANGEMENT GRID (FORCES PINK-ARRANGER THEME) */}
            {currentView === 8 && (
              <div className="flex-1 flex flex-col space-y-2 overflow-hidden text-xs">
                <div className="flex justify-between items-center font-bold border-b border-current pb-1">
                  <span>SONG ARRANGEMENT GRID // 8-LANE TRACK PLAYGROUND</span>
                  <span className="px-2 py-0.5 bg-white text-black rounded font-bold">THEME: PINK-ARRANGER ACTIVE</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {Array.from({ length: 8 }).map((_, lane) => (
                    <div key={lane} className="flex items-center space-x-2 bg-black/20 p-2 rounded border border-current">
                      <span className="w-16 font-bold text-[11px]">LANE {lane + 1}</span>
                      <div className="flex-1 grid grid-cols-8 gap-1">
                        {Array.from({ length: 8 }).map((_, col) => {
                          const isActive = (lane + col) % 3 === 0;
                          return (
                            <div
                              key={col}
                              className={`h-7 rounded flex items-center justify-center font-bold text-[10px] border ${isActive ? 'bg-white text-black border-black shadow' : 'bg-black/20 opacity-40 border-current'}`}
                            >
                              {isActive ? `PAT_${lane}${col}` : '---'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN STATUS HUD */}
          <div className={`w-32 md:w-44 ${themeTokens.panel} border rounded-lg p-3 flex flex-col justify-between shrink-0 shadow-inner`}>
            <div>
              <div className="text-[10px] opacity-70 mb-2 font-bold tracking-wider">STATUS HUD</div>
              <div className="space-y-2 text-[11px]">
                <div className="bg-black/30 p-1.5 rounded border border-current">
                  <div className="opacity-70 text-[9px]">TEMPO TICKER</div>
                  <div className="font-bold text-sm">T►{tempo}</div>
                </div>

                <div className="bg-black/30 p-1.5 rounded border border-current">
                  <div className="opacity-70 text-[9px]">BATTERY / SYS</div>
                  <div className="font-bold">98% [AC]</div>
                </div>

                <div className="bg-black/30 p-2 rounded border border-current space-y-1">
                  <div className="opacity-70 text-[9px]">8-LANE STEP ARRAY</div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((lane) => (
                      <div key={lane} className={`py-0.5 rounded text-[10px] font-bold ${lane === 1 || lane === 3 ? themeTokens.highlight : 'bg-black/40 opacity-50'}`}>
                        {lane}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="bg-black/30 p-2 rounded border border-current">
                <div className="opacity-70 text-[9px] mb-1">PIANO-ROLL MINI</div>
                <div className="h-10 bg-black/80 rounded relative flex items-center overflow-hidden">
                  <div className="w-full h-2 bg-current opacity-40 absolute" />
                  <div className="w-3 h-6 bg-red-500 rounded absolute left-4" />
                  <div className="w-3 h-4 bg-emerald-400 rounded absolute left-12" />
                </div>
              </div>

              <div className="bg-black/30 p-2 rounded border border-current text-center">
                <div className="opacity-70 text-[9px] mb-1">NAV COL (S C P I T M)</div>
                <div className="flex justify-around font-bold text-xs">
                  <span className={currentView === 8 ? 'underline' : 'opacity-60'}>S</span>
                  <span>C</span>
                  <span className={currentView === 6 ? 'underline' : 'opacity-60'}>P</span>
                  <span className={currentView === 7 ? 'underline' : 'opacity-60'}>I</span>
                  <span className={currentView === 5 ? 'underline' : 'opacity-60'}>T</span>
                  <span className={currentView === 4 ? 'underline' : 'opacity-60'}>M</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DualScreenWorkspace;
