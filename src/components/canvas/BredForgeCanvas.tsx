// ============================================================================
// STAGE D - MINIATURE-MASTER CORE AUDIO COUPLING & LIQUID RESIZING OVERHAUL (BredForgeCanvas.tsx)
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrackerState, TrackerStep, PhraseBlock, ProjectStateSchema, SPFxType, createInitialTrackerState, TRACKER_FX1_COMMANDS } from '../../services/tracker/TrackerState';
import { AudioGraph } from '../../services/audio/AudioGraph';

export interface BredForgeCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  audioCtx: AudioContext | null;
  sampleManager: any;
  sampleLoader: any;
  patternState?: any;
  activeBank?: number | string;
  activePad?: number | null;
  isPlaying?: boolean;
  isRecording?: boolean;
  bpm?: number;
  onPlay?: () => void;
  onStop: () => void;
  onPadTrigger?: (bankIndex: number, padIndex: number) => void;
  onAudioUpload?: (file: File) => void;
  audioGraph?: AudioGraph;
  initialProjectState?: ProjectStateSchema;
  currentBpm?: number;
  onBpmChange?: (bpm: number) => void;
  onPlayToggle?: () => void;
  onRecordToggle?: () => void;
  [key: string]: any;
}

type ViewMode = 'SONG' | 'CHAIN' | 'PHRASE';
type ThemeMode = 'retro' | 'cyber' | 'amber';
type ColumnType = 'NOTE' | 'VOL' | 'FX1' | 'FX2';
type ActiveFocusArea = 'TRACKER' | 'WAVEFORM';

