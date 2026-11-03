import React, { useEffect, useRef, useState } from 'react';
import { SampleLoader } from '../../services/sample/SampleLoader';
import { SampleManager, BankID } from '../../services/sample/SampleManager';
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
  const [currentBank, setCurrentBank] = useState<BankID>('A');
  const [, setRefreshState] = useState<number>(0);

  useEffect(() => {
    if (!audioCtx) return;

    const manager = new SampleManager(audioCtx);
    const loader = new SampleLoader(audioCtx);
    sampleManagerRef.current = manager;
    sampleLoaderRef.current = loader;

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

  const handleLoadSample = (padId: number) => {
    const loader = sampleLoaderRef.current;
    const manager = sampleManagerRef.current;
    if (!loader || !manager) return;

    loader.openFilePicker(async (file: File) => {
      try {
        const decodedBuffer = await loader.loadAudioFile(file);
        manager.assignBufferToPad(padId, currentBank, decodedBuffer, file.name);
        forceRender();
        console.log(`Loaded ${file.name} to Bank ${currentBank} Pad ${padId}`);
      } catch (err) {
        console.error(`Failed loading sample to Pad ${padId}`, err);
      }
    });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-neutral-900 text-white flex flex-col items-center justify-between p-4 select-none touch-none"
    >
      {/* Header & Tab Bar */}
      <div className="w-full flex justify-between items-center border-b border-neutral-800 pb-3">
        <h1 className="text-lg font-bold tracking-wider text-amber-500">BREDFORGE :: DAW</h1>
        <div className="flex gap-2">
          <button
            onClick={() => onTabChange && onTabChange(1)}
            className={`px-3 py-1 text-sm rounded ${activeTab === 1 ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
          >
            Tracker (Tab 1)
          </button>
          <button
            onClick={() => onTabChange && onTabChange(2)}
            className={`px-3 py-1 text-sm rounded ${activeTab === 2 ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
          >
            Sampler (Tab 2)
          </button>
        </div>
      </div>

      {/* Main Sampler / Tracker Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center my-4">
        {activeTab === 2 ? (
          <div className="w-full max-w-md flex flex-col items-center">
            {/* Bank Selectors */}
            <div className="flex justify-between items-center w-full mb-3 px-1">
              <span className="text-xs text-neutral-400">BANK SELECT:</span>
              <div className="flex gap-2">
                {(['A', 'B', 'C', 'D'] as BankID[]).map((bank) => (
                  <button
                    key={bank}
                    onClick={() => handleBankChange(bank)}
                    className={`px-3 py-1 text-xs font-bold rounded ${
                      currentBank === bank ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    BANK {bank}
                  </button>
                ))}
              </div>
            </div>

            {/* 4x4 Pad Grid */}
            <div className="grid grid-cols-4 gap-3 w-full aspect-square">
              {Array.from({ length: 16 }, (_, i) => i + 1).map((padId) => {
                const pad = sampleManagerRef.current?.getPad(padId, currentBank);
                return (
                  <button
                    key={padId}
                    onClick={() => handlePadTap(padId)}
                    className={`border rounded-lg flex flex-col items-center justify-center p-2 transition-all active:scale-95 touch-none ${
                      pad?.buffer ? 'bg-neutral-800 border-amber-500 text-amber-400' : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    <span className="text-[10px] text-neutral-500">{currentBank}</span>
                    <span className="text-base font-bold">{padId < 10 ? `0${padId}` : padId}</span>
                    <span className="text-[9px] truncate max-w-[60px] text-neutral-400">{pad?.name || 'Empty'}</span>
                  </button>
                );
              })}
            </div>
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
            className={`px-4 py-2 rounded font-bold text-sm ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <button
            onClick={onStop}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded font-bold text-sm"
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