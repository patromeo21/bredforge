// ============================================================================
// BREDFORGE v1.0 — DUAL SCREEN TRACKER & FULLY WIRED PAD WORKSPACE [REF: WS-03]
// ============================================================================

import React, { useState, useRef } from 'react';

interface PadData {
  id: number;
  name: string;
  note: string;
  assignedIns: string;
  sampleName?: string;
  audioBuffer?: AudioBuffer | null;
}

export function DualScreenWorkspace() {
  const [gridMode, setGridMode] = useState<'4x4' | 'm8'>('4x4');
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [selectedStep, setSelectedStep] = useState<number>(0);

  // Pad State Management (Tracks loaded samples & audio buffers)
  const [pads, setPads] = useState<PadData[]>(
    Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      name: `PAD ${i + 1}`,
      note: `C${Math.floor(i / 4) + 1}`,
      assignedIns: `INS 0${(i % 4) + 1}`,
      sampleName: undefined,
      audioBuffer: null,
    }))
  );

  // Modal State for Sample Loading & Testing
  const [activePadForModal, setActivePadForModal] = useState<PadData | null>(null);
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [tempAudioBuffer, setTempAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Audio Context for testing/previewing
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Handle file selection and Web Audio decoding
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTempFile(file);
    setIsDecoding(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = getAudioContext();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      setTempAudioBuffer(decodedBuffer);
    } catch (err) {
      console.error('Failed to decode audio file:', err);
      alert('Error decoding audio file. Ensure it is a valid WAV or MP3.');
    } finally {
      setIsDecoding(false);
    }
  };

  // Test / Preview audio buffer
  const previewAudio = () => {
    if (!tempAudioBuffer) return;
    try {
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = tempAudioBuffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (err) {
      console.error('Playback failed:', err);
    }
  };

  // Confirm and assign sample to pad ([OK] button action)
  const confirmSampleAssignment = () => {
    if (!activePadForModal || !tempFile) return;

    setPads((prev) =>
      prev.map((p) =>
        p.id === activePadForModal.id
          ? {
              ...p,
              sampleName: tempFile.name,
              audioBuffer: tempAudioBuffer,
            }
          : p
      )
    );

    // Close modal & reset temp state
    setActivePadForModal(null);
    setTempFile(null);
    setTempAudioBuffer(null);
  };

  // Trigger pad sound during performance
  const triggerPad = (pad: PadData) => {
    if (pad.audioBuffer) {
      try {
        const ctx = getAudioContext();
        const source = ctx.createBufferSource();
        source.buffer = pad.audioBuffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (err) {
        console.error('Pad trigger failed:', err);
      }
    } else {
      // Open loader if pad is empty
      setActivePadForModal(pad);
    }
  };

  // Mock tracker rows
  const trackerRows = Array.from({ length: 16 }, (_, i) => ({
    step: i,
    t1: { note: i % 4 === 0 ? 'C-3' : '---', ins: '01', cmd: i === 0 ? 'P01' : '---' },
    t2: { note: i % 8 === 0 ? 'G-2' : '---', ins: '02', cmd: '---' },
    t3: { note: '---', ins: '--', cmd: '---' },
    t4: { note: i % 2 === 0 ? 'C-4' : '---', ins: '03', cmd: 'F08' },
  }));

  const m8Keys = [
    { label: 'UP', key: '▲', cmd: 'NAV_UP' },
    { label: 'DOWN', key: '▼', cmd: 'NAV_DOWN' },
    { label: 'LEFT', key: '◄', cmd: 'NAV_LEFT' },
    { label: 'RIGHT', key: '►', cmd: 'NAV_RIGHT' },
    { label: 'EDIT', key: 'E', cmd: 'EDIT_VAL' },
    { label: 'OPTION', key: 'O', cmd: 'OPT_MENU' },
    { label: 'SHIFT', key: 'S', cmd: 'MOD_SHIFT' },
    { label: 'PLAY', key: 'P', cmd: 'SEQ_PLAY' },
  ];

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono select-none overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-2 mb-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded border border-amber-500/40">
            [M8/MPC]
          </span>
          <span className="font-bold tracking-wider text-xs text-zinc-200">
            DUAL-SCREEN TRACKER & FUNCTIONAL PAD WORKSPACE
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">TAP PAD TO TEST // ASSIGN SAMPLES INSTANTLY</span>
      </div>

      {/* Main Dual Screen Container */}
      <div className="flex-1 relative min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        
        {/* LEFT SCREEN: M8 GRID TRACKER (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 bg-zinc-900 px-3 py-1.5 text-[10px] font-bold text-amber-400 border-b border-zinc-800 shrink-0 text-center">
            <span>STEP</span>
            <span>TRACK 1</span>
            <span>TRACK 2</span>
            <span>TRACK 3</span>
            <span>TRACK 4</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60">
            {trackerRows.map((row) => (
              <div
                key={row.step}
                onClick={() => setSelectedStep(row.step)}
                className={`grid grid-cols-5 px-3 py-1.5 text-xs items-center text-center cursor-pointer transition-colors ${
                  selectedStep === row.step
                    ? 'bg-amber-500/15 border-l-2 border-amber-500 text-amber-300'
                    : 'hover:bg-zinc-900/60 text-zinc-300'
                }`}
              >
                <span className="text-zinc-500 font-bold">
                  {row.step.toString().padStart(2, '0')}
                </span>
                <span className="font-mono text-emerald-400">
                  {row.t1.note} <span className="text-[9px] text-zinc-500">{row.t1.ins}</span>
                </span>
                <span className="font-mono text-amber-400">
                  {row.t2.note} <span className="text-[9px] text-zinc-500">{row.t2.ins}</span>
                </span>
                <span className="font-mono text-zinc-600">
                  {row.t3.note}
                </span>
                <span className="font-mono text-cyan-400">
                  {row.t4.note} <span className="text-[9px] text-zinc-500">{row.t4.ins}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SCREEN: SAMPLE EDIT & DYNAMIC GRID CONTAINER (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3 min-h-0 overflow-hidden">
          
          {/* Top Panel: Sample Edit & Step Parameters */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2 shrink-0">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
              <span className="text-[11px] font-bold text-amber-400">
                SAMPLE EDIT & INSPECTOR // STEP {selectedStep.toString().padStart(2, '0')}
              </span>
              <span className="text-[9px] text-emerald-400 font-bold">INS 01</span>
            </div>

            {/* Mini Waveform & Trim Preview */}
            <div className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-x-0 h-0.5 bg-amber-500/30"></div>
              <span className="text-[9px] text-zinc-600">[ WAVEFORM CANVAS PREVIEW ]</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex justify-between bg-zinc-950 p-1.5 rounded border border-zinc-800">
                <span className="text-zinc-500">TRIM START:</span>
                <span className="text-zinc-200">0.00s</span>
              </div>
              <div className="flex justify-between bg-zinc-950 p-1.5 rounded border border-zinc-800">
                <span className="text-zinc-500">TRIM END:</span>
                <span className="text-zinc-200">1.24s</span>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Flip Toggle & Dynamic Grid Target */}
          <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 flex flex-col min-h-0 overflow-hidden">
            
            {/* Grid Flip Switcher Header */}
            <div className="flex justify-between items-center mb-2 shrink-0">
              <div className="flex gap-1.5">
                {(['A', 'B', 'C', 'D'] as const).map((bank) => (
                  <button
                    key={bank}
                    onClick={() => setActiveBank(bank)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded border cursor-pointer ${
                      activeBank === bank
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    BANK {bank}
                  </button>
                ))}
              </div>

              {/* Dedicated Grid Flip Toggle */}
              <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800">
                <button
                  onClick={() => setGridMode('4x4')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${
                    gridMode === '4x4'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  4X4 PADS
                </button>
                <button
                  onClick={() => setGridMode('m8')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${
                    gridMode === 'm8'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  M8 BUTTONS
                </button>
              </div>
            </div>

            {/* Dynamic Grid Viewport */}
            <div className="flex-1 min-h-0">
              {gridMode === '4x4' ? (
                /* 4x4 MPC Pad Grid with Sample Load/Test Hooks */
                <div className="grid grid-cols-4 gap-2 h-full">
                  {pads.map((pad) => (
                    <button
                      key={pad.id}
                      onClick={() => triggerPad(pad)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setActivePadForModal(pad); // Right-click or long-press equivalent to load sample
                      }}
                      className={`flex flex-col justify-between p-2 rounded-lg text-left transition-all cursor-pointer group border ${
                        pad.audioBuffer
                          ? 'bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400'
                          : 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className={`text-[9px] font-bold ${pad.audioBuffer ? 'text-emerald-400' : 'text-amber-400'}`}>
                          P{pad.id < 10 ? `0${pad.id}` : pad.id}
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            pad.audioBuffer ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-zinc-700'
                          }`}
                        ></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-200 truncate">
                          {pad.sampleName ? pad.sampleName.split('.')[0] : pad.note}
                        </span>
                        <span className="text-[8px] text-zinc-500">
                          {pad.audioBuffer ? 'LOADED (TAP)' : 'EMPTY (CLICK)'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* M8 Hardware Button Grid */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 h-full">
                  {m8Keys.map((k, idx) => (
                    <button
                      key={idx}
                      className="flex flex-col justify-center items-center p-2 bg-zinc-900 border border-zinc-800 hover:border-amber-400/60 rounded-lg active:bg-amber-500 active:text-zinc-950 cursor-pointer transition-all"
                    >
                      <span className="text-sm font-bold text-amber-400">{k.key}</span>
                      <span className="text-[9px] font-bold tracking-wider text-zinc-300">{k.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* SAMPLE LOADER & ASSIGNMENT MODAL */}
      {activePadForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
          <div className="bg-zinc-900 border border-amber-500/50 rounded-xl p-5 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold text-amber-400">
                LOAD SAMPLE TO PAD {activePadForModal.id} ({activePadForModal.note})
              </span>
              <button
                onClick={() => setActivePadForModal(null)}
                className="text-zinc-400 hover:text-zinc-100 text-xs font-bold px-2 py-1 bg-zinc-800 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-zinc-300">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Select an audio file (.wav or .mp3) from your iPad storage to map directly into this pad and test it instantly.
              </p>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-center text-amber-400 font-bold cursor-pointer transition-all"
              >
                {tempFile ? `📁 ${tempFile.name}` : 'CHOOSE AUDIO FILE (.WAV / .MP3)'}
              </button>

              {isDecoding && (
                <div className="text-center text-[10px] text-amber-400 animate-pulse">
                  DECODING AUDIO BUFFER VIA WEBAUDIO...
                </div>
              )}

              {tempAudioBuffer && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={previewAudio}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs cursor-pointer transition-all shadow"
                  >
                    ▶ TEST / PREVIEW AUDIO
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800 mt-2">
              <button
                onClick={() => setActivePadForModal(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={confirmSampleAssignment}
                disabled={!tempAudioBuffer}
                className={`px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  tempAudioBuffer
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                [OK / ASSIGN TO PAD]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DualScreenWorkspace;