export const BredForgeCanvas: React.FC<BredForgeCanvasProps> = ({
  audioCtx,
  sampleManager,
  sampleLoader,
  patternState,
  activeBank = 0,
  activePad = null,
  isPlaying = false,
  isRecording = false,
  bpm = 120,
  onPlay,
  onStop,
  onPadTrigger,
  onAudioUpload,
  audioGraph,
  initialProjectState,
  currentBpm = 120,
  onBpmChange,
  onPlayToggle,
  onRecordToggle,
  ...restProps
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('PHRASE');
  const [themeMode, setThemeMode] = useState<ThemeMode>('retro');
  const [activePhraseKey, setActivePhraseKey] = useState<string>('01');
  
  // Dynamic 64-pad Bank Offset State (A=0, B=16, C=32, D=48)
  const [activeBankOffset, setActiveBankOffset] = useState<number>(0);
  
  // Transport State Controls
  const [isPlayingState, setIsPlayingState] = useState<boolean>(isPlaying);
  const [isRecordingState, setIsRecordingState] = useState<boolean>(isRecording);

  // Focus Area & Dual/Triple D-Pad States
  const [activeFocusArea, setActiveFocusArea] = useState<ActiveFocusArea>('TRACKER');
  const [waveformZoom, setWaveformZoom] = useState<number>(1.0);
  const [waveformPan, setWaveformPan] = useState<number>(0.0);
  const [secondaryPitchOffset, setSecondaryPitchOffset] = useState<number>(0);

  // Multi-column M8 tracking cursor state & Playhead Tick Row
  const [cursorRow, setCursorRow] = useState<number>(0);
  const [cursorCol, setCursorCol] = useState<ColumnType>('NOTE');
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [isHoldActive, setIsHoldActive] = useState<boolean>(false);
  const [activePlayheadRow, setActivePlayheadRow] = useState<number>(-1);

  // Sample Waveform & FX Inspector States
  const [sampleStartPoint, setSampleStartPoint] = useState<number>(0.0);
  const [sampleEndPoint, setSampleEndPoint] = useState<number>(1.0);
  const [satDrive, setSatDrive] = useState<number>(4.0);
  const [echoTime, setEchoTime] = useState<number>(0.375);
  const [djfxAmount, setDjfxAmount] = useState<number>(0.25);

  const [projectState, setProjectState] = useState<ProjectStateSchema>(
    initialProjectState || createInitialTrackerState()
  );

  const [activePadStates, setActivePadStates] = useState<boolean[]>(Array(16).fill(false));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Theme Color Configurations
  const themes = {
    retro: {
      bg: '#1a1816',
      panel: '#26221e',
      border: '#3d352e',
      text: '#d4a373',
      textBright: '#faedcd',
      accent: '#bc6c25',
      accentGlow: 'rgba(188, 108, 37, 0.4)',
      padBg: '#332c25',
      padActive: '#dda15e',
      font: 'monospace',
    },
    cyber: {
      bg: '#090d16',
      panel: '#111827',
      border: '#1f2937',
      text: '#38bdf8',
      textBright: '#e0f2fe',
      accent: '#06b6d4',
      accentGlow: 'rgba(6, 182, 212, 0.5)',
      padBg: '#1e293b',
      padActive: '#38bdf8',
      font: 'monospace',
    },
    amber: {
      bg: '#120d08',
      panel: '#1f150c',
      border: '#382514',
      text: '#f59e0b',
      textBright: '#fef3c7',
      accent: '#d97706',
      accentGlow: 'rgba(217, 119, 6, 0.5)',
      padBg: '#2a1b0e',
      padActive: '#f59e0b',
      font: 'monospace',
    },
  };

  const currentTheme = themes[themeMode];

  // Active Ticker Loop: Synchronize Playhead Row with Play State
  useEffect(() => {
    let tickerInterval: number | null = null;
    if (isPlayingState) {
      let currentStep = 0;
      const intervalMs = (60000 / currentBpm) / 4; // 16th note timing
      tickerInterval = window.setInterval(() => {
        setActivePlayheadRow(currentStep);
        setCursorRow(currentStep);
        currentStep = (currentStep + 1) % 16;
      }, intervalMs);
    } else {
      setActivePlayheadRow(-1);
    }
    return () => {
      if (tickerInterval !== null) clearInterval(tickerInterval);
    };
  }, [isPlayingState, currentBpm]);

  // RequestAnimationFrame 60fps UI Frame Proxy Draw Loop & Authentic Waveform Renderer
  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = currentTheme.panel;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.strokeStyle = currentTheme.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let x = 0; x < canvas.width; x += 40) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
          }
          for (let y = 0; y < canvas.height; y += 40) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
          }
          ctx.stroke();
        }
      }

      // Render Authentic Waveform Transients from sampleManager buffers if available
      const wfCanvas = waveformCanvasRef.current;
      if (wfCanvas) {
        const wfCtx = wfCanvas.getContext('2d');
        if (wfCtx) {
          wfCtx.clearRect(0, 0, wfCanvas.width, wfCanvas.height);
          wfCtx.fillStyle = currentTheme.bg;
          wfCtx.fillRect(0, 0, wfCanvas.width, wfCanvas.height);

          wfCtx.strokeStyle = currentTheme.accent;
          wfCtx.lineWidth = 2;
          wfCtx.beginPath();

          const sliceWidth = wfCanvas.width / 100;
          let xCoord = 0;

          // Check sampleManager for active buffer or render realistic transient waveform
          const activeBuffer = sampleManager?.getActiveBuffer?.() || null;
          if (activeBuffer && typeof activeBuffer.getChannelData === 'function') {
            const rawData = activeBuffer.getChannelData(0);
            const stepSize = Math.max(1, Math.floor(rawData.length / 100));
            for (let i = 0; i < 100; i++) {
              const sampleVal = rawData[i * stepSize] || 0;
              const yCoord = (wfCanvas.height / 2) + (sampleVal * (wfCanvas.height / 2) * waveformZoom) + (waveformPan * 20);
              if (i === 0) wfCtx.moveTo(xCoord, yCoord);
              else wfCtx.lineTo(xCoord, yCoord);
              xCoord += sliceWidth;
            }
          } else {
            // Fallback synthetic transient waveform
            for (let i = 0; i < 100; i++) {
              const synthVal = Math.sin(i * 0.2 + waveformPan * 5) * Math.cos(i * 0.05) * 0.8;
              const yCoord = (wfCanvas.height / 2) + (synthVal * (wfCanvas.height / 2) * waveformZoom);
              if (i === 0) wfCtx.moveTo(xCoord, yCoord);
              else wfCtx.lineTo(xCoord, yCoord);
              xCoord += sliceWidth;
            }
          }
          wfCtx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentTheme, waveformZoom, waveformPan, sampleManager]);

  // Sequencer Nav Diamond (Handles Column and Row Navigation)
  const handleSequencerNav = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const columns: ColumnType[] = ['NOTE', 'VOL', 'FX1', 'FX2'];
    if (viewMode === 'PHRASE') {
      if (direction === 'UP') {
        setCursorRow((prev) => Math.max(0, prev - 1));
      } else if (direction === 'DOWN') {
        setCursorRow((prev) => Math.min(15, prev + 1));
      } else if (direction === 'LEFT') {
        setCursorCol((prev) => {
          const idx = columns.indexOf(prev);
          return idx > 0 ? columns[idx - 1] : columns[0];
        });
      } else if (direction === 'RIGHT') {
        setCursorCol((prev) => {
          const idx = columns.indexOf(prev);
          return idx < columns.length - 1 ? columns[idx + 1] : columns[columns.length - 1];
        });
      }
    }
  }, [viewMode]);

  // Waveform HUD Diamond (Handles Zoom Magnification & Pan Scrolling)
  const handleWaveformNav = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (direction === 'UP') {
      setWaveformZoom((prev) => Math.min(4.0, prev + 0.25));
    } else if (direction === 'DOWN') {
      setWaveformZoom((prev) => Math.max(1.0, prev - 0.25));
    } else if (direction === 'LEFT') {
      setWaveformPan((prev) => Math.max(-1.0, prev - 0.1));
    } else if (direction === 'RIGHT') {
      setWaveformPan((prev) => Math.min(1.0, prev + 0.1));
    }
  }, []);

  // Pitch / Marker Diamond (Handles Pitch Fine-Tuning & Marker Nudges)
  const handlePitchMarkerNav = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (direction === 'UP') {
      setSecondaryPitchOffset((prev) => Math.min(12, prev + 1));
    } else if (direction === 'DOWN') {
      setSecondaryPitchOffset((prev) => Math.max(-12, prev - 1));
    } else if (direction === 'LEFT') {
      setSampleStartPoint((prev) => Math.max(0.0, prev - 0.05));
    } else if (direction === 'RIGHT') {
      setSampleEndPoint((prev) => Math.min(1.0, prev + 0.05));
    }
  }, []);

  // Handle Dynamic 64-Pad Matrix Presses & High-Priority Hardware Auditioning
  const handlePadPress = useCallback((padIndex: number) => {
    const absolutePadIndex = padIndex + activeBankOffset;

    setActivePadStates((prev) => {
      const next = [...prev];
      next[padIndex] = true;
      return next;
    });

    setTimeout(() => {
      setActivePadStates((prev) => {
        const next = [...prev];
        next[padIndex] = false;
        return next;
      });
    }, 120);

    const bankIndex = Math.floor(activeBankOffset / 16);
    if (onPadTrigger) {
      onPadTrigger(bankIndex, padIndex);
    }

    // Hardware preview audition trigger
    if (sampleManager && typeof sampleManager.triggerPad === 'function') {
      try {
        sampleManager.triggerPad(bankIndex, padIndex);
      } catch (err) {
        console.warn("SampleManager audition trigger error:", err);
      }
    }

    if (audioGraph) {
      const hexId = absolutePadIndex.toString(16).toUpperCase().padStart(2, '0');
      const padConfig = audioGraph.getPadConfig(hexId);
      if (padConfig && padConfig.fxType !== 'bypass') {
        audioGraph.punchInEffect(padConfig.fxType, 0.5);
      }
    }

    if (isEditMode && viewMode === 'PHRASE') {
      setProjectState((prevState) => {
        const phrase = prevState.phrases[activePhraseKey] || Array.from({ length: 16 }, (_, i) => ({
          step: i + 1, padId: null, vol: 1.0, fxType: 'bypass', fxParam: null
        }));

        const updatedPhrase = phrase.map((stepItem) => {
          if (stepItem.step === cursorRow + 1) {
            if (cursorCol === 'NOTE') {
              return { ...stepItem, padId: absolutePadIndex };
            } else if (cursorCol === 'VOL') {
              return { ...stepItem, vol: Math.min(1.0, (padIndex + 1) / 16.0) };
            } else if (cursorCol === 'FX1') {
              const commandKey = `X${padIndex < 10 ? '0' + padIndex : padIndex.toString(16).toUpperCase()}`;
              const resolvedFx: SPFxType = padIndex < 7 ? (TRACKER_FX1_COMMANDS[commandKey as keyof typeof TRACKER_FX1_COMMANDS] || 'bypass') : 'bypass';
              return { ...stepItem, fxType: resolvedFx };
            } else if (cursorCol === 'FX2') {
              return { ...stepItem, fxParam: (padIndex / 15.0) * 10.0 };
            }
          }
          return stepItem;
        });

        return {
          ...prevState,
          phrases: {
            ...prevState.phrases,
            [activePhraseKey]: updatedPhrase
          },
          timestamp: Date.now()
        };
      });
    }
  }, [audioGraph, isEditMode, viewMode, activePhraseKey, cursorRow, cursorCol, onPadTrigger, activeBankOffset, sampleManager]);

  const currentPhraseBlock: PhraseBlock = projectState.phrases[activePhraseKey] || Array.from({ length: 16 }, (_, i) => ({
    step: i + 1,
    padId: null,
    vol: 1.0,
    fxType: 'bypass',
    fxParam: null
  }));

  // Transport Click Handlers
  const handlePlayClick = () => {
    const nextState = !isPlayingState;
    setIsPlayingState(nextState);
    if (onPlayToggle) {
      onPlayToggle();
    } else if (onPlay && nextState) {
      onPlay();
    }
  };

  const handleStopClick = () => {
    setIsPlayingState(false);
    setIsRecordingState(false);
    setCursorRow(0);
    setActivePlayheadRow(-1);
    onStop();
  };

  const handleRecordClick = () => {
    const nextState = !isRecordingState;
    setIsRecordingState(nextState);
    if (onRecordToggle) {
      onRecordToggle();
    }
  };

  return (
    <div
      {...restProps}
      className="w-screen h-screen overflow-hidden flex flex-col p-3 bg-neutral-900 select-none box-border"
      style={{
        backgroundColor: currentTheme.bg,
        color: currentTheme.text,
        fontFamily: currentTheme.font,
        ...restProps.style,
      }}
    >
      {/* HEADER TOP BAR & VIEW SELECTORS */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b-2" style={{ borderColor: currentTheme.border }}>
        <div className="flex gap-2">
          {(['SONG', 'CHAIN', 'PHRASE'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                backgroundColor: viewMode === mode ? currentTheme.accent : currentTheme.panel,
                color: viewMode === mode ? currentTheme.textBright : currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                padding: '6px 14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '4px',
                boxShadow: viewMode === mode ? `0 0 10px ${currentTheme.accentGlow}` : 'none',
              }}
            >
              [{mode}]
            </button>
          ))}
        </div>

        {/* DYNAMIC 64-PAD BANK SELECTORS ([A]=0, [B]=16, [C]=32, [D]=48) */}
        <div className="flex gap-1">
          {[
            { label: 'A', offset: 0 },
            { label: 'B', offset: 16 },
            { label: 'C', offset: 32 },
            { label: 'D', offset: 48 },
          ].map((bank) => {
            const isActiveBank = activeBankOffset === bank.offset;
            return (
              <button
                key={bank.label}
                onClick={() => setActiveBankOffset(bank.offset)}
                style={{
                  backgroundColor: isActiveBank ? currentTheme.accent : currentTheme.panel,
                  color: isActiveBank ? currentTheme.textBright : currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  padding: '5px 10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                [{bank.label} {bank.offset.toString(16).toUpperCase()}-{(bank.offset + 15).toString(16).toUpperCase()}]
              </button>
            );
          })}
        </div>

        {/* THEME & ACTIVE TRANSPORT CONTROLS */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {(['retro', 'cyber', 'amber'] as ThemeMode[]).map((t) => (
              <button
                key={t}
                onClick={() => setThemeMode(t)}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  backgroundColor: themeMode === t ? currentTheme.text : currentTheme.panel,
                  color: themeMode === t ? currentTheme.bg : currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePlayClick}
              style={{
                backgroundColor: isPlayingState ? '#22c55e' : currentTheme.panel,
                color: isPlayingState ? '#000' : currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                padding: '5px 12px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {isPlayingState ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              onClick={handleStopClick}
              style={{
                backgroundColor: currentTheme.panel,
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                padding: '5px 12px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              STOP
            </button>
            <button
              onClick={handleRecordClick}
              style={{
                backgroundColor: isRecordingState ? '#ef4444' : currentTheme.panel,
                color: isRecordingState ? '#fff' : currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                padding: '5px 12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                animation: isRecordingState ? 'pulse 1s infinite' : 'none',
              }}
            >
              {isRecordingState ? 'REC [ON]' : 'REC'}
            </button>
          </div>
        </div>
      </div>

      {/* CENTRAL LIQUID SPLIT WORKSPACE */}
      <div className="flex flex-1 gap-3 min-h-0">
        
        {/* LEFT COLUMN: M8 16-ROW SEQUENCER GRID & AUTHENTIC WAVEFORM HUD */}
        <div className="flex-[3] flex flex-col gap-3 min-h-0">
          
          {/* M8 16-ROW TRACKER GRID */}
          <div 
            onClick={() => setActiveFocusArea('TRACKER')}
            style={{ 
              flex: 2, 
              backgroundColor: currentTheme.panel, 
              border: `2px solid ${activeFocusArea === 'TRACKER' ? currentTheme.accent : currentTheme.border}`, 
              borderRadius: '6px', 
              padding: '10px', 
              display: 'flex', 
              flexDirection: 'column', 
              position: 'relative', 
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            <div className="flex justify-between items-center mb-2 pb-1 border-b" style={{ borderColor: currentTheme.border }}>
              <span className="text-xs font-bold">PHRASE SEQUENCE [{activePhraseKey}] - ACTIVE COL: [{cursorCol}] (FOCUS: TRACKER)</span>
              <div className="flex gap-2 items-center">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsHoldActive(!isHoldActive); }}
                  style={{
                    backgroundColor: isHoldActive ? '#eab308' : currentTheme.bg,
                    color: isHoldActive ? '#000' : currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  HOLD: {isHoldActive ? 'LOCKED' : 'OFF'}
                </button>
                <span className="text-xs">EDIT: {isEditMode ? 'ON' : 'OFF'}</span>
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto">
              <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 70px 90px 90px', backgroundColor: currentTheme.border, padding: '5px', fontWeight: 'bold', fontSize: '11px' }}>
                <div>STEP</div>
                <div style={{ color: cursorCol === 'NOTE' ? currentTheme.accent : 'inherit' }}>NOTE</div>
                <div style={{ color: cursorCol === 'VOL' ? currentTheme.accent : 'inherit' }}>VOL</div>
                <div style={{ color: cursorCol === 'FX1' ? currentTheme.accent : 'inherit' }}>FX1</div>
                <div style={{ color: cursorCol === 'FX2' ? currentTheme.accent : 'inherit' }}>FX2</div>
              </div>

              {currentPhraseBlock.map((stepItem, idx) => {
                const isSelectedRow = cursorRow === idx;
                const isPlayheadRow = activePlayheadRow === idx;
                return (
                  <div
                    key={stepItem.step}
                    onClick={(e) => { e.stopPropagation(); setCursorRow(idx); }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '50px 1fr 70px 90px 90px',
                      padding: '5px',
                      backgroundColor: isPlayheadRow ? 'rgba(34, 197, 94, 0.25)' : isSelectedRow ? 'rgba(255,255,255,0.08)' : 'transparent',
                      borderBottom: `1px solid ${currentTheme.border}`,
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: isPlayheadRow ? '#22c55e' : isSelectedRow ? currentTheme.textBright : currentTheme.text,
                      fontWeight: isPlayheadRow ? 'bold' : 'normal',
                    }}
                  >
                    <div>{isPlayheadRow ? '▶ ' : ''}{String(stepItem.step).padStart(2, '0')}</div>
                    <div style={{ fontWeight: isSelectedRow && cursorCol === 'NOTE' ? 'bold' : 'normal' }}>
                      {TrackerState.getNoteNameFromPadId(stepItem.padId)}
                    </div>
                    <div style={{ fontWeight: isSelectedRow && cursorCol === 'VOL' ? 'bold' : 'normal' }}>
                      {stepItem.vol.toFixed(1)}
                    </div>
                    <div style={{ fontWeight: isSelectedRow && cursorCol === 'FX1' ? 'bold' : 'normal' }}>
                      {stepItem.fxType}
                    </div>
                    <div style={{ fontWeight: isSelectedRow && cursorCol === 'FX2' ? 'bold' : 'normal' }}>
                      {stepItem.fxParam !== null ? stepItem.fxParam.toFixed(2) : '---'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AUTHENTIC CANVAS DATA-BASED WAVEFORM HUD & AUDIO IMPORT */}
          <div 
            onClick={() => setActiveFocusArea('WAVEFORM')}
            style={{ 
              flex: 1, 
              backgroundColor: currentTheme.panel, 
              border: `2px solid ${activeFocusArea === 'WAVEFORM' ? currentTheme.accent : currentTheme.border}`, 
              borderRadius: '6px', 
              padding: '10px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold">AUTHENTIC WAVEFORM HUD (FOCUS: WAVEFORM | ZOOM: {waveformZoom.toFixed(2)}x | PAN: {waveformPan.toFixed(2)})</span>
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onAudioUpload) {
                      onAudioUpload(file);
                    }
                  }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  style={{
                    backgroundColor: currentTheme.accent,
                    color: currentTheme.textBright,
                    border: `1px solid ${currentTheme.border}`,
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                >
                  IMPORT AUDIO
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black border rounded relative flex items-center justify-center overflow-hidden" style={{ borderColor: currentTheme.border }}>
              <canvas
                ref={waveformCanvasRef}
                width={500}
                height={100}
                className="w-full h-full object-cover"
              />
              <div style={{ position: 'absolute', left: `${sampleStartPoint * 100}%`, top: 0, bottom: 0, width: '2px', backgroundColor: '#22c55e' }} />
              <div style={{ position: 'absolute', left: `${sampleEndPoint * 100}%`, top: 0, bottom: 0, width: '2px', backgroundColor: '#ef4444' }} />
            </div>

            <div className="flex gap-3">
              <label className="text-xs flex items-center gap-2 flex-1">
                START:
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.01"
                  value={sampleStartPoint}
                  onChange={(e) => setSampleStartPoint(parseFloat(e.target.value))}
                  className="w-full"
                />
              </label>
              <label className="text-xs flex items-center gap-2 flex-1">
                END:
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.01"
                  value={sampleEndPoint}
                  onChange={(e) => setSampleEndPoint(parseFloat(e.target.value))}
                  className="w-full"
                />
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 64-PAD MATRIX, SEGREGATED CONTROL CLUSTERS, & FX INSPECTOR */}
        <div className="flex-[2] flex flex-col gap-3">
          
          {/* 4x4 TACTILE PAD GRID WITH DYNAMIC HEX ADDRESS SHIFTER */}
          <div className="grid grid-cols-4 gap-2 p-2.5 rounded-md border" style={{ backgroundColor: currentTheme.panel, borderColor: currentTheme.border }}>
            {activePadStates.map((isActive, padIdx) => {
              const absolutePadIndex = padIdx + activeBankOffset;
              const hexDisplay = absolutePadIndex.toString(16).toUpperCase().padStart(2, '0');
              return (
                <button
                  key={padIdx}
                  onMouseDown={() => handlePadPress(padIdx)}
                  style={{
                    aspectRatio: '1',
                    backgroundColor: isActive ? currentTheme.padActive : currentTheme.padBg,
                    border: `2px solid ${isActive ? currentTheme.textBright : currentTheme.border}`,
                    borderRadius: '4px',
                    color: isActive ? currentTheme.bg : currentTheme.text,
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: isActive ? `0 0 12px ${currentTheme.accentGlow}` : 'none',
                    transition: 'background-color 0.05s ease',
                  }}
                >
                  {hexDisplay}
                </button>
              );
            })}
          </div>

          {/* SEGREGATED CONTROL CLUSTERS (SEQUENCER NAV, WAVEFORM HUD ZOOM/PAN, PITCH/MARKER DIAMONDS) */}
          <div className="flex p-2.5 rounded-md border justify-between items-center gap-2" style={{ backgroundColor: currentTheme.panel, borderColor: currentTheme.border }}>
            
            {/* 1. The Sequencer Nav Diamond */}
            <div className="flex flex-col items-center gap-1">
              <span style={{ fontSize: '9px', fontWeight: 'bold' }}>SEQ NAV</span>
              <div className="grid grid-cols-3 gap-1 items-center justify-items-center">
                <div />
                <button onClick={() => handleSequencerNav('UP')} style={dpadButtonStyle(currentTheme)}>▲</button>
                <div />
                <button onClick={() => handleSequencerNav('LEFT')} style={dpadButtonStyle(currentTheme)}>◀</button>
                <div style={{ fontSize: '8px', textAlign: 'center' }}>COL</div>
                <button onClick={() => handleSequencerNav('RIGHT')} style={dpadButtonStyle(currentTheme)}>▶</button>
                <div />
                <button onClick={() => handleSequencerNav('DOWN')} style={dpadButtonStyle(currentTheme)}>▼</button>
                <div />
              </div>
            </div>

            {/* 2. The Waveform HUD Diamond */}
            <div className="flex flex-col items-center gap-1">
              <span style={{ fontSize: '9px', fontWeight: 'bold' }}>WAVE HUD</span>
              <div className="grid grid-cols-3 gap-1 items-center justify-items-center">
                <div />
                <button onClick={() => handleWaveformNav('UP')} style={dpadButtonStyle(currentTheme)}>▲</button>
                <div />
                <button onClick={() => handleWaveformNav('LEFT')} style={dpadButtonStyle(currentTheme)}>◀</button>
                <div style={{ fontSize: '8px', textAlign: 'center' }}>ZOOM</div>
                <button onClick={() => handleWaveformNav('RIGHT')} style={dpadButtonStyle(currentTheme)}>▶</button>
                <div />
                <button onClick={() => handleWaveformNav('DOWN')} style={dpadButtonStyle(currentTheme)}>▼</button>
                <div />
              </div>
            </div>

            {/* 3. The Pitch / Marker Diamond */}
            <div className="flex flex-col items-center gap-1">
              <span style={{ fontSize: '9px', fontWeight: 'bold' }}>PITCH/MARKER</span>
              <div className="grid grid-cols-3 gap-1 items-center justify-items-center">
                <div />
                <button onClick={() => handlePitchMarkerNav('UP')} style={dpadButtonStyle(currentTheme)}>▲</button>
                <div />
                <button onClick={() => handlePitchMarkerNav('LEFT')} style={dpadButtonStyle(currentTheme)}>◀</button>
                <div style={{ fontSize: '8px', textAlign: 'center' }}>TUNE</div>
                <button onClick={() => handlePitchMarkerNav('RIGHT')} style={dpadButtonStyle(currentTheme)}>▶</button>
                <div />
                <button onClick={() => handlePitchMarkerNav('DOWN')} style={dpadButtonStyle(currentTheme)}>▼</button>
                <div />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                style={{
                  backgroundColor: isEditMode ? currentTheme.accent : currentTheme.bg,
                  color: currentTheme.textBright,
                  border: `1px solid ${currentTheme.border}`,
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                EDIT: {isEditMode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* FX PARAMETER HUD INSPECTOR */}
          <div className="flex-1 p-2.5 rounded-md border flex flex-col gap-2.5" style={{ backgroundColor: currentTheme.panel, borderColor: currentTheme.border }}>
            <span className="text-xs font-bold">FX PARAMETER HUD INSPECTOR</span>

            <div className="flex flex-col gap-2">
              <label className="text-xs flex flex-col gap-1">
                <span>DECAPITATOR SATURATION DRIVE: {satDrive.toFixed(1)}</span>
                <input
                  type="range"
                  min="1.0"
                  max="12.0"
                  step="0.1"
                  value={satDrive}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSatDrive(val);
                    if (audioGraph) audioGraph.setSaturationDrive(val);
                  }}
                  className="w-full"
                />
              </label>

              <label className="text-xs flex flex-col gap-1">
                <span>TIMELESS ECHO DELAY: {echoTime.toFixed(3)}s</span>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.005"
                  value={echoTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEchoTime(val);
                    if (audioGraph) audioGraph.setEchoParams(val, 0.4, 1200);
                  }}
                  className="w-full"
                />
              </label>

              <label className="text-xs flex flex-col gap-1">
                <span>DJFX LOOPER RATE: {djfxAmount.toFixed(2)}</span>
                <input
                  type="range"
                  min="0.01"
                  max="2.0"
                  step="0.01"
                  value={djfxAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDjfxAmount(val);
                    if (audioGraph) audioGraph.setDJFXParams(val, 0.5, true);
                  }}
                  className="w-full"
                />
              </label>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

const dpadButtonStyle = (theme: any): React.CSSProperties => ({
  width: '28px',
  height: '28px',
  backgroundColor: theme.padBg,
  color: theme.textBright,
  border: `1px solid ${theme.border}`,
  borderRadius: '4px',
  fontWeight: 'bold',
  fontSize: '10px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});