import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SampleLoader } from '../../services/sample/SampleLoader';
import { SampleManager, BankID, SampleSlot, PlayMode } from '../../services/sample/SampleManager';
import { TouchIsolationService } from '../../services/touch/TouchIsolationService';
import { PatternState } from '../../services/tracker/TrackerEngine';

export interface BredForgeCanvasProps {
  audioCtx: AudioContext | null;
  sampleManager: SampleManager | null;
  sampleLoader: SampleLoader | null;
  patternState?: PatternState;
  currentRow?: number;
  activeTab?: 1 | 2;
  onTabChange?: (tab: 1 | 2) => void;
  masterRmsLevel?: number;
  isPlaying?: boolean;
  onTogglePlay?: () => Promise<void>;
  onStop?: () => void;
}

export const BredForgeCanvas: React.FC<BredForgeCanvasProps> = ({
  audioCtx,
  sampleManager,
  sampleLoader,
  patternState,
  currentRow,
  activeTab = 2,
  onTabChange,
  masterRmsLevel = 0,
  isPlaying = false,
  onTogglePlay,
  onStop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const dpadCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentBank, setCurrentBank] = useState<BankID>('A');
  const [selectedPadId, setSelectedPadId] = useState<number>(1);
  const [copySource, setCopySource] = useState<{ padId: number; bank: BankID } | null>(null);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [isHoldActive, setIsHoldActive] = useState<boolean>(false);
  const [, setRefreshState] = useState<number>(0);

  useEffect(() => {
    let touchService: TouchIsolationService | null = null;
    if (containerRef.current) {
      touchService = new TouchIsolationService(containerRef.current);
    }
    return () => {
      touchService?.destroy();
    };
  }, []);

  const forceRender = () => setRefreshState((prev) => prev + 1);

  const ensureAudioActive = async () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
  };

  const handleBankChange = (bank: BankID) => {
    setCurrentBank(bank);
    if (sampleManager) {
      sampleManager.setActiveBank(bank);
    }
    forceRender();
  };

  const handlePadDown = async (padId: number) => {
    await ensureAudioActive();
    setSelectedPadId(padId);
    if (!sampleManager) return;

    if (isHoldActive) {
      const currentPad = sampleManager.getPad(padId, currentBank);
      const nextMode: PlayMode = currentPad?.playMode === 'one-shot' ? 'gate' : 'one-shot';
      sampleManager.updatePadSettings(padId, currentBank, { playMode: nextMode });
      forceRender();
      return;
    }

    const pad = sampleManager.getPad(padId, currentBank);
    if (pad && pad.buffer) {
      sampleManager.triggerPad(padId, currentBank);
      forceRender();
    }
  };

  const handlePadUp = (padId: number) => {
    if (!sampleManager || isHoldActive) return;
    const pad = sampleManager.getPad(padId, currentBank);
    if (pad && pad.playMode === 'gate' && pad.activeSourceNode) {
      sampleManager.stopPad(padId, currentBank);
      forceRender();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await ensureAudioActive();
    const files = e.target.files;
    if (!files || files.length === 0 || !sampleLoader || !sampleManager) return;

    const file = files[0];
    if (file.name.endsWith('.asd')) {
      alert('Skipped .asd file: Ableton analysis files cannot be played as audio.');
      e.target.value = '';
      return;
    }

    try {
      const decodedBuffer = await sampleLoader.loadAudioFile(file);
      sampleManager.assignBufferToPad(selectedPadId, currentBank, decodedBuffer, file.name);
      forceRender();
    } catch (err) {
      console.error(`Failed loading sample to Pad ${selectedPadId}`, err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const selectedPad: SampleSlot | undefined = sampleManager
    ? sampleManager.getPad(selectedPadId, currentBank)
    : undefined;

  const audioDuration = selectedPad?.buffer ? selectedPad.buffer.duration : 0;

  // HQ HD-Resolution Waveform with Zoom & Scroll Window Support
  const drawWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !selectedPad || !selectedPad.buffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = (window.devicePixelRatio || 1) * 2;
    const displayWidth = canvas.clientWidth || 500;
    const displayHeight = canvas.clientHeight || 80;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;

    const width = displayWidth;
    const height = displayHeight;
    const buffer = selectedPad.buffer;
    const rawData = buffer.getChannelData(0);

    const zoom = selectedPad.zoomLevel || 1.0;
    const scroll = selectedPad.scrollOffset || 0.0;

    const totalSamples = rawData.length;
    const windowSize = Math.floor(totalSamples / zoom);
    const startSample = Math.floor(scroll * (totalSamples - windowSize));
    const endSample = Math.min(totalSamples, startSample + windowSize);
    const sampleStep = Math.max(1, Math.floor((endSample - startSample) / width));

    const volumeMultiplier = selectedPad.volume ?? 1.0;
    const amp = (height / 2) * volumeMultiplier;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const sampleIdx = startSample + x * sampleStep;
      if (sampleIdx >= endSample) break;

      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < sampleStep && (sampleIdx + j) < totalSamples; j++) {
        const datum = rawData[sampleIdx + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.moveTo(x, (height / 2) + min * amp);
      ctx.lineTo(x, (height / 2) + max * amp);
    }
    ctx.stroke();

    // Map global trim positions to local zoom/scroll screen coordinates
    const mapGlobalToScreen = (globalPos: number) => {
      const globalSample = globalPos * totalSamples;
      const relativeSample = globalSample - startSample;
      return (relativeSample / windowSize) * width;
    };

    const startX = mapGlobalToScreen(selectedPad.startPos);
    const endX = mapGlobalToScreen(selectedPad.endPos);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, Math.max(0, startX), height);
    ctx.fillRect(Math.min(width, endX), 0, Math.max(0, width - endX), height);

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    if (selectedPad.activeSourceNode && audioCtx && selectedPad.startTime !== undefined) {
      const elapsed = audioCtx.currentTime - selectedPad.startTime;
      const progress = (elapsed / buffer.duration) % 1;
      const playheadX = mapGlobalToScreen(progress);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }

    ctx.restore();
  }, [selectedPad, audioCtx]);

  // Dedicated D-Pad Canvas Renderer & Touch Handler
  const drawDpad = useCallback(() => {
    const canvas = dpadCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 70;
    const h = 70;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#171717';
    ctx.fillRect(0, 0, w, h);

    // Draw D-pad arrows (Up, Down, Left, Right)
    ctx.fillStyle = '#a3a3a3';
    // Up
    ctx.beginPath();
    ctx.moveTo(35, 8); ctx.lineTo(25, 22); ctx.lineTo(45, 22); ctx.fill();
    // Down
    ctx.beginPath();
    ctx.moveTo(35, 62); ctx.lineTo(25, 48); ctx.lineTo(45, 48); ctx.fill();
    // Left
    ctx.beginPath();
    ctx.moveTo(8, 35); ctx.lineTo(22, 25); ctx.lineTo(22, 45); ctx.fill();
    // Right
    ctx.beginPath();
    ctx.moveTo(62, 35); ctx.lineTo(48, 25); ctx.lineTo(48, 45); ctx.fill();

    ctx.restore();
  }, []);

  useEffect(() => {
    drawDpad();
  }, [drawDpad]);

  const handleDpadInteraction = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!sampleManager || !selectedPad || !selectedPad.buffer) return;
    const canvas = dpadCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const zoom = selectedPad.zoomLevel || 1.0;
    const scroll = selectedPad.scrollOffset || 0.0;

    if (y < 25) {
      // UP: Zoom In
      const newZoom = Math.min(8.0, zoom + 0.5);
      sampleManager.updatePadSettings(selectedPadId, currentBank, { zoomLevel: newZoom });
    } else if (y > 45) {
      // DOWN: Zoom Out
      const newZoom = Math.max(1.0, zoom - 0.5);
      sampleManager.updatePadSettings(selectedPadId, currentBank, { zoomLevel: newZoom, scrollOffset: newZoom === 1.0 ? 0 : scroll });
    } else if (x < 25) {
      // LEFT: Scroll Left
      const newScroll = Math.max(0, scroll - 0.1 / zoom);
      sampleManager.updatePadSettings(selectedPadId, currentBank, { scrollOffset: newScroll });
    } else if (x > 45) {
      // RIGHT: Scroll Right
      const newScroll = Math.min(1.0, scroll + 0.1 / zoom);
      sampleManager.updatePadSettings(selectedPadId, currentBank, { scrollOffset: newScroll });
    }
    forceRender();
  };

  useEffect(() => {
    let animId: number;
    const renderLoop = () => {
      drawWaveform();
      if (selectedPad?.activeSourceNode) {
        animId = requestAnimationFrame(renderLoop);
      }
    };
    renderLoop();
    return () => cancelAnimationFrame(animId);
  }, [drawWaveform, selectedPad?.activeSourceNode]);

  useEffect(() => {
    drawWaveform();
  }, [selectedPad?.volume, selectedPad?.startPos, selectedPad?.endPos, selectedPad?.zoomLevel, selectedPad?.scrollOffset, drawWaveform]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[100dvh] bg-neutral-900 text-white flex flex-col justify-between p-2 select-none overflow-hidden font-mono box-border touch-none relative"
    >
      <input
        ref={fileInputRef}
        id="groovebox-file-input"
        type="file"
        onChange={handleFileSelected}
        accept=".wav,.mp3,.m4a,.aac,.aif,.aiff"
        className="hidden"
      />

      {/* In-App Clear Confirmation Modal */}
      {showClearModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-red-500/60 rounded-xl p-4 max-w-sm w-full flex flex-col gap-3 shadow-2xl">
            <span className="text-xs font-bold text-red-400 tracking-wider">CONFIRM PAD DELETION</span>
            <p className="text-[11px] text-neutral-300">
              Clear Pad {selectedPadId} [{currentBank}]? This will remove the sample and reset all parameters.
            </p>
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  sampleManager?.clearPad(selectedPadId, currentBank);
                  setShowClearModal(false);
                  forceRender();
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded cursor-pointer shadow"
              >
                CLEAR PAD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="w-full flex justify-between items-center border-b border-neutral-800 pb-1.5 flex-shrink-0 touch-manipulation">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold tracking-wider text-amber-500">BREDFORGE :: GROOVEBOX</h1>
          
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={async () => {
                await ensureAudioActive();
                onTogglePlay && onTogglePlay();
              }}
              className={`px-2.5 py-0.5 rounded font-bold text-[10px] transition-colors cursor-pointer ${isPlaying ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              type="button"
              onClick={() => {
                onStop && onStop();
              }}
              className="px-2.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded font-bold text-[10px] transition-colors cursor-pointer text-neutral-300"
            >
              STOP
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 z-10">
          <label
            htmlFor="groovebox-file-input"
            onClick={ensureAudioActive}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold rounded cursor-pointer shadow inline-block"
          >
            LOAD SAMPLE ({selectedPadId} [{currentBank}])
          </label>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                ensureAudioActive();
                onTabChange && onTabChange(1);
              }}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${activeTab === 1 ? 'bg-amber-600 text-white font-bold' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
            >
              Tracker
            </button>
            <button
              type="button"
              onClick={() => {
                ensureAudioActive();
                onTabChange && onTabChange(2);
              }}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${activeTab === 2 ? 'bg-amber-600 text-white font-bold' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
            >
              Sampler
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Real-Estate Viewport */}
      <main className="flex-1 w-full flex flex-col justify-between my-1 overflow-hidden gap-1 min-h-0">
        {activeTab === 2 ? (
          <div className="w-full h-full flex flex-col justify-between max-w-2xl mx-auto min-h-0">
            
            {/* HUD SCREEN BEZEL with D-Pad & Zoom/Scroll Integration */}
            <div className="w-full bg-neutral-950 border border-amber-500/40 rounded-lg p-2 text-xs flex flex-col gap-1.5 flex-shrink-0 shadow-lg">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-1">
                <span className="font-bold text-amber-500 text-[11px] truncate">
                  HUD :: PAD {selectedPadId < 10 ? `0${selectedPadId}` : selectedPadId} [{currentBank}] — {selectedPad?.name || 'Empty'}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!copySource) {
                        setCopySource({ padId: selectedPadId, bank: currentBank });
                      } else {
                        sampleManager?.copyPad(copySource.padId, copySource.bank, selectedPadId, currentBank);
                        setCopySource(null);
                        forceRender();
                      }
                    }}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded ${copySource ? 'bg-emerald-600 text-white animate-pulse' : 'bg-neutral-800 text-amber-400 hover:bg-neutral-700'}`}
                  >
                    {copySource ? `PASTE TO ${selectedPadId}` : 'COPY'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    className="px-2 py-0.5 text-[9px] font-bold rounded bg-neutral-800 text-red-400 hover:bg-neutral-700 cursor-pointer"
                  >
                    CLEAR
                  </button>
                </div>
              </div>

              {/* Waveform Window & D-Pad Container */}
              <div className="flex gap-2 items-center">
                <div className="flex-1 bg-black border border-neutral-800 rounded overflow-hidden relative">
                  {selectedPad?.buffer ? (
                    <>
                      <canvas
                        ref={waveformCanvasRef}
                        className="w-full h-20 block"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const modes: PlayMode[] = ['one-shot', 'gate', 'loop'];
                          const nextMode = modes[(modes.indexOf(selectedPad.playMode || 'one-shot') + 1) % modes.length];
                          sampleManager?.updatePadSettings(selectedPadId, currentBank, { playMode: nextMode });
                          forceRender();
                        }}
                        className="absolute top-1 right-1 px-2 py-0.5 bg-neutral-900/90 border border-red-500/60 text-red-400 text-[8px] font-bold rounded hover:bg-neutral-800 cursor-pointer backdrop-blur-sm shadow"
                      >
                        {selectedPad.playMode?.toUpperCase() || 'ONE-SHOT'}
                      </button>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-neutral-900/80 text-[7px] text-amber-400 rounded">
                        ZOOM: {(selectedPad.zoomLevel || 1.0).toFixed(1)}x
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-20 flex items-center justify-center text-neutral-500 text-[10px]">
                      Select a pad below, then tap LOAD SAMPLE above to import .wav
                    </div>
                  )}
                </div>

                {/* Dedicated Console D-Pad Canvas for Zoom/Pan */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="text-[7px] text-neutral-400 mb-0.5">ZOOM/PAN</span>
                  <canvas
                    ref={dpadCanvasRef}
                    onPointerDown={handleDpadInteraction}
                    className="w-[70px] h-[70px] rounded border border-neutral-800 cursor-pointer touch-manipulation shadow"
                  />
                </div>
              </div>

              {/* Time-Accurate Start, End, Pitch & Volume Sliders */}
              <div className="grid grid-cols-4 gap-2 items-center touch-manipulation pt-0.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-green-400">
                    Start: {((selectedPad?.startPos || 0) * audioDuration).toFixed(2)}s
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="0.95"
                    step="0.002"
                    value={selectedPad?.startPos ?? 0}
                    onChange={(e) => {
                      sampleManager?.updatePadSettings(selectedPadId, currentBank, { startPos: parseFloat(e.target.value) });
                      forceRender();
                    }}
                    className="accent-green-500 cursor-pointer h-2 mt-0.5"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-red-400">
                    End: {((selectedPad?.endPos || 1) * audioDuration).toFixed(2)}s
                  </span>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.002"
                    value={selectedPad?.endPos ?? 1}
                    onChange={(e) => {
                      sampleManager?.updatePadSettings(selectedPadId, currentBank, { endPos: parseFloat(e.target.value) });
                      forceRender();
                    }}
                    className="accent-red-500 cursor-pointer h-2 mt-0.5"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-neutral-400">Pitch: {selectedPad?.pitch || 0}st</span>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={selectedPad?.pitch || 0}
                    onChange={(e) => {
                      sampleManager?.updatePadSettings(selectedPadId, currentBank, { pitch: parseInt(e.target.value) });
                      forceRender();
                    }}
                    className="accent-amber-500 cursor-pointer h-2 mt-0.5"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-neutral-400">Vol: {Math.round((selectedPad?.volume || 1) * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={selectedPad?.volume ?? 1}
                    onChange={(e) => {
                      sampleManager?.updatePadSettings(selectedPadId, currentBank, { volume: parseFloat(e.target.value) });
                      forceRender();
                    }}
                    className="accent-amber-500 cursor-pointer h-2 mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* SP-404SX HARDWARE HOUSING CONTAINER (Compact Pads & Upper-Right HOLD Badge) */}
            <div className="w-full flex-1 flex flex-col justify-end mt-1 min-h-0 bg-neutral-950 border border-amber-500/30 rounded-xl p-2 shadow-2xl">
              
              {/* MODE Panel & Upper-Right Compact HOLD Badge */}
              <div className="flex justify-between items-center w-full mb-1.5 px-0.5 touch-manipulation flex-shrink-0 bg-neutral-900 border border-neutral-800 rounded-md p-1">
                <span className="text-[9px] text-neutral-400 font-bold px-1">MODE:</span>
                <div className="flex items-center gap-1.5 flex-1 justify-around px-2">
                  {(['one-shot', 'gate', 'loop'] as PlayMode[]).map((mode) => {
                    const isActive = (selectedPad?.playMode || 'one-shot') === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          sampleManager?.updatePadSettings(selectedPadId, currentBank, { playMode: mode });
                          forceRender();
                        }}
                        className={`flex-1 py-1 text-[9px] font-bold rounded transition-all cursor-pointer uppercase text-center ${
                          isActive
                            ? 'bg-red-950 border border-red-500 text-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                        }`}
                      >
                        {mode === 'one-shot' ? '1-SHOT' : mode}
                      </button>
                    );
                  })}
                </div>

                {/* Upper-Right Compact HOLD Badge */}
                <button
                  type="button"
                  onPointerDown={() => setIsHoldActive(true)}
                  onPointerUp={() => setIsHoldActive(false)}
                  onPointerLeave={() => setIsHoldActive(false)}
                  className={`px-3 py-1 border rounded flex items-center justify-center font-bold text-[9px] transition-all cursor-pointer shadow ${
                    isHoldActive
                      ? 'bg-blue-950 border-blue-400 text-blue-300 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                  }`}
                  title="Hold down to toggle pad modes on tap"
                >
                  HOLD {isHoldActive ? '●' : '©'}
                </button>
              </div>

              {/* Grid Section with Bank Selection Bottom-Left & Compact SP Pads */}
              <div className="w-full flex-1 flex items-center justify-between gap-2 min-h-0">
                {/* Bank Selection positioned at bottom left */}
                <div className="flex flex-col gap-1 items-center justify-center flex-shrink-0">
                  <span className="text-[8px] text-neutral-400">BANK</span>
                  <div className="flex flex-col gap-1 z-10">
                    {(['A', 'B', 'C', 'D'] as BankID[]).map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => handleBankChange(bank)}
                        className={`w-7 h-7 text-[11px] font-bold rounded transition-all cursor-pointer flex items-center justify-center ${
                          currentBank === bank ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compact SP-404SX Pad Performance Grid (Guaranteed Viewport Fit) */}
                <div className="flex-1 h-full flex items-center justify-center">
                  <div className="grid grid-cols-4 gap-1.5 w-full h-full max-h-[160px]">
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((padId) => {
                      const pad = sampleManager?.getPad(padId, currentBank);
                      const isSelected = selectedPadId === padId;
                      const isPlayingPad = pad?.activeSourceNode != null;
                      const isGate = pad?.playMode === 'gate';
                      const isLoop = pad?.playMode === 'loop';

                      return (
                        <button
                          key={padId}
                          type="button"
                          onPointerDown={() => handlePadDown(padId)}
                          onPointerUp={() => handlePadUp(padId)}
                          onPointerLeave={() => handlePadUp(padId)}
                          className={`border rounded-lg flex flex-col items-center justify-center p-1 transition-all active:scale-95 cursor-pointer relative touch-manipulation shadow-md ${
                            isPlayingPad
                              ? 'bg-amber-400 border-white text-neutral-950 ring-2 ring-amber-300'
                              : pad?.buffer
                                ? isSelected
                                  ? 'bg-neutral-800 border-amber-400 text-amber-300 ring-1 ring-amber-500/60'
                                  : 'bg-neutral-900 border-amber-500/60 text-amber-400'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-600 hover:bg-neutral-900'
                          }`}
                        >
                          <div className="w-full flex justify-between px-1 text-[7px] text-neutral-500">
                            <span>{currentBank}</span>
                            <span className={isGate ? 'text-green-400 font-bold' : isLoop ? 'text-amber-400 font-bold' : 'text-blue-400 font-bold'}>
                              {isGate ? '[G]' : isLoop ? '[L]' : '[1]'}
                            </span>
                          </div>
                          <span className="text-xs font-bold tracking-tight my-0.5">{padId < 10 ? `0${padId}` : padId}</span>
                          <span className="text-[6px] truncate max-w-[50px] text-neutral-400">{pad?.name || 'EMPTY'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-lg p-3 h-full overflow-y-auto text-xs mx-auto">
            <div className="text-amber-500 mb-2 font-bold">TRACKER PATTERN VIEW (Current Row: {currentRow ?? 0})</div>
            {patternState?.rows.map((row, rIdx) => (
              <div key={rIdx} className={`flex justify-between p-1 ${rIdx === currentRow ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400'}`}>
                <span>Row {rIdx < 10 ? `0${rIdx}` : rIdx}</span>
                {row.columns.map((col, cIdx) => (
                  <span key={cIdx}>Inst {col.instrumentId}: {col.note || '---'}</span>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BredForgeCanvas;