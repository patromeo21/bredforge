// ============================================================================
// STAGE E - PHASE 29: VERTICAL CHAIN/ARRANGEMENT VIEW PORTS (ArrangerGrid.tsx)
// ============================================================================

import React from 'react';
import { ProjectStateSchema } from '../../services/tracker/TrackerState';

export interface ArrangerGridProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: 'chain' | 'song';
  projectState: ProjectStateSchema;
  activeRowIndex?: number;
  selectedRowIndex?: number;
  onSelectRow?: (rowIndex: number) => void;
  [key: string]: any;
}

export const ArrangerGrid: React.FC<ArrangerGridProps> = ({
  mode,
  projectState,
  activeRowIndex = -1,
  selectedRowIndex = 0,
  onSelectRow,
  ...restProps
}) => {
  const chains = projectState.chains || { '01': ['01'] };
  const songTimeline = projectState.songTimeline || [];

  return (
    <div
      {...restProps}
      className="flex flex-col w-full font-mono text-xs select-none gap-1 overflow-y-auto pr-1"
    >
      {/* CHAIN MODE VIEWPORT */}
      {mode === 'chain' && (
        <>
          {/* Column Headers */}
          <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-zinc-900 border-b border-emerald-500/30 font-bold text-emerald-400">
            <div className="text-center">STEP</div>
            <div className="text-center">PHRASE ID</div>
            <div className="text-center">TRANSPOSE</div>
            <div className="text-center">LOOP MARKER</div>
          </div>

          {/* 16 Chain Arranger Rows */}
          {Array.from({ length: 16 }).map((_, idx) => {
            const isPlayhead = activeRowIndex === idx;
            const isSelected = selectedRowIndex === idx;
            const isBeatInterval = idx % 4 === 0;

            const activeChainKey = projectState.activePhrase || '01';
            const chainPhrases = chains[activeChainKey] || ['01'];
            const phraseId = chainPhrases[idx] || '--';

            let rowStyle = 'bg-transparent text-emerald-500';
            if (isPlayhead) {
              rowStyle = 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_#10b981]';
            } else if (isSelected) {
              rowStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50';
            } else if (isBeatInterval) {
              rowStyle = 'bg-zinc-900/60 text-emerald-500/90';
            }

            return (
              <div
                key={idx}
                onClick={() => onSelectRow && onSelectRow(idx)}
                className={`grid grid-cols-4 gap-2 px-3 py-2 rounded items-center transition-colors cursor-pointer ${rowStyle}`}
              >
                <div className="text-center font-bold tracking-wider">
                  {isPlayhead ? '▶ ' : ''}{idx.toString(16).toUpperCase().padStart(2, '0')}
                </div>
                <div className="text-center font-semibold">
                  [{phraseId}]
                </div>
                <div className="text-center">
                  +00 ST
                </div>
                <div className="text-center">
                  {idx === 15 ? 'END' : '--'}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* SONG MODE VIEWPORT */}
      {mode === 'song' && (
        <>
          {/* Column Headers */}
          <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-zinc-900 border-b border-emerald-500/30 font-bold text-emerald-400">
            <div className="text-center">SECTION</div>
            <div className="text-center">PHRASE KEY</div>
            <div className="text-center">REPEATS</div>
            <div className="text-center">TRACK MUTES</div>
          </div>

          {/* Global Song Timeline Rows */}
          {songTimeline.map((row, idx) => {
            const isPlayhead = activeRowIndex === idx;
            const isSelected = selectedRowIndex === idx;

            let rowStyle = 'bg-transparent text-emerald-500';
            if (isPlayhead) {
              rowStyle = 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_#10b981]';
            } else if (isSelected) {
              rowStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50';
            } else if (idx % 2 === 0) {
              rowStyle = 'bg-zinc-900/50 text-emerald-500/90';
            }

            const muteStr = row.muteStates ? row.muteStates.map((m) => (m ? 'M' : 'o')).join(' ') : 'o o o o';

            return (
              <div
                key={row.rowId || idx}
                onClick={() => onSelectRow && onSelectRow(idx)}
                className={`grid grid-cols-4 gap-2 px-3 py-2 rounded items-center transition-colors cursor-pointer ${rowStyle}`}
              >
                <div className="text-center font-bold tracking-wider">
                  {isPlayhead ? '▶ ' : ''}ROW {String(row.rowId || idx + 1).padStart(2, '0')}
                </div>
                <div className="text-center font-semibold">
                  [{row.phraseKey || '01'}]
                </div>
                <div className="text-center">
                  x{row.repeatCount || 1}
                </div>
                <div className="text-center tracking-widest text-[11px]">
                  [{muteStr}]
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};