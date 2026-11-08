// ============================================================================
// BREDFORGE v1.0 — DUAL-SCREEN WORKSPACE & MPC SAMPLE EDITOR [REF: M65]
// ============================================================================

import React, { useState } from 'react';
import { trackerEngine, PatternState, ParameterLock } from '../../services/tracker/TrackerEngine';
import { sampleManager, PlaybackMode } from '../../services/audio/SampleManager';
import { ParameterLockModal } from './ParameterLockModal';

type PadMode = 'performance' | 'm8_dirtywave';
type BankKey = 'A' | 'B' | 'C' | 'D';

export function DualScreenWorkspace() {
  const [pattern, setPattern] = useState<PatternState>(() => trackerEngine.generateDefaultPattern());
  const [swingPercent, setSwingPercent] = useState<number>(54);
  const [activeModalStep, setActiveModalStep] = useState<{ row: number; col: number; lock?: ParameterLock } | null>(null);

  // Right-side 4x4 Pad States
  const [padMode, setPadMode] = useState<PadMode>('performance');
  const [activeBank, setActiveBank] = useState<BankKey>('A');
  const [selectedPadIndex, setSelectedPadIndex] = useState<number>(0);
  const [isSampleEditorOpen, setIsSampleEditorOpen] = useState<boolean>(false);
  const [activePadState, setActivePadState] = useState<string | null>(null);
  const [assignedSamples, setAssignedSamples] = useState<{ [key: string]: string }>({});

  // MPC Editor Parameter State for Selected Pad
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('one-shot');
  const [attack, setAttack] = useState<number>(0.005);
  const [decay, setDecay] = useState<number>(0.1);
  const [sustain, setSustain] = useState<number>(0.8);
  const [release, setRelease] = useState<number>(0.15);
  const [startTrim, setStartTrim] = useState<number>(0);
  const [endTrim, setEndTrim] = useState<number>(1);

  const handleSaveLock = (newLock: ParameterLock) => {
    if (!activeModalStep) return;
    const { row, col } = activeModalStep;
    trackerEngine.setParameterLock(pattern, row, col, newLock);
    setPattern({
      ...pattern,
      rows: pattern.rows.map((r, rIdx) => {
        if (rIdx !== row) return r;
        return {
          ...r,
          columns: r.columns.map((c, cIdx) => (cIdx !== col ? c : { ...c, paramLock: newLock })),
        };
      }),
    });
    setActiveModalStep(null);
  };

  const handlePadClick = (padIndex: number) => {
    setSelectedPadIndex(padIndex);
    sampleManager.triggerPad(activeBank, padIndex);
    
    const sampleKey = `${activeBank}-${padIndex}`;
    const sampleName = assignedSamples[sampleKey] || `Pad ${padIndex + 1}`;
    
    setActivePadState(`BANK ${activeBank} ➔ ${sampleName}`);
    setTimeout(() => setActivePadState(null), 400);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await sampleManager.loadAndAssignSample(activeBank, selectedPadIndex, file);

    setAssignedSamples((prev) => ({
      ...prev,
      [`${activeBank}-${selectedPadIndex}`]: file.name,
    }));
  };

  const handleParamUpdate = (updates: any) => {
    sampleManager.updateParameters(activeBank, selectedPadIndex, updates);
  };

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row gap-2 bg-zinc-950 p-2 font-mono select-none overflow-hidden">
      
      {/* LEFT SIDE: TRACKER & SWING TELEMETRY */}
      <div className="flex-1 flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 relative overflow-hidden">
        <div className="flex justify-between items-center pb-2 mb-2 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded border border-amber-500/40">
              [M65]
            </span>
            <span className="font-bold tracking-wider text-xs text-zinc-200">
              TRACKER // STEP GRID
            </span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
            <span className="text-[10px] text-zinc-400">SWING:</span>
            <input
              type="range"
              min="50"
              max="75"
              value={swingPercent}
              onChange={(e) => setSwingPercent(Number(e.target.value))}
              className="w-16 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-amber-400 text-[10px] font-bold w-7 text-right">{swingPercent}%</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {pattern.rows.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center gap-2 bg-zinc-900/60 p-1.5 rounded border border-zinc-800/60">
              <span className="text-[10px] text-zinc-500 w-6 text-right font-mono">
                {(rIdx + 1).toString().padStart(2, '0')}
              </span>
              <div className="grid grid-cols-1 flex-1">
                {row.columns.map((col, cIdx) => (
                  <div key={cIdx} className="flex items-center justify-between bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-amber-500 w-8">{col.note || '----'}</span>
                      <span className="text-[10px] text-zinc-400">INS: {col.instrumentID ?? '--'}</span>
                    </div>
                    <button
                      onClick={() => setActiveModalStep({ row: rIdx, col: cIdx, lock: col.paramLock })}
                      className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded border border-zinc-700"
                    >
                      EDIT P-LOCK
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: 4X4 PERFORMANCE MATRIX & MPC SAMPLE EDITOR */}
      <div className="w-full md:w-[400px] flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 relative shrink-0">
        <div className="flex justify-between items-center pb-2 mb-2 border-b border-zinc-800 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-500 font-bold">
              {padMode === 'performance' ? `SP-404 / MPC [BANK ${activeBank}]` : 'M8 DIRTYWAVE & FX'}
            </span>
            <span className="text-xs text-zinc-200 font-bold truncate max-w-[170px]">
              {activePadState || `PAD ${selectedPadIndex + 1} SELECTED`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSampleEditorOpen(!isSampleEditorOpen)}
              className={`px-2 py-1 text-[9px] font-bold rounded border transition-colors ${
                isSampleEditorOpen ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              {isSampleEditorOpen ? 'HIDE EDIT' : 'SAMPLE EDIT'}
            </button>
            <button
              onClick={() => setPadMode(padMode === 'performance' ? 'm8_dirtywave' : 'performance')}
              className="px-2.5 py-1 bg-amber-500 text-zinc-950 text-[10px] font-bold rounded border border-amber-400 hover:bg-amber-400"
            >
              {padMode === 'performance' ? 'FLIP ➔ M8' : 'FLIP ➔ SP404'}
            </button>
          </div>
        </div>

        {padMode === 'performance' && (
          <div className="grid grid-cols-4 gap-1 mb-2 shrink-0">
            {(['A', 'B', 'C', 'D'] as BankKey[]).map((bank) => (
              <button
                key={bank}
                onClick={() => setActiveBank(bank)}
                className={`py-1 text-[10px] font-bold rounded border transition-colors ${
                  activeBank === bank ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                BANK {bank}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-2 relative">
          {Array.from({ length: 16 }).map((_, idx) => {
            const sampleKey = `${activeBank}-${idx}`;
            const hasSample = !!assignedSamples[sampleKey];
            const isSelected = selectedPadIndex === idx;

            return (
              <button
                key={idx}
                onClick={() => handlePadClick(idx)}
                className={`flex flex-col items-center justify-center rounded-lg border transition-all active:scale-95 p-1 ${
                  isSelected ? 'border-amber-400 bg-zinc-800/80' : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                <span className="text-xs font-bold text-zinc-200">{idx + 1}</span>
                <span className={`text-[8px] truncate max-w-full px-0.5 ${hasSample ? 'text-amber-400 font-bold' : 'text-zinc-500'}`}>
                  {hasSample ? assignedSamples[sampleKey] : `${activeBank}${idx + 1}`}
                </span>
              </button>
            );
          })}

          {/* MPC-Style Sample Editor Floating Window Overlay */}
          {isSampleEditorOpen && (
            <div className="absolute inset-0 bg-zinc-950/98 border border-amber-500/50 rounded-lg p-3 flex flex-col justify-between shadow-2xl backdrop-blur-md z-20 overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5 shrink-0">
                <span className="text-[10px] text-amber-400 font-bold">
                  MPC SAMPLE EDITOR // BANK {activeBank} - PAD {selectedPadIndex + 1}
                </span>
                <button
                  onClick={() => setIsSampleEditorOpen(false)}
                  className="w-5 h-5 flex items-center justify-center bg-zinc-900 text-zinc-400 rounded text-xs hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              {/* File Loader & Waveform View */}
              <div className="py-2 flex flex-col gap-2 shrink-0">
                <div className="w-full h-10 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-between px-2 text-[10px] text-zinc-300">
                  <span className="truncate">{assignedSamples[`${activeBank}-${selectedPadIndex}`] || 'NO FILE LOADED'}</span>
                  <label className="px-2 py-1 bg-amber-500 text-zinc-950 font-bold rounded cursor-pointer hover:bg-amber-400">
                    LOAD
                    <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {/* Trigger Mode Selector (One-Shot, Gate, Loop) */}
                <div className="grid grid-cols-3 gap-1">
                  {(['one-shot', 'gate', 'loop'] as PlaybackMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setPlaybackMode(mode);
                        handleParamUpdate({ playbackMode: mode });
                      }}
                      className={`py-1 text-[9px] font-bold rounded border uppercase ${
                        playbackMode === mode
                          ? 'bg-amber-500 text-zinc-950 border-amber-400'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* ADSR Envelope Controls */}
              <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800 flex flex-col gap-2 shrink-0">
                <span className="text-[9px] text-amber-500 font-bold">ADSR ENVELOPE</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] text-zinc-400">
                      <span>ATTACK</span>
                      <span>{attack.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.001"
                      max="1"
                      step="0.005"
                      value={attack}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAttack(val);
                        handleParamUpdate({ attack: val });
                      }}
                      className="w-full h-1 bg-zinc-800 rounded accent-amber-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] text-zinc-400">
                      <span>DECAY</span>
                      <span>{decay.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="1"
                      step="0.01"
                      value={decay}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDecay(val);
                        handleParamUpdate({ decay: val });
                      }}
                      className="w-full h-1 bg-zinc-800 rounded accent-amber-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] text-zinc-400">
                      <span>SUSTAIN</span>
                      <span>{Math.round(sustain * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={sustain}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSustain(val);
                        handleParamUpdate({ sustain: val });
                      }}
                      className="w-full h-1 bg-zinc-800 rounded accent-amber-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] text-zinc-400">
                      <span>RELEASE</span>
                      <span>{release.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="2"
                      step="0.01"
                      value={release}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRelease(val);
                        handleParamUpdate({ release: val });
                      }}
                      className="w-full h-1 bg-zinc-800 rounded accent-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 shrink-0">
                <button
                  onClick={() => setIsSampleEditorOpen(false)}
                  className="py-1.5 bg-zinc-900 text-zinc-300 text-[10px] font-bold rounded border border-zinc-700"
                >
                  CLOSE
                </button>
                <button
                  onClick={() => sampleManager.triggerPad(activeBank, selectedPadIndex)}
                  className="py-1.5 bg-amber-500 text-zinc-950 text-[10px] font-bold rounded border border-amber-400 font-bold"
                >
                  TEST PAD
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeModalStep && (
        <ParameterLockModal
          isOpen={true}
          rowIndex={activeModalStep.row}
          colIndex={activeModalStep.col}
          currentLock={activeModalStep.lock}
          onSave={handleSaveLock}
          onClose={() => setActiveModalStep(null)}
        />
      )}
    </div>
  );
}

export default DualScreenWorkspace;