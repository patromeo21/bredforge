import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SampleLoader } from '../../services/sample/SampleLoader';
import { SampleManager, BankID, SampleSlot, PlayMode } from '../../services/sample/SampleManager';
import { TouchIsolationService } from '../../services/touch/TouchIsolationService';
import { PatternState } from '../../services/tracker/TrackerEngine';

export interface BredForgeCanvasProps {
  audioCtx: AudioContext | null;
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
  const sampleManagerRef = useRef<SampleManager | null>(null);
  const sampleLoaderRef = useRef<SampleLoader | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);

  const [currentBank, setCurrentBank] = useState<BankID>('A');
  const [selectedPadId, setSelectedPadId] = useState<number | null>(null);
  const [, setRefreshState] = useState<number>(0);

  useEffect(() => {
    if (!audioCtx) return;

    if (!sampleManagerRef.current) {
      sampleManagerRef.current = new SampleManager(audioCtx);
    }
    if (!sampleLoaderRef.current) {
      sampleLoaderRef.current = new SampleLoader(audioCtx);
    }

    let touchService: TouchIsolationService | null = null;
    if (containerRef.current) {
      touchService = new TouchIsolationService(containerRef.current);
    }

    return () => {
      touchService?.destroy();
    };
  }, [audioCtx]);

  const forceRender = () => setRefreshState((prev) => prev + 1);

  const handleBankChange = (bank: BankID) => {
    setCurrentBank(bank);
    if (sampleManagerRef.current) {
      sampleManagerRef.current.setActiveBank(bank);
    }
    forceRender();
  };

  const handlePadTap = (padId: number) => {
    const manager = sampleManagerRef.current;
    if (!manager) return;

    const pad = manager.getPad(padId, currentBank);
    if (pad && pad.buffer) {
      manager.triggerPad(padId, currentBank);
      forceRender();
    } else {
      handleLoadSample(padId);
    }
  };

  const handlePadSettingsOpen = (padId: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setSelectedPadId(padId);
  };

  const handleLoadSample = (padId: number) => {
    const loader = sampleLoaderRef.current;
    const manager = sampleManagerRef.current;
    if (!loader || !manager) return;

    loader.openFilePicker(async (file: File) => {
      try {
        const decodedBuffer = await loader.loadAudioFile(file);
        manager.assignBufferToPad(padId, currentBank, decodedBuffer, file.name);
        setSelectedPadId(padId);
        forceRender();
      } catch (err) {
        console.error(`Failed loading sample to Pad ${padId}`, err);
      }
    });
  };

  const selectedPad: SampleSlot | undefined = selectedPadId
    ? sampleManagerRef.current?.getPad(selectedPadId, currentBank)
    : undefined;

  // Draw Waveform Chopper / Editor Screen
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

    // Draw waveform path
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

    // Draw Start and End Trim Markers
    const startX = selectedPad.startPos * width;
    const endX = selectedPad.endPos * width;

    // Dim regions outside trim points
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, startX, height);
    ctx.fillRect(endX, 0, width - endX, height);

    // Start Marker Line
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    // End Marker Line
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
      className="w-full h-screen bg-neutral-900 text-white flex flex-col items-center justify-between p-4 select-none touch-none overflow-hidden"
    >
      {/* Header & Tab Bar */}
      <div className="w-full flex justify-between items-center border-b border-neutral-800 pb-3">
        <h1 className="text-lg font-bold tracking-wider text-amber-500">BREDFORGE :: DAW</h1>
        <div className="flex gap-2">
          <button
            onClick={() => onTabChange && onTabChange(1)}
            className={`px-3 py-1 text-sm rounded transition-colors ${activeTab === 1 ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
          >
            Tracker (Tab 1)
          </button>
          <button
            onClick={() => onTabChange && onTabChange(2)}
            className={`px-3 py-1 text-sm rounded transition-colors ${activeTab === 2 ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
          >
            Sampler (Tab 2)
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center my-2 overflow-y-auto">
        {activeTab === 2 ? (
          <div className="w-full max-w-md flex flex-col items-center">
            {/* Bank Selectors */}
            <div className="flex justify-between items-center w-full mb-3 px-1">
              <span className="text-xs text-neutral-400 font-mono">BANK SELECT:</span>
              <div className="flex gap-1.5">
                {(['A', 'B', 'C', 'D'] as BankID[]).map((bank) => (
                  <button
                    key={bank}
                    onClick={() => handleBankChange(bank)}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                      currentBank === bank ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>

            {/* 4x4 Pad Grid */}
            <div className="grid grid-cols-4 gap-3 w-full aspect-square">
              {Array.from({ length: 16 }, (_, i) => i + 1).map((padId) => {
                const pad = sampleManagerRef.current?.getPad(padId, currentBank);
                const isSelected = selectedPadId === padId;
                return (
                  <div
                    key={padId}
                    onClick={() => handlePadTap(padId)}
                    className={`border rounded-lg flex flex-col items-center justify-center p-2 transition-all active:scale-95 touch-none cursor-pointer relative ${
                      pad?.buffer
                        ? isSelected
                          ? 'bg-amber-950/40 border-amber-400 text-amber-300 ring-2 ring-amber-500/50'
                          : 'bg-neutral-800 border-amber-500/60 text-amber-400'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    <button
                      onClick={(e) => handlePadSettingsOpen(padId, e)}
                      className="absolute top-1 right-1 text-[9px] px-1 bg-neutral-950/60 rounded text-neutral-400 hover:text-white"
                      title="Sample Edit / Settings"
                    >
                      ⚙
                    </button>
                    <span className="text-[10px] text-neutral-500">{currentBank}</span>
                    <span className="text-base font-bold">{padId < 10 ? `0${padId}` : padId}</span>
                    <span className="text-[9px] truncate max-w-[65px] text-neutral-400">{pad?.name || 'Empty'}</span>
                  </div>
                );
              })}
            </div>

            {/* SP-404 Sample Edit & Waveform Chopper Window */}
            {selectedPad && selectedPadId && (
              <div className="w-full mt-4 bg-neutral-950 border border-amber-500/40 rounded-lg p-3 text-xs flex flex-col gap-3 shadow-xl">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-1.5">
                  <span className="font-bold text-amber-500 tracking-wide">
                    SAMPLE EDIT :: PAD {selectedPadId < 10 ? `0${selectedPadId}` : selectedPadId} [{currentBank}]
                  </span>
                  <button onClick={() => setSelectedPadId(null)} className="text-neutral-400 hover:text-white px-1 font-bold">✕</button>
                </div>

                <div className="text-neutral-300 truncate font-mono text-[11px]">File: {selectedPad.name}</div>

                {/* Waveform Canvas */}
                <div className="w-full bg-black border border-neutral-800 rounded overflow-hidden relative">
                  {selectedPad.buffer ? (
                    <canvas ref={waveformCanvasRef} width={380} height={100} className="w-full h-24 block" />
                  ) : (
                    <div className="w-full h-24 flex items-center justify-center text-neutral-600 text-xs">No Audio Loaded</div>
                  )}
                </div>

                {/* Start / End Trimming Sliders */}
                <div className="grid grid-cols-2 gap-3 bg-neutral-900/60 p-2 rounded border border-neutral-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-green-400 font-mono">Start Trim: {Math.round(selectedPad.startPos * 100)}%</span>
                    <input
                      type="range"
                      min="0"
                      max="0.95"
                      step="0.01"
                      value={selectedPad.startPos}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val < selectedPad.endPos) {
                          sampleManagerRef.current?.updatePadSettings(selectedPadId, currentBank, { startPos: val });
                          forceRender();
                        }
                      }}
                      className="accent-green-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-red-400 font-mono">End Trim: {Math.round(selectedPad.endPos * 100)}%</span>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.01"
                      value={selectedPad.endPos}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val > selectedPad.startPos) {
                          sampleManagerRef.current?.updatePadSettings(selectedPadId, currentBank, { endPos: val });
                          forceRender();
                        }
                      }}
                      className="accent-red-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Play Mode & Choke Groups */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-neutral-400">Play Mode:</span>
                    <select
                      value={selectedPad.playMode}
                      onChange={(e) => {
                        sampleManagerRef.current?.updatePadSettings(selectedPadId, currentBank, { playMode: e.target.value as PlayMode });
                        forceRender();
                      }}
                      className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white text-xs"
                    >
                      <option value="one-shot">One-Shot</option>
                      <option value="gate">Gate</option>
                      <option value="loop">Loop</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-neutral-400">Choke Group:</span>
                    <select
                      value={selectedPad.chokeGroup}
                      onChange={(e) => {
                        sampleManagerRef.current?.updatePadSettings(selectedPadId, currentBank, { chokeGroup: parseInt(e.target.value) });
                        forceRender();
                      }}
                      className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white text-xs"
                    >
                      <option value="0">None (Polyphonic)</option>
                      <option value="1">Group 1 (Hi-Hats)</option>
                      <option value="2">Group 2</option>
                      <option value="3">Group 3</option>
                    </select>
                  </div>
                </div>

                {/* Pitch & Volume Sliders */}
                <div className="grid grid-cols-2 gap-2 bg-neutral-900/60 p-2 rounded border border-neutral-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-neutral-400">Pitch: {selectedPad.pitch > 0 ? `+${selectedPad.pitch}` : selectedPad.pitch} st</span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={selectedPad.pitch}
                      onChange={(e) => {
                        sampleManagerRef.current?.updatePadSettings(selectedPadId, currentBank, { pitch: parseInt(e.target.value) });
                        forceRender();
                      }}
                      className="accent-amber-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-neutral-400">Volume: {Math.round(selectedPad.volume * 100)}%</span>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={selectedPad.volume}
                      onChange={(e) => {
                        sampleManagerRef.current?.updatePadSettings(selectedPadId, currentBank, { volume: parseFloat(e.target.value) });
                        forceRender();
                      }}
                      className="accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-neutral-800">
                  <button
                    onClick={() => {
                      sampleManagerRef.current?.clearPad(selectedPadId, currentBank);
                      forceRender();
                    }}
                    className="px-3 py-1 bg-red-900/40 hover:bg-red-900 text-red-300 rounded font-bold text-xs"
                  >
                    Clear Sample
                  </button>
                  <button
                    onClick={() => handleLoadSample(selectedPadId)}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-xs"
                  >
                    Replace File (.wav/.mp3)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs">
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
      <div className="w-full flex items-center justify-between border-t border-neutral-800 pt-3 px-2">
        <div className="flex gap-2">
          <button
            onClick={onTogglePlay}
            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <button
            onClick={onStop}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded font-bold text-sm transition-colors"
          >
            STOP
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Master RMS:</span>
          <div className="w-24 h-2 bg-neutral-800 rounded overflow-hidden">
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