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
    const pad = sampleManager.getPad(padId, currentBank);
    if (pad && pad.buffer) {
      sampleManager.triggerPad(padId, currentBank);
      forceRender();
    }
  };

  const handlePadEnter = (padId: number, e: React.PointerEvent) => {
    // Glissando sliding touch: Only trigger if moving to a DIFFERENT pad while mouse/finger is down
    if (e.buttons === 1 && padId !== selectedPadId) {
      handlePadDown(padId);
    }
  };

  const handlePadUp = (padId: number) => {
    if (!sampleManager) return;
    const pad = sampleManager.getPad(padId, currentBank);
    // If gate mode is active and HOLD is NOT active, stop pad on release
    if (pad && pad.playMode === 'gate' && !isHoldActive && pad.activeSourceNode) {
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

  // HQ HD-Resolution Waveform, Live Volume Scaling Animation & Playhead Loop
  const drawWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !selectedPad || !selectedPad.buffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = (window.devicePixelRatio || 1) * 2;
    const displayWidth = canvas.clientWidth || 500;
    const displayHeight = canvas.clientHeight || 45;

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
    const step = Math.ceil(rawData.length / width);
    
    const volumeMultiplier = selectedPad.volume ?? 1.0;
    const amp = (height / 2) * volumeMultiplier;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = rawData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.moveTo(i, (height / 2) + min * amp);
      ctx.lineTo(i, (height / 2) + max * amp);
    }
    ctx.stroke();

    const startX = selectedPad.startPos * width;
    const endX = selectedPad.endPos * width;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, startX, height);
    ctx.fillRect(endX, 0, width - endX, height);

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
      const duration = buffer.duration;
      const progress = (elapsed / duration) % 1;
      const playheadX = progress * width;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }

    ctx.restore();
  }, [selectedPad, audioCtx]);

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
  }, [selectedPad?.volume, drawWaveform]);

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

      {/* Top Header with Title, Transport, RMS & Navigation */}
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

          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-[9px] text-neutral-400">RMS:</span>
            <div className="w-16 h-1.5 bg-neutral-800 rounded overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-75"
                style={{ width: `${Math.min(100, Math.max(0, (masterRmsLevel || 0) * 100))}%` }}
              />
            </div>
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
            
            {/* TOP HUD SCREEN BEZEL */}
            <div className="w-full bg-neutral-950 border border-amber-500/40 rounded-lg p-2 text-xs flex flex-col gap-1 flex-shrink-0 shadow-lg">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-1">
                <span className="font-bold text-amber-500 text-[11px] truncate">
                  HUD :: PAD {selectedPadId < 10 ? `0${selectedPadId}` : selectedPadId} [{currentBank}] — {selectedPad?.name || 'Empty'}
                </span>
                
                {/* SP-404SX Style Copy / Delete Utility Action Buttons */}
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

              {/* Waveform Window with Active Play Mode Badge */}
              <div className="w-full bg-black border border-neutral-800 rounded overflow-hidden relative">
                {selectedPad?.buffer ? (
                  <>
                    <canvas
                      ref={waveformCanvasRef}
                      className="w-full h-9 block"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const modes: PlayMode[] = ['one-shot', 'gate', 'loop'];
                        const nextMode = modes[(modes.indexOf(selectedPad.playMode || 'one-shot') + 1) % modes.length];
                        sampleManager?.updatePadSettings(selectedPadId, currentBank, { playMode: nextMode });
                        forceRender();
                      }}
                      className="absolute top-1 right-1 px-2 py-0.5 bg-neutral-900/90 border border-red-500/60 text-red-400 text-[8px] font-bold rounded hover:bg-neutral-800 cursor-pointer backdrop-blur-sm shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                      title="Click to cycle active Play Mode"
                    >
                      {selectedPad.playMode?.toUpperCase() || 'ONE-SHOT'}
                    </button>
                  </>
                ) : (
                  <div className="w-full h-9 flex items-center justify-center text-neutral-500 text-[10px]">
                    Select a pad below, then tap LOAD SAMPLE above to import .wav
                  </div>
                )}
              </div>

              {/* Sliders & Choke Groups */}
              <div className="grid grid-cols-4 gap-1.5 items-center touch-manipulation pt-0.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-neutral-400">Choke Group</span>
                  <div className="flex gap-0.5 bg-neutral-900 border border-neutral-800 rounded p-0.5">
                    {[0, 1, 2, 3].map((grp) => {
                      const isActive = (selectedPad?.chokeGroup || 0) === grp;
                      return (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => {
                            sampleManager?.updatePadSettings(selectedPadId, currentBank, { chokeGroup: grp });
                            forceRender();
                          }}
                          className={`flex-1 py-0.5 text-[8px] font-bold rounded transition-all cursor-pointer ${
                            isActive
                              ? 'bg-red-950/90 border border-red-500 text-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          {grp === 0 ? 'OFF' : `G${grp}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 col-span-2">
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
                    className="accent-amber-500 cursor-pointer h-2 mt-1"
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
                    className="accent-amber-500 cursor-pointer h-2 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* SP-404SX HARDWARE HOUSING CONTAINER FOR PAD GRID & CONTROL CLUSTER */}
            <div className="w-full flex-1 flex flex-col justify-end mt-1 min-h-0 bg-neutral-950 border border-amber-500/30 rounded-xl p-2.5 shadow-2xl">
              
              {/* SP Control Cluster (Mode Buttons, HOLD Pad, and Banks) */}
              <div className="flex justify-between items-center w-full mb-2 px-0.5 touch-manipulation flex-shrink-0">
                {/* Play Mode Buttons */}
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-neutral-400">MODE:</span>
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
                        className={`px-2 py-1 text-[9px] font-bold rounded transition-all cursor-pointer uppercase ${
                          isActive
                            ? 'bg-red-950 border border-red-500 text-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                        }`}
                      >
                        {mode === 'one-shot' ? '1-SHOT' : mode}
                      </button>
                    );
                  })}
                </div>

                {/* Dedicated HOLD Square Pad Button (scale-[0.80]) */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsHoldActive(!isHoldActive)}
                    className={`w-12 h-10 transform scale-[0.80] border rounded flex flex-col items-center justify-center font-bold text-[9px] transition-all cursor-pointer shadow ${
                      isHoldActive
                        ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                    }`}
                    title="Toggle Gate Hold Sustain mode"
                  >
                    <span>HOLD</span>
                    <span className="text-[7px]">{isHoldActive ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Bank Selection at Top Right */}
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-neutral-400">BANK:</span>
                  <div className="flex gap-1 z-10">
                    {(['A', 'B', 'C', 'D'] as BankID[]).map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => handleBankChange(bank)}
                        className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                          currentBank === bank ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Scale-[1.00] SP-404SX Thick Pad Performance Grid */}
              <div className="w-full flex-1 flex items-center justify-center min-h-0">
                <div className="grid grid-cols-4 gap-2 w-full h-full max-h-[175px] transform scale-[1.00] origin-center">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((padId) => {
                    const pad = sampleManager?.getPad(padId, currentBank);
                    const isSelected = selectedPadId === padId;
                    const isPlayingPad = pad?.activeSourceNode != null;
                    return (
                      <button
                        key={padId}
                        type="button"
                        onPointerDown={() => handlePadDown(padId)}
                        onPointerEnter={(e) => handlePadEnter(padId, e)}
                        onPointerUp={() => handlePadUp(padId)}
                        onPointerLeave={() => handlePadUp(padId)}
                        className={`border-2 rounded-lg flex flex-col items-center justify-center p-1 transition-all active:scale-95 cursor-pointer relative touch-manipulation shadow-md ${
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
                          <span>{pad?.playMode === 'gate' ? '[G]' : pad?.playMode === 'loop' ? '[L]' : '[1]'}</span>
                        </div>
                        <span className="text-sm font-bold tracking-tight my-0.5">{padId < 10 ? `0${padId}` : padId}</span>
                        <span className="text-[7px] truncate max-w-[55px] text-neutral-400">{pad?.name || 'EMPTY'}</span>
                      </button>
                    );
                  })}
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