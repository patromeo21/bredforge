// ============================================================================
// STAGE E - PHASE 30: TACTICAL 4x4 MPC-STYLE PAD GRID SCREEN LAYER (PadMatrix.tsx)
// ============================================================================

import React, { useState, useCallback } from 'react';
import { DEFAULT_PERFORMANCE_FX_MAP } from '../../services/tracker/TrackerState';

export interface PadMatrixProps extends React.HTMLAttributes<HTMLDivElement> {
  activeBankIndex?: number; // 0=A (0-15), 1=B (16-31), 2=C (32-47), 3=D (48-63)
  isPerformanceMode?: boolean;
  onPadTrigger?: (bankIndex: number, padIndex: number, hexId: string) => void;
  [key: string]: any;
}

export const PadMatrix: React.FC<PadMatrixProps> = ({
  activeBankIndex = 0,
  isPerformanceMode = false,
  onPadTrigger,
  ...restProps
}) => {
  const [activePads, setActivePads] = useState<boolean[]>(Array(16).fill(false));

  const handlePadDown = useCallback((padIndex: number) => {
    setActivePads((prev) => {
      const next = [...prev];
      next[padIndex] = true;
      return next;
    });

    const absoluteIndex = (activeBankIndex * 16) + padIndex;
    const hexId = absoluteIndex.toString(16).toUpperCase().padStart(2, '0');

    if (onPadTrigger) {
      onPadTrigger(activeBankIndex, padIndex, hexId);
    }

    setTimeout(() => {
      setActivePads((prev) => {
        const next = [...prev];
        next[padIndex] = false;
        return next;
      });
    }, 120);
  }, [activeBankIndex, onPadTrigger]);

  const bankLetters = ['A', 'B', 'C', 'D'];
  const currentBankLabel = bankLetters[activeBankIndex] || 'A';

  return (
    <div
      {...restProps}
      className="flex flex-col w-full font-mono select-none gap-2 p-3 bg-zinc-950 border border-emerald-500/30 rounded shadow-[0_0_15px_rgba(16,185,129,0.1)]"
    >
      {/* Pad Matrix Header Bar */}
      <div className="flex justify-between items-center text-xs text-emerald-400 border-b border-emerald-500/20 pb-2">
        <span className="font-bold tracking-wider">PAD BANK [{currentBankLabel}]</span>
        <span className="text-[10px] text-emerald-600">
          {isPerformanceMode ? 'MODE: PERFORMANCE FX' : 'MODE: NOTE CHOP'}
        </span>
      </div>

      {/* 4x4 MPC Tactile Pad Grid */}
      <div className="grid grid-cols-4 gap-2.5">
        {Array.from({ length: 16 }).map((_, padIdx) => {
          const absoluteIndex = (activeBankIndex * 16) + padIdx;
          const hexId = absoluteIndex.toString(16).toUpperCase().padStart(2, '0');
          const isPressed = activePads[padIdx];

          // Query performance FX map if in performance mode
          let displayLabel = hexId;
          let subLabel = `NOTE ${absoluteIndex}`;
          if (isPerformanceMode) {
            const fxConfig = DEFAULT_PERFORMANCE_FX_MAP[padIdx];
            if (fxConfig && fxConfig.fxType !== 'bypass') {
              displayLabel = fxConfig.fxType.substring(0, 5).toUpperCase();
              subLabel = `PARAM ${fxConfig.defaultParam}`;
            } else {
              displayLabel = `FX-${padIdx}`;
              subLabel = 'BYPASS';
            }
          }

          return (
            <button
              key={padIdx}
              onMouseDown={() => handlePadDown(padIdx)}
              onTouchStart={(e) => { e.preventDefault(); handlePadDown(padIdx); }}
              className={`aspect-square flex flex-col justify-between p-2 rounded border-2 transition-all cursor-pointer ${
                isPressed
                  ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_15px_#10b981] scale-[0.98]'
                  : 'bg-zinc-900 text-emerald-400 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/80 shadow-inner'
              }`}
            >
              <span className="text-[10px] opacity-70 tracking-widest font-bold">
                {hexId}
              </span>
              <span className="text-sm font-extrabold tracking-wider text-center">
                {displayLabel}
              </span>
              <span className="text-[9px] opacity-60 text-center tracking-tight truncate">
                {subLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};