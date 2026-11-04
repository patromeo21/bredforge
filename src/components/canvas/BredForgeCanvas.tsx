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

  const handleBankChange = (bank: BankID) => {
    setCurrentBank(bank);
    if (sampleManager) {
      sampleManager.setActiveBank(bank);
    }
    forceRender();
  };

  const handlePadTap = (padId: number, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedPadId(padId);
    if (!sampleManager) return;
    const pad = sampleManager.getPad(padId, currentBank);
    if (pad && pad.buffer) {
      sampleManager.triggerPad(padId, currentBank);
      forceRender();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const drawWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !selectedPad || !selectedPad.buffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const buffer = selectedPad.buffer;
    const rawData = buffer.getChannelData(0);
    const step = Math.ceil(rawData.length / width);
    const amp = height / 2;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1.5;
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
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();

    const startX = selectedPad.startPos * width;
    const endX = selectedPad.endPos * width;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, startX, height);
    ctx.fillRect(endX, 0, width - endX, height);

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();
  }, [selectedPad]);

  useEffect(() => {
    if (selectedPad) {
      drawWaveform();
    }
  }, [selectedPad, drawWaveform]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[100dvh] bg-neutral-900 text-white flex flex-col justify-between p-2 select-none overflow-hidden font-mono box-border relative"
    >
      {/* 
        DECOUPLED NATIVE FILE INPUT: 
        Placed at the very root of the DOM container, completely outside 
        any touch-isolation button event chains. 
      */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelected}
        accept=".wav,.mp3,.m4a,.aac,.aif,.aiff"
        className="hidden"
      />

      {/* Header & Tab Bar */}
      <div className="w-full flex justify-between items-center border-b border-neutral-800 pb-1.5 flex-shrink-0">
        <h1 className="text-sm font-bold tracking-wider text-amber-500">BREDFORGE :: DAW</h1>
        
        {/* We put a direct, native label/button right here in the header where touch isolation cannot touch it */}
        <div className="flex items-center gap-2 z-30">
          <label 
            htmlFor="global-audio-file-input"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded cursor-pointer shadow"
          >
            LOAD SAMPLE TO PAD {selectedPadId} [{currentBank}]
          </label>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onTabChange && onTabChange(1)}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${activeTab === 1 ? 'bg-amber-600 text-white font-bold' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
            >
              Tracker
            </button>
            <button
              type="button"
              onClick={() => onTabChange && onTabChange(2)}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${activeTab === 2 ? 'bg-amber-600 text-white font-bold' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
            >
              Sampler
            </button>
          </div>
        </div>
      </div>

      {/* Main Screen Real-Estate Viewport */}
      <div className="flex-1 w-full flex flex-col justify-between my-1 overflow-hidden gap-1 min-h-0">
        {activeTab === 2 ? (
          <div className="w-full h-full flex flex-col justify-between max-w-2xl mx-auto">
            
            {/* TOP HUD SCREEN BEZEL */}
            <div className="w-full bg-neutral-950 border border-amber-500/40 rounded-lg p-2 text-xs flex flex-col gap-1 flex-shrink-0 shadow-lg">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-1">
                <span className="font-bold text-amber-500 text-[11px] truncate">
                  HUD :: PAD {selectedPadId < 10 ? `0${selectedPadId}` : selectedPadId} [{currentBank}] — {selectedPad?.name || 'Empty'}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {selectedPad?.buffer ? 'Sample Loaded' : 'No Sample'}
                </span>
              </div>

              <div className="w-full bg-black border border-neutral-800 rounded overflow-hidden relative">
                {selectedPad?.buffer ? (
                  <canvas
                    ref={waveformCanvasRef}
                    width={500}
                    height={45}
                    className="w-full h-10 block"
                  />
                ) : (
                  <div className="w-full h-10 flex items-center justify-center text-neutral-500 text-[10px]">
                    Select pad below, then click LOAD SAMPLE at the top right to import .wav
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5 items-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-neutral-400">Play Mode</span>
                  <select
                    value={selectedPad?.playMode || 'one-shot'}
                    onChange={(e) => {
                      sampleManager?.updatePadSettings(selectedPadId, currentBank, { playMode: e.target.value as PlayMode });
                      forceRender();
                    }}
                    className="bg-neutral-900 border border-neutral-700 rounded p-0.5 text-white text-[10px]"
                  >
                    <option value="one-shot">One-Shot</option>
                    <option value="gate">Gate</option>
                    <option value="loop">Loop</option>
                  </select>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-neutral-400">Choke Group</span>
                  <select
                    value={selectedPad?.chokeGroup || 0}
                    onChange={(e) => {
                      sampleManager?.updatePadSettings(selectedPadId, currentBank, { chokeGroup: parseInt(e.target.value) });
                      forceRender();
                    }}
                    className="bg-neutral-900 border border-neutral-700 rounded p-0.5 text-white text-[10px]"
                  >
                    <option value="0">None</option>
                    <option value="1">Group 1</option>
                    <option value="2">Group 2</option>
                    <option value="3">Group 3</option>
                  </select>
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
                    className="accent-amber-500 cursor-pointer h-2"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-neutral-400">Vol: {Math.round((selectedPad?.volume || 1) * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedPad?.volume ?? 1}
                    onChange={(e) => {
                      sampleManager?.updatePadSettings(selectedPadId, currentBank, { volume: parseFloat(e.target.value) });
                      forceRender();
                    }}
                    className="accent-amber-500 cursor-pointer h-2"
                  />
                </div>
              </div>
            </div>

            {/* BOTTOM PAD PERFORMANCE GRID */}
            <div className="w-full flex flex-col justify-end mt-1">
              <div className="flex justify-between items-center w-full mb-1 px-0.5">
                <span className="text-xs text-neutral-400">BANKS:</span>
                <div className="flex gap-1.5 z-10">
                  {(['A', 'B', 'C', 'D'] as BankID[]).map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        handleBankChange(bank);
                      }}
                      className={`px-3 py-0.5 text-xs font-bold rounded transition-all cursor-pointer ${
                        currentBank === bank ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 w-full h-[185px]">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((padId) => {
                  const pad = sampleManager?.getPad(padId, currentBank);
                  const isSelected = selectedPadId === padId;
                  return (
                    <button
                      key={padId}
                      type="button"
                      onPointerDown={(e) => handlePadTap(padId, e)}
                      className={`border rounded-lg flex flex-col items-center justify-center p-1 transition-all active:scale-95 cursor-pointer relative ${
                        pad?.buffer
                          ? isSelected
                            ? 'bg-amber-950/60 border-amber-400 text-amber-300 ring-2 ring-amber-500/50'
                            : 'bg-neutral-800 border-amber-500/60 text-amber-400'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="text-[8px] text-neutral-500">{currentBank}</span>
                      <span className="text-sm font-bold">{padId < 10 ? `0${padId}` : padId}</span>
                      <span className="text-[7px] truncate max-w-[55px] text-neutral-400">{pad?.name || 'Empty'}</span>
                    </button>
                  );
                })}
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
      </div>

      {/* Transport Footer */}
      <div className="w-full flex items-center justify-between border-t border-neutral-800 pt-1 px-0.5 flex-shrink-0">
        <div className="flex gap-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onTogglePlay && onTogglePlay();
            }}
            className={`px-3 py-1 rounded font-bold text-xs transition-colors cursor-pointer ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onStop && onStop();
            }}
            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded font-bold text-xs transition-colors cursor-pointer"
          >
            STOP
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-400">Master RMS:</span>
          <div className="w-20 h-1.5 bg-neutral-800 rounded overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, masterRmsLevel * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};