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

interface SynthParams {
  waveform: OscillatorType;
  filterCutoff: number;
  filterRes: number;
  attack: number;
  decay: number;
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

  // BPM-Synced Playback Ticker (Auto-advances rows 0 to 63 when playing)
  useEffect(() => {
    if (!isPlaying) return;
    // Step interval based on BPM: (60 seconds / BPM / 4 steps per beat) * 1000 ms
    const stepInterval = (60000 / tempo) / 4;
    const timer = setInterval(() => {
      setCurrentRow(prev => (prev + 1) % 64);
    }, stepInterval);

    return () => clearInterval(timer);
  }, [isPlaying, tempo]);

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
        osc.type = synthParams.waveform;
        osc.frequency.setValueAtTime(padName.includes('BASS') ? 110 : 440, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(synthParams.filterCutoff, now);
        filter.Q.setValueAtTime(synthParams.filterRes, now);

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
          <span className="text-amber-400 font-bold tracking-wide">{isPlaying ? '▶ [PLAYING]' : lastTriggeredInfo}</span>
        </div>

        <div className="flex items-center space-x-2 z-10">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1 rounded border transition-all ${isPlaying ? 'bg-emerald-500 text-black border-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-neutral-800 border-neutral-700 text-emerald-400 hover:bg-neutral-700'}`}
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
                <span className={`px-2 py-0.5 rounded border text-[11px] ${isPlaying ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse font-bold' : 'text-emerald-400 bg-neutral-900 border-neutral-700'}`}>
                  {isPlaying ? '▶ LIVE PLAYING' : 'PAT: 01'}
                </span>
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
                  <span className="text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded border border-neutral-800
