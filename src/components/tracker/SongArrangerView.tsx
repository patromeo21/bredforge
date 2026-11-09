// ============================================================================
// BREDFORGE v1.0 — SONG ARRANGER & CHAIN VIEW [REF: ARRANGER-01]
// ============================================================================

import React, { useState, useEffect } from 'react';
import { patternQueueManager } from '../../services/PatternQueueManager';

interface SongRow {
  rowId: number;
  tracks: (number | null)[]; // Pattern ID (0-15) or null for empty step
}

export function SongArrangerView() {
  const [numTracks, setNumTracks] = useState<number>(4);
  const [numRows, setNumRows] = useState<number>(32);
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedTrack, setSelectedTrack] = useState<number>(0);

  // Initialize a 32-row song arrangement grid across 4 tracks
  const [songMatrix, setSongMatrix] = useState<SongRow[]>(() =>
    Array.from({ length: 32 }, (_, rowIndex) => ({
      rowId: rowIndex,
      tracks: [
        rowIndex < 16 ? rowIndex % 4 : null, // Track 1 pattern sequence
        rowIndex >= 8 && rowIndex < 24 ? (rowIndex % 4) + 4 : null, // Track 2
        rowIndex >= 16 ? (rowIndex % 4) + 8 : null, // Track 3
        rowIndex % 8 === 0 ? 12 : null, // Track 4 percussion/fx
      ],
    }))
  );

  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      const intervalMs = 60000 / 124.0 / 4; // 16th note step tick at 124 BPM
      timer = window.setInterval(() => {
        setCurrentRow((prev) => (prev + 1) % numRows);
      }, intervalMs);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isPlaying, numRows]);

  const toggleCellPattern = (rowIndex: number, trackIndex: number) => {
    setSongMatrix((prevMatrix) =>
      prevMatrix.map((row, rIdx) => {
        if (rIdx !== rowIndex) return row;
        const newTracks = [...row.tracks];
        const currentVal = newTracks[trackIndex];
        // Cycle through null -> 0..15 -> null
        if (currentVal === null) {
          newTracks[trackIndex] = 0;
        } else if (currentVal < 15) {
          newTracks[trackIndex] = currentVal + 1;
        } else {
          newTracks[trackIndex] = null;
        }
        return { ...row, tracks: newTracks };
      })
    );
  };

  const clearRow = (rowIndex: number) => {
    setSongMatrix((prev) =>
      prev.map((r, idx) => (idx === rowIndex ? { ...r, tracks: Array(numTracks).fill(null) } : r))
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-3 gap-3 select-none overflow-hidden border border-zinc-800 rounded-lg">
      
      {/* Arranger Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-lg gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            SONG ARRANGER // CHAIN MATRIX
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            {isPlaying ? `PLAYING ROW ${currentRow < 9 ? '0' + (currentRow + 1) : currentRow + 1}` : 'STOPPED'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className={`px-3 py-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
              isPlaying
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                : 'bg-zinc-950 text-emerald-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {isPlaying ? '■ STOP SONG' : '▶ PLAY SONG'}
          </button>

          <button
            onClick={() => setCurrentRow(0)}
            className="px-2.5 py-1 text-[10px] font-bold bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-zinc-700 rounded cursor-pointer"
          >
            REWIND TO 00
          </button>
        </div>
      </div>

      {/* Song Grid Arranger Header (Track Columns) */}
      <div className="grid grid-cols-6 gap-2 bg-zinc-900/40 border border-zinc-800 px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-400 shrink-0 text-center">
        <span>ROW</span>
        <span>TRACK 01</span>
        <span>TRACK 02</span>
        <span>TRACK 03</span>
        <span>TRACK 04</span>
        <span>ACTIONS</span>
      </div>

      {/* Scrollable Song Rows Matrix */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1">
        {songMatrix.map((row, rIdx) => {
          const isCurrentPlayRow = isPlaying && currentRow === rIdx;

          return (
            <div
              key={row.rowId}
              className={`grid grid-cols-6 gap-2 items-center px-3 py-1.5 rounded-lg border transition-all ${
                isCurrentPlayRow
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-zinc-900/30 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {/* Row Number */}
              <div className="flex items-center justify-center font-bold text-xs text-zinc-400">
                {rIdx < 9 ? `0${rIdx + 1}` : rIdx + 1}
              </div>

              {/* Track Cells (0 to 3) */}
              {row.tracks.map((patId, tIdx) => {
                const hasPattern = patId !== null;

                return (
                  <button
                    key={tIdx}
                    onClick={() => toggleCellPattern(rIdx, tIdx)}
                    className={`py-1 text-center text-xs font-mono font-bold rounded border cursor-pointer transition-all ${
                      hasPattern
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-inner'
                        : 'bg-zinc-950 text-zinc-600 border-zinc-800/60 hover:text-zinc-400'
                    }`}
                  >
                    {hasPattern ? `PAT ${patId < 9 ? '0' + (patId + 1) : patId + 1}` : '---'}
                  </button>
                );
              })}

              {/* Row Action */}
              <div className="flex justify-center">
                <button
                  onClick={() => clearRow(rIdx)}
                  className="px-2 py-0.5 text-[8px] bg-zinc-950 text-zinc-500 hover:text-red-400 border border-zinc-800 rounded cursor-pointer"
                >
                  CLEAR
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Instructions */}
      <div className="flex justify-between items-center text-[9px] text-zinc-500 px-1 shrink-0">
        <span>Click any cell to assign or cycle pattern blocks across song tracks.</span>
        <span className="text-amber-400 font-bold">M8 SONG ARRANGER</span>
      </div>

    </div>
  );
}

export default SongArrangerView;
