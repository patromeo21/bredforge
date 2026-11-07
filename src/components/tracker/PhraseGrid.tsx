// ============================================================================
// BREDFORGE v1.0 — TRACKER PHRASE GRID WITH EDITING SHORTCUTS (PhraseGrid.tsx)
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { usePhrasePlayback } from '../../hooks/usePhrasePlayback';

export interface PhraseStep {
  step: number;
  note: string;       // "C-4", "D#4", "---"
  velocity: string;   // Hex "00"-"7F"
  instrument: string; // Hex "00"-"FF"
  fx1: string;        // "V08", "---"
  fx2: string;        // "---"
}

const NOTE_NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];

export const PhraseGrid: React.FC = () => {
  const [cursorRow, setCursorRow] = useState<number>(0);
  const [cursorCol, setCursorCol] = useState<number>(1); // Default to NOTE column (col 1)

  const [steps, setSteps] = useState<PhraseStep[]>(
    Array.from({ length: 16 }).map((_, idx) => ({
      step: idx,
      note: idx % 4 === 0 ? 'C-4' : '---',
      velocity: idx % 4 === 0 ? '64' : '--',
      instrument: idx % 4 === 0 ? '00' : '--',
      fx1: idx === 0 ? 'V08' : '---',
      fx2: '---',
    }))
  );

  // Hook into playback clock with steps state
  const { activeStep } = usePhrasePlayback(steps);

  const columns = ['STEP', 'NOTE', 'VEL', 'INST', 'FX1', 'FX2'];

  // Helper to adjust hex values
  const adjustHex = (currentHex: string, delta: number, maxHex = 0x7f): string => {
    if (currentHex === '--' || currentHex === '---') {
      return (delta > 0 ? 0 : maxHex).toString(16).toUpperCase().padStart(2, '0');
    }
    const val = parseInt(currentHex, 16);
    if (isNaN(val)) return '00';
    const nextVal = Math.min(maxHex, Math.max(0, val + delta));
    return nextVal.toString(16).toUpperCase().padStart(2, '0');
  };

  // Helper to adjust MIDI notes
  const adjustNote = (currentNote: string, semitones: number): string => {
    if (currentNote === '---') return 'C-4';
    const name = currentNote.substring(0, 2);
    const octave = parseInt(currentNote.substring(2), 10);
    const idx = NOTE_NAMES.indexOf(name);
    if (idx === -1 || isNaN(octave)) return 'C-4';

    let totalSemitones = (octave + 1) * 12 + idx + semitones;
    totalSemitones = Math.min(127, Math.max(0, totalSemitones));

    const nextOctave = Math.floor(totalSemitones / 12) - 1;
    const nextNoteName = NOTE_NAMES[totalSemitones % 12];
    return `${nextNoteName}${nextOctave}`;
  };

  // Keyboard Event Listener for Step Editing
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 1. Navigation Keys (Plain Arrow Keys)
    if (!e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursorRow((prev) => (prev > 0 ? prev - 1 : 15));
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursorRow((prev) => (prev < 15 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCursorCol((prev) => (prev > 1 ? prev - 1 : 5));
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCursorCol((prev) => (prev < 5 ? prev + 1 : 1));
        return;
      }
    }

    // 2. Clear Cell / Reset (Option + Edit / Alt + Delete / Backspace)
    if (e.key === 'Backspace' || e.key === 'Delete' || (e.altKey && e.key === 'z')) {
      e.preventDefault();
      setSteps((prevSteps) => {
        const next = [...prevSteps];
        const step = { ...next[cursorRow] };
        if (cursorCol === 1) step.note = '---';
        if (cursorCol === 2) step.velocity = '--';
        if (cursorCol === 3) step.instrument = '--';
        if (cursorCol === 4) step.fx1 = '---';
        if (cursorCol === 5) step.fx2 = '---';
        next[cursorRow] = step;
        return next;
      });
      return;
    }

    // 3. Insert Default Note (Spacebar on empty NOTE cell)
    if (e.code === 'Space' && cursorCol === 1) {
      e.preventDefault();
      setSteps((prevSteps) => {
        const next = [...prevSteps];
        const step = { ...next[cursorRow] };
        step.note = step.note === '---' ? 'C-4' : '---';
        if (step.note !== '---' && step.velocity === '--') step.velocity = '64';
        if (step.note !== '---' && step.instrument === '--') step.instrument = '00';
        next[cursorRow] = step;
        return next;
      });
      return;
    }

    // 4. Value Editing (Shift / Enter / Edit + Arrow Keys)
    const isEditModifier = e.shiftKey || e.altKey;

    if (isEditModifier) {
      let semitoneDelta = 0;
      let hexDelta = 0;

      if (e.key === 'ArrowUp') {
        semitoneDelta = 12; // Coarse: +1 Octave
        hexDelta = 0x10;    // Coarse: +16 Hex
      } else if (e.key === 'ArrowDown') {
        semitoneDelta = -12; // Coarse: -1 Octave
        hexDelta = -0x10;    // Coarse: -16 Hex
      } else if (e.key === 'ArrowRight') {
        semitoneDelta = 1;   // Fine: +1 Semitone
        hexDelta = 1;        // Fine: +1 Hex
      } else if (e.key === 'ArrowLeft') {
        semitoneDelta = -1;  // Fine: -1 Semitone
        hexDelta = -1;       // Fine: -1 Hex
      }

      if (semitoneDelta !== 0 || hexDelta !== 0) {
        e.preventDefault();
        setSteps((prevSteps) => {
          const next = [...prevSteps];
          const step = { ...next[cursorRow] };

          // NOTE Column
          if (cursorCol === 1) {
            step.note = adjustNote(step.note, semitoneDelta);
          }
          // VELOCITY Column
          else if (cursorCol === 2) {
            step.velocity = adjustHex(step.velocity, hexDelta, 0x7f);
          }
          // INSTRUMENT Column
          else if (cursorCol === 3) {
            step.instrument = adjustHex(step.instrument, hexDelta, 0xff);
          }

          next[cursorRow] = step;
          return next;
        });
      }
    }
  }, [cursorRow, cursorCol]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl select-none font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-slate-100 text-sm tracking-wider">
            PHRASE GRID // EDIT MODE
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            16-Step Grid with Keyboard Navigation & Dynamic Parameter Editing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold">
            PLAYHEAD: STEP {activeStep.toString(16).toUpperCase().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Tracker Grid Table */}
      <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-900/40 p-2">
        <div className="grid grid-cols-6 gap-2 border-b border-slate-800 pb-2 text-[10px] text-slate-500 font-bold text-center">
          {columns.map((col, idx) => (
            <div key={col} className={cursorCol === idx ? 'text-emerald-400 underline font-bold' : ''}>
              {col}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1 mt-2">
          {steps.map((s, rowIdx) => {
            const isCursorRow = cursorRow === rowIdx;
            const isPlayheadRow = activeStep === rowIdx;

            return (
              <div
                key={s.step}
                onClick={() => setCursorRow(rowIdx)}
                className={`grid grid-cols-6 gap-2 items-center text-center py-1 rounded cursor-pointer transition-colors ${
                  isCursorRow
                    ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-bold'
                    : isPlayheadRow
                    ? 'bg-cyan-500/10 border border-cyan-500/50 text-cyan-200'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                {/* Step Index */}
                <div className={`font-bold ${isPlayheadRow ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {isPlayheadRow ? '▶ ' : ''}{rowIdx.toString(16).toUpperCase().padStart(2, '0')}
                </div>
                {/* Note */}
                <div className={isCursorRow && cursorCol === 1 ? 'bg-emerald-400 text-slate-950 font-bold px-1 rounded' : ''}>
                  {s.note}
                </div>
                {/* Velocity */}
                <div className={isCursorRow && cursorCol === 2 ? 'bg-emerald-400 text-slate-950 font-bold px-1 rounded' : ''}>
                  {s.velocity}
                </div>
                {/* Instrument */}
                <div className={isCursorRow && cursorCol === 3 ? 'bg-emerald-400 text-slate-950 font-bold px-1 rounded' : ''}>
                  {s.instrument}
                </div>
                {/* FX 1 */}
                <div className={isCursorRow && cursorCol === 4 ? 'bg-emerald-400 text-slate-950 font-bold px-1 rounded' : ''}>
                  {s.fx1}
                </div>
                {/* FX 2 */}
                <div className={isCursorRow && cursorCol === 5 ? 'bg-emerald-400 text-slate-950 font-bold px-1 rounded' : ''}>
                  {s.fx2}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls Reference */}
      <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-800">
        [ARROWS]: Navigate | [SHIFT/ALT + ARROWS]: Edit Value | [SPACE]: Toggle Note | [BACKSPACE]: Clear Cell
      </div>
    </div>
  );
};