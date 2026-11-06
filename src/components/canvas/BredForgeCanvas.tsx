// ============================================================================
// STAGE D - NATIVE CORE INTERFACING & HARDWARE OVERHAUL (BredForgeCanvas.tsx)
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
  const [currentBankIndex, setCurrentBankIndex] = useState<number>(0);
  
  // Multi-column M8 tracking cursor state
  const [cursorRow, setCursorRow] = useState<number>(0);
  const [cursorCol, setCursorCol] = useState<ColumnType>('NOTE');
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [isHoldActive, setIsHoldActive] = useState<boolean>(false);

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

  // RequestAnimationFrame 60fps UI Frame Proxy Draw Loop
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
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentTheme]);

  // Handle Physical D-Pad Matrix Navigation
  const handleDirectionalNav = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
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

  // Handle 64-Pad Continuous Bank Interfacing & Live Editing
  const handlePadPress = useCallback((padIdx: number) => {
    // Calculate absolute 64-pad index offset: A=0, B=16, C=32, D=48
    const absolutePadIndex = (currentBankIndex * 16) + padIdx;

    setActivePadStates((prev) => {
      const next = [...prev];
      next[padIdx] = true;
      return next;
    });

    setTimeout(() => {
      setActivePadStates((prev) => {
        const next = [...prev];
        next[padIdx] = false;
        return next;
      });
    }, 120);

    if (onPadTrigger) {
      onPadTrigger(currentBankIndex, padIdx);
    }

    if (audioGraph) {
      const hexId = AudioGraph.getHexIdFromBank(currentBankIndex, padIdx);
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
              return { ...stepItem, vol: Math.min(1.0, (padIdx + 1) / 16.0) };
            } else if (cursorCol === 'FX1') {
              const commandKey = `X${padIdx < 10 ? '0' + padIdx : padIdx.toString(16).toUpperCase()}`;
              const resolvedFx: SPFxType = padIdx < 7 ? (TRACKER_FX1_COMMANDS[commandKey as keyof typeof TRACKER_FX1_COMMANDS] || 'bypass') : 'bypass';
              return { ...stepItem, fxType: resolvedFx };
            } else if (cursorCol === 'FX2') {
              return { ...stepItem, fxParam: (padIdx / 15.0) * 10.0 };
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
  }, [audioGraph, isEditMode, viewMode, activePhraseKey, cursorRow, cursorCol, onPadTrigger, currentBankIndex]);

  const currentPhraseBlock: PhraseBlock = projectState.phrases[activePhraseKey] || Array.from({ length: 16 }, (_, i) => ({
    step: i + 1,
    padId: null,
    vol: 1.0,
    fxType: 'bypass',
    fxParam: null
  }));

  const handlePlayAction = onPlayToggle || onPlay || (() => {});
  const handleStopAction = onStop || (() => {});

  return (
    <div
      {...restProps}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: currentTheme.bg,
        color: currentTheme.text,
        fontFamily: currentTheme.font,
        padding: '16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        ...restProps.style,
      }}
    >
      {/* HEADER TOP BAR & VIEW SELECTORS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `2px solid ${currentTheme.border}`, paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['SONG', 'CHAIN', 'PHRASE'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                backgroundColor: viewMode === mode ? currentTheme.accent : currentTheme.panel,
                color: viewMode === mode ? currentTheme.textBright : currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                padding: '8px 16px',
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

        {/* INDEPENDENT 64-PAD BANK SELECTORS [A], [B], [C], [D] */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['A', 'B', 'C', 'D'].map((bankLabel, idx) => (
            <button
              key={bankLabel}
              onClick={() => setCurrentBankIndex(idx)}
              style={{
                backgroundColor: currentBankIndex === idx ? currentTheme.accent : currentTheme.panel,
                color: currentBankIndex === idx ? currentTheme.textBright : currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                padding: '6px 12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              [{bankLabel} {(idx * 16).toString(16).toUpperCase()}-{(idx * 16 + 15).toString(16).toUpperCase()}]
            </button>
          ))}
        </div>

        {/* THEME & TRANSPORT CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
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

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePlayAction}
              style={{
                backgroundColor: isPlaying ? '#22c55e' : currentTheme.panel,
                color: isPlaying ? '#000' : currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                padding: '6px 14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              onClick={handleStopAction}
              style={{
                backgroundColor: currentTheme.panel,
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                padding: '6px 14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              STOP
            </button>
            <button
              onClick={onRecordToggle}
              style={{
                backgroundColor: isRecording ? '#ef4444' : currentTheme.panel,
                color: isRecording ? '#fff' : currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                padding: '6px 14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {isRecording ? 'REC [ON]' : 'REC'}
            </button>
          </div>
        </div>
      </div>

      {/* CENTRAL DUAL SPLIT WORKSPACE */}
      <div style={{ display: 'flex', flex: 1, gap: '16px', minHeight: 0 }}>
        
        {/* LEFT COLUMN: M8 16-ROW SEQUENCER GRID & WAVEFORM HUD */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
          
          {/* M8 16-ROW TRACKER GRID */}
          <div style={{ flex: 2, backgroundColor: currentTheme.panel, border: `1px solid ${currentTheme.border}`, borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: `1px solid ${currentTheme.border}`, paddingBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>PHRASE SEQUENCE [{activePhraseKey}] - ACTIVE COL: [{cursorCol}]</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setIsHoldActive(!isHoldActive)}
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
                <span style={{ fontSize: '11px' }}>EDIT: {isEditMode ? 'ON' : 'OFF'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 70px 90px 90px', backgroundColor: currentTheme.border, padding: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                <div>STEP</div>
                <div style={{ color: cursorCol === 'NOTE' ? currentTheme.accent : 'inherit' }}>NOTE</div>
                <div style={{ color: cursorCol === 'VOL' ? currentTheme.accent : 'inherit' }}>VOL</div>
                <div style={{ color: cursorCol === 'FX1' ? currentTheme.accent : 'inherit' }}>FX1</div>
                <div style={{ color: cursorCol === 'FX2' ? currentTheme.accent : 'inherit' }}>FX2</div>
              </div>

              {currentPhraseBlock.map((stepItem, idx) => {
                const isSelectedRow = cursorRow === idx;
                return (
                  <div
                    key={stepItem.step}
                    onClick={() => setCursorRow(idx)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '50px 1fr 70px 90px 90px',
                      padding: '6px',
                      backgroundColor: isSelectedRow ? 'rgba(255,255,255,0.08)' : 'transparent',
                      borderBottom: `1px solid ${currentTheme.border}`,
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: isSelectedRow ? currentTheme.textBright : currentTheme.text,
                    }}
                  >
                    <div>{String(stepItem.step).padStart(2, '0')}</div>
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

          {/* INTERACTIVE SAMPLE WAVEFORM HUD & AUDIO IMPORT */}
          <div style={{ flex: 1, backgroundColor: currentTheme.panel, border: `1px solid ${currentTheme.border}`, borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>SAMPLE WAVEFORM HUD & IMPORT</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: currentTheme.accent,
                    color: currentTheme.textBright,
                    border: `1px solid ${currentTheme.border}`,
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                >
                  IMPORT AUDIO
                </button>
                <span style={{ fontSize: '11px' }}>START: {sampleStartPoint.toFixed(2)} | END: {sampleEndPoint.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '4px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '90%', height: '40px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                {Array.from({ length: 32 }).map((_, i) => {
                  const h = Math.sin(i * 0.5) * 50 + 50;
                  return (
                    <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: currentTheme.accent, opacity: 0.7 }} />
                  );
                })}
              </div>

              <div style={{ position: 'absolute', left: `${sampleStartPoint * 100}%`, top: 0, bottom: 0, width: '2px', backgroundColor: '#22c55e' }} />
              <div style={{ position: 'absolute', left: `${sampleEndPoint * 100}%`, top: 0, bottom: 0, width: '2px', backgroundColor: '#ef4444' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                START:
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.01"
                  value={sampleStartPoint}
                  onChange={(e) => setSampleStartPoint(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                END:
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.01"
                  value={sampleEndPoint}
                  onChange={(e) => setSampleEndPoint(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TACTILE PADS, D-PAD, & FX INSPECTOR */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 4x4 TACTILE PAD GRID (BANK-MAPPED) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', backgroundColor: currentTheme.panel, padding: '12px', border: `1px solid ${currentTheme.border}`, borderRadius: '6px' }}>
            {activePadStates.map((isActive, padIdx) => (
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
                {AudioGraph.getHexIdFromBank(currentBankIndex, padIdx)}
              </button>
            ))}
          </div>

          {/* HARDWARE DIRECTIONAL NAVIGATION & EDIT TOGGLE */}
          <div style={{ display: 'flex', backgroundColor: currentTheme.panel, padding: '12px', border: `1px solid ${currentTheme.border}`, borderRadius: '6px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', alignItems: 'center', justifyItems: 'center' }}>
              <div />
              <button onClick={() => handleDirectionalNav('UP')} style={dpadButtonStyle(currentTheme)}>▲</button>
              <div />
              <button onClick={() => handleDirectionalNav('LEFT')} style={dpadButtonStyle(currentTheme)}>◀</button>
              <div style={{ fontSize: '11px', textAlign: 'center' }}>NAV</div>
              <button onClick={() => handleDirectionalNav('RIGHT')} style={dpadButtonStyle(currentTheme)}>▶</button>
              <div />
              <button onClick={() => handleDirectionalNav('DOWN')} style={dpadButtonStyle(currentTheme)}>▼</button>
              <div />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                style={{
                  backgroundColor: isEditMode ? currentTheme.accent : currentTheme.bg,
                  color: currentTheme.textBright,
                  border: `1px solid ${currentTheme.border}`,
                  padding: '8px 16px',
                  fontSize: '12px',
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
          <div style={{ flex: 1, backgroundColor: currentTheme.panel, border: `1px solid ${currentTheme.border}`, borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>FX PARAMETER HUD INSPECTOR</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  style={{ width: '100%' }}
                />
              </label>

              <label style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  style={{ width: '100%' }}
                />
              </label>

              <label style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  style={{ width: '100%' }}
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
  width: '36px',
  height: '36px',
  backgroundColor: theme.padBg,
  color: theme.textBright,
  border: `1px solid ${theme.border}`,
  borderRadius: '4px',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});