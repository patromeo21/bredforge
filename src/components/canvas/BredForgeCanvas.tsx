// ============================================================================
// STAGE D - PHASE 26: DECOUPLED UI FRAME PROXY DRAW PIPELINE (BredForgeCanvas.tsx)
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
  const [cursorRow, setCursorRow] = useState<number>(0);
  const [cursorCol, setCursorCol] = useState<number>(0);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  
  const [projectState, setProjectState] = useState<ProjectStateSchema>(
    initialProjectState || createInitialTrackerState()
  );

  const [activePadStates, setActivePadStates] = useState<boolean[]>(Array(16).fill(false));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Handle Hardware D-Pad Navigation & Keyboard Input
  const handleDirectionalNav = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (viewMode === 'PHRASE') {
      if (direction === 'UP') {
        setCursorRow((prev) => Math.max(0, prev - 1));
      } else if (direction === 'DOWN') {
        setCursorRow((prev) => Math.min(15, prev + 1));
      } else if (direction === 'LEFT') {
        setCursorCol((prev) => Math.max(0, prev - 1));
      } else if (direction === 'RIGHT') {
        setCursorCol((prev) => Math.min(4, prev + 1));
      }
    }
  }, [viewMode]);

  // Handle Physical Pad Strike & Live Recording Latch
  const handlePadPress = useCallback((padIndex: number) => {
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

    if (onPadTrigger) {
      const bankIdx = typeof activeBank === 'number' ? activeBank : parseInt(String(activeBank), 10) || 0;
      onPadTrigger(bankIdx, padIndex);
    }

    if (audioGraph) {
      const hexId = AudioGraph.getHexIdFromBank(0, padIndex);
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
            const commandKey = `X${padIndex < 10 ? '0' + padIndex : padIndex.toString(16).toUpperCase()}`;
            const resolvedFx: SPFxType = padIndex < 7 ? (TRACKER_FX1_COMMANDS[commandKey as keyof typeof TRACKER_FX1_COMMANDS] || 'bypass') : 'bypass';
            return {
              ...stepItem,
              padId: padIndex,
              fxType: resolvedFx
            };
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
  }, [audioGraph, isEditMode, viewMode, activePhraseKey, cursorRow, onPadTrigger, activeBank]);

  const currentPhraseBlock: PhraseBlock = projectState.phrases[activePhraseKey] || Array.from({ length: 16 }, (_, i) => ({
    step: i + 1,
    padId: null,
    vol: 1.0,
    fxType: 'bypass',
    fxParam: null
  }));

  const handlePlayAction = onPlayToggle || onPlay;
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

      {/* CENTRAL VIEWPORT PANE */}
      <div style={{ display: 'flex', flex: 1, gap: '16px', minHeight: 0 }}>
        
        {/* DYNAMIC VIEWPORT SCREEN */}
        <div style={{ flex: 3, backgroundColor: currentTheme.panel, border: `1px solid ${currentTheme.border}`, borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.15 }}
          />

          {viewMode === 'PHRASE' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', zIndex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 100px 100px', backgroundColor: currentTheme.border, padding: '8px', fontWeight: 'bold', fontSize: '12px' }}>
                <div>STEP</div>
                <div>NOTE / CHOP</div>
                <div>VOL</div>
                <div>FX1 TYPE</div>
                <div>FX2 PARAM</div>
              </div>

              {currentPhraseBlock.map((stepItem, idx) => {
                const isSelected = cursorRow === idx;
                return (
                  <div
                    key={stepItem.step}
                    onClick={() => setCursorRow(idx)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 80px 100px 100px',
                      padding: '8px',
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.07)' : 'transparent',
                      borderBottom: `1px solid ${currentTheme.border}`,
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: isSelected ? currentTheme.textBright : currentTheme.text,
                    }}
                  >
                    <div>{String(stepItem.step).padStart(2, '0')}</div>
                    <div>{TrackerState.getNoteNameFromPadId(stepItem.padId)}</div>
                    <div>{stepItem.vol.toFixed(1)}</div>
                    <div>{stepItem.fxType}</div>
                    <div>{stepItem.fxParam !== null ? stepItem.fxParam.toFixed(2) : '---'}</div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'CHAIN' && (
            <div style={{ display: 'flex', flexDirection: 'column', zIndex: 1, gap: '12px' }}>
              <h3>CHAIN ARRANGEMENT [PHRASE CHAIN: {activePhraseKey}]</h3>
              <p>Sequence and link phrases together into continuous song blocks.</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.keys(projectState.phrases).map((phraseId) => (
                  <button
                    key={phraseId}
                    onClick={() => setActivePhraseKey(phraseId)}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: activePhraseKey === phraseId ? currentTheme.accent : currentTheme.bg,
                      color: currentTheme.textBright,
                      border: `1px solid ${currentTheme.border}`,
                      cursor: 'pointer',
                    }}
                  >
                    Phrase {phraseId}
                  </button>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'SONG' && (
            <div style={{ display: 'flex', flexDirection: 'column', zIndex: 1, gap: '12px' }}>
              <h3>MASTER SONG TIMELINE</h3>
              {projectState.songTimeline.map((row) => (
                <div key={row.rowId} style={{ display: 'flex', gap: '16px', padding: '8px', borderBottom: `1px solid ${currentTheme.border}` }}>
                  <span>Row {row.rowId}</span>
                  <span>Phrase: {row.phraseKey}</span>
                  <span>Repeats: {row.repeatCount}</span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ISOLATED SIDEBAR HARDWARE PANEL (16 Pads & Directional D-Pad) */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 4x4 TACTILE PAD GRID */}
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
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: isActive ? `0 0 12px ${currentTheme.accentGlow}` : 'none',
                  transition: 'background-color 0.05s ease',
                }}
              >
                {AudioGraph.getHexIdFromBank(0, padIdx)}
              </button>
            ))}
          </div>

          {/* HARDWARE DIRECTIONAL NAVIGATION & CONTROL PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: currentTheme.panel, padding: '12px', border: `1px solid ${currentTheme.border}`, borderRadius: '6px', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>HARDWARE DECK</span>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                style={{
                  backgroundColor: isEditMode ? currentTheme.accent : currentTheme.bg,
                  color: currentTheme.textBright,
                  border: `1px solid ${currentTheme.border}`,
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                EDIT: {isEditMode ? 'ON' : 'OFF'}
              </button>
            </div>

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
          </div>

        </div>

      </div>
    </div>
  );
};

const dpadButtonStyle = (theme: any): React.CSSProperties => ({
  width: '40px',
  height: '40px',
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