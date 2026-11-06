// ============================================================================
// STAGE F - CORE PERFORMANCE ENGINE: SP-STYLE AUDITION MATRIX (PadMatrix.tsx)
// ============================================================================

import React, { useState } from 'react';

export interface PadConfig {
  id: number;
  label: string;
  sampleName: string;
  hexId: string;
}

interface PadMatrixProps {
  isRecording?: boolean;
  onPadTrigger?: (bankIdx: number, padIdx: number, hexId: string) => void | Promise<void>;
  onRecordStep?: (padId: number) => void;
}

export const PadMatrix: React.FC<PadMatrixProps> = ({
  isRecording = false,
  onPadTrigger,
  onRecordStep,
}) => {
  const [activePad, setActivePad] = useState<number | null>(null);
  const [muteMode, setMuteMode] = useState<boolean>(false);
  const [soloMode, setSoloMode] = useState<boolean>(false);

  // 4x4 SP-Style Performance Matrix with Bank/Hex mappings
  const pads: PadConfig[] = [
    { id: 1,  label: 'PAD 01', sampleName: 'KICK_01.WAV',   hexId: '00' },
    { id: 2,  label: 'PAD 02', sampleName: 'SNARE_01.WAV',  hexId: '01' },
    { id: 3,  label: 'PAD 03', sampleName: 'HH_CLOSE.WAV',  hexId: '02' },
    { id: 4,  label: 'PAD 04', sampleName: 'HH_OPEN.WAV',   hexId: '03' },
    { id: 5,  label: 'PAD 05', sampleName: 'CLAP_01.WAV',   hexId: '04' },
    { id: 6,  label: 'PAD 06', sampleName: 'PERC_01.WAV',   hexId: '05' },
    { id: 7,  label: 'PAD 07', sampleName: 'CRASH_01.WAV',  hexId: '06' },
    { id: 8,  label: 'PAD 08', sampleName: 'RIDE_01.WAV',   hexId: '07' },
    { id: 9,  label: 'PAD 09', sampleName: 'BASS_C1.WAV',   hexId: '08' },
    { id: 10, label: 'PAD 10', sampleName: 'SYN_CHORD.WAV', hexId: '09' },
    { id: 11, label: 'PAD 11', sampleName: 'VOX_HIT.WAV',   hexId: '0A' },
    { id: 12, label: 'PAD 12', sampleName: 'FX_STAB.WAV',   hexId: '0B' },
    { id: 13, label: 'PAD 13', sampleName: 'CHOP_01.WAV',   hexId: '0C' },
    { id: 14, label: 'PAD 14', sampleName: 'CHOP_02.WAV',   hexId: '0D' },
    { id: 15, label: 'PAD 15', sampleName: 'CHOP_03.WAV',   hexId: '0E' },
    { id: 16, label: 'PAD 16', sampleName: 'CHOP_04.WAV',   hexId: '0F' },
  ];

  // Hardware Touch Event Handler (Pure Instant Audition)
  const handleTouchPad = (pad: PadConfig, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault(); // Prevent WebKit touch/scroll interference on iPad
    }

    setActivePad(pad.id);

    // 1. Fire Audio Audition Payload Instantly matching TrackerLayout signature (bankIdx, padIdx, hexId)
    if (onPadTrigger) {
      onPadTrigger(0, pad.id - 1, pad.hexId);
    }

    // 2. Write Step Row strictly IF Record Transport is Active
    if (isRecording && onRecordStep) {
      onRecordStep(pad.id);
    }

    // Visual Feedback Timeout
    setTimeout(() => setActivePad(null), 120);
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border border-emerald-500/20 rounded p-2 font-mono text-[11px] select-none">
      {/* Header & Tactile Punch-In Controls */}
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-emerald-500/20">
        <span className="text-emerald-400 font-bold tracking-wider">[ 4x4 PERFORMANCE MATRIX ]</span>
        
        {/* MUTE / SOLO Hardware Strips */}
        <div className="flex gap-1">
          <button
            onClick={() => { setMuteMode(!muteMode); if (soloMode) setSoloMode(false); }}
            className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
              muteMode
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_8px_rgba(220,38,38,0.6)]'
                : 'bg-zinc-950 text-red-500/70 border-red-900/40 hover:border-red-500/40'
            }`}
          >
            PUNCH MUTE
          </button>
          <button
            onClick={() => { setSoloMode(!soloMode); if (muteMode) setMuteMode(false); }}
            className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
              soloMode
                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                : 'bg-zinc-950 text-amber-500/70 border-amber-900/40 hover:border-amber-500/40'
            }`}
          >
            PUNCH SOLO
          </button>
        </div>
      </div>

      {/* 4x4 Tactile Pad Grid */}
      <div className="flex-1 grid grid-cols-4 gap-2">
        {pads.map((pad) => {
          const isActive = activePad === pad.id;
          return (
            <div
              key={pad.id}
              onTouchStart={(e) => handleTouchPad(pad, e)}
              onMouseDown={(e) => handleTouchPad(pad, e)}
              className={`flex flex-col justify-between p-2 rounded border transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-95'
                  : 'bg-zinc-950/80 border-emerald-500/30 hover:border-emerald-500/60'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[9px] font-bold ${isActive ? 'text-black' : 'text-emerald-500/60'}`}>
                  {String(pad.id).padStart(2, '0')}
                </span>
                {isRecording && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <div className="flex flex-col">
                <span className={`font-bold text-[10px] ${isActive ? 'text-black' : 'text-emerald-400'}`}>
                  {pad.label}
                </span>
                <span className={`text-[8px] truncate ${isActive ? 'text-black/80' : 'text-emerald-600'}`}>
                  {pad.sampleName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};