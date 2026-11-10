// ============================================================================
// BREDFORGE v1.0 — CORE M8 TRACKER GRID MATRIX [REF: TRACKER-GRID-01]
// ============================================================================

import React, { useState, useEffect } from 'react';
import { transportService } from '../../services/TransportService';
import { audioEngine } from '../../services/AudioEngine';

interface TrackerRowData {
  note: string;
  instrument: string;
  volume: string;
  fx: string;
}

// 16 rows pattern mock data state (4 tracks per row)
const DEFAULT_PATTERN_ROWS: TrackerRowData[][] = Array.from({ length: 16 }, (_, rowIndex) => [
  {
    note: rowIndex % 4 === 0 ? 'C-4' : '---',
    instrument: rowIndex % 4 === 0 ? '01' : '--',
    volume: rowIndex % 4 === 0 ? '64' : '--',
    fx: '---',
  },
  {
    note: rowIndex % 8 === 4 ? 'E-4' : '---',
    instrument: rowIndex % 8 === 4 ? '02' : '--',
    volume: rowIndex % 8 === 4 ? '50' : '--',
    fx: '---',
  },
  {
    note: rowIndex % 2 === 0 ? 'G-3' : '---',
    instrument: rowIndex % 2 === 0 ? '03' : '--',
    volume: rowIndex % 2 === 0 ? '40' : '--',
    fx: '---',
  },
  {
    note: rowIndex === 12 ? 'C-5' : '---',
    instrument: rowIndex === 12 ? '04' : '--',
    volume: rowIndex === 12 ? '7F' : '--',
    fx: '---',
  },
]);

export function TrackerGrid() {
  const [activeRow, setActiveRow] = useState<number>(0);
  const [selectedCell, setSelectedCell] = useState<{ row: number; track: number } | null>(null);
  const [rowsData] = useState<TrackerRowData[][]>(DEFAULT_PATTERN_ROWS);

  useEffect(() => {
    // Subscribe to high-precision transport ticks
    const unsubscribeTicks = transportService.subscribeTicks((_step: number, row: number) => {
      setActiveRow(row);
      
      // Trigger audio test sounds on quarter notes when transport is playing
      if (row % 4 === 0) {
        audioEngine.triggerPad(row / 4, 90);
      }
    });

    return () => {
      unsubscribeTicks();
    };
  }, []);

  const handleCellClick = (rowIndex: number, trackIndex: number) => {
    setSelectedCell({ row: rowIndex, track: trackIndex });
    // Preview sample audio on cell selection tap
    audioEngine.triggerPad(trackIndex, 100);
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 font-mono text-xs select-none overflow-hidden border border-zinc-800 rounded-xl">
      
      {/* Tracker Grid Header Bar */}
      <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr] bg-zinc-900 border-b border-zinc-800 px-2 py-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
        <div className="text-zinc-500">ROW</div>
        <div className="text-amber-500/90 text-center">T1 (KICK)</div>
        <div className="text-cyan-500/90 text-center">T2 (SNARE)</div>
        <div className="text-emerald-500/90 text-center">T3 (HIHAT)</div>
        <div className="text-rose-500/90 text-center">T4 (SYNTH)</div>
      </div>

      {/* Rows Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60 p-1">
        {rowsData.map((trackCols, rowIndex) => {
          const isCurrentPlaybackRow = activeRow === rowIndex;

          return (
            <div
              key={rowIndex}
              className={`grid grid-cols-[50px_1fr_1fr_1fr_1fr] items-center px-1 py-1 transition-colors rounded ${
                isCurrentPlaybackRow
                  ? 'bg-amber-500/20 border-l-4 border-amber-500 text-amber-300 font-bold'
                  : 'hover:bg-zinc-900/40 text-zinc-400'
              }`}
            >
              {/* Row Number Indicator */}
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span className={isCurrentPlaybackRow ? 'text-amber-400 font-bold' : 'text-zinc-600'}>
                  {rowIndex < 10 ? `0${rowIndex}` : rowIndex}
                </span>
                {isCurrentPlaybackRow && <span className="text-[9px] text-amber-400">▶</span>}
              </div>

              {/* 4 Tracker Columns */}
              {trackCols.map((cell, trackIndex) => {
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.track === trackIndex;

                return (
                  <div
                    key={trackIndex}
                    onClick={() => handleCellClick(rowIndex, trackIndex)}
                    className={`flex items-center justify-center gap-1.5 py-1 px-1 rounded cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-zinc-800 border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : isCurrentPlaybackRow
                        ? 'border-amber-500/20'
                        : 'border-transparent hover:border-zinc-800 hover:bg-zinc-900/60'
                    }`}
                  >
                    {/* Note */}
                    <span className={`font-bold ${cell.note !== '---' ? 'text-zinc-100' : 'text-zinc-700'}`}>
                      {cell.note}
                    </span>
                    {/* Instrument Index */}
                    <span className={`text-[10px] ${cell.instrument !== '--' ? 'text-amber-400' : 'text-zinc-700'}`}>
                      {cell.instrument}
                    </span>
                    {/* Volume / FX */}
                    <span className={`text-[10px] ${cell.volume !== '--' ? 'text-emerald-400' : 'text-zinc-800'}`}>
                      {cell.volume}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default TrackerGrid;
