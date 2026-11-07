// ============================================================================
// BREDFORGE v1.0 — ROOT APPLICATION COMPONENT (App.tsx)
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { MatrixCoordinate, HardwareMode } from './types/matrix';
import { MatrixRouter } from './components/router/MatrixRouter';

export const App: React.FC = () => {
  // 2D Spatial Matrix State (Default to Phrase View: x:3, y:1)
  const [coord, setCoord] = useState<MatrixCoordinate>({ x: 3, y: 1 });
  const [hardwareMode, setHardwareMode] = useState<HardwareMode>('NAV');

  // Handle Shift + Arrow Navigation across the 6x4 matrix
  const handleMatrixNavigation = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setHardwareMode((prev) => (prev === 'NAV' ? 'PUNCH' : 'NAV'));
      return;
    }

    if (e.shiftKey) {
      setCoord((prev) => {
        let { x, y } = prev;
        if (e.key === 'ArrowUp') y = Math.max(0, y - 1);
        if (e.key === 'ArrowDown') y = Math.min(3, y + 1);
        if (e.key === 'ArrowLeft') x = Math.max(0, x - 1);
        if (e.key === 'ArrowRight') x = Math.min(5, x + 1);
        return { x, y };
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleMatrixNavigation);
    return () => window.removeEventListener('keydown', handleMatrixNavigation);
  }, [handleMatrixNavigation]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 p-3 font-mono overflow-hidden">
      {/* Top Hardware HUD Shell */}
      <header className="flex justify-between items-center bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl mb-3 shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-bold text-emerald-400 tracking-widest text-sm">
            BREDFORGE v1.0
          </span>
          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            COORD: ({coord.x}, {coord.y})
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">MODE:</span>
          <span className={`px-2 py-0.5 rounded font-bold ${hardwareMode === 'NAV' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
            [{hardwareMode}]
          </span>
        </div>
      </header>

      {/* Main Viewport Container (Router) */}
      <main className="flex-1 overflow-hidden relative">
        <MatrixRouter coord={coord} hardwareMode={hardwareMode} />
      </main>

      {/* Bottom SP-404SX Punch-In FX Status Bar */}
      <footer className="flex justify-between items-center bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl mt-3 text-[10px] text-slate-400">
        <div className="flex gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-bold">DJFX</span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 font-bold">ISOL</span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-purple-400 font-bold">CHOR</span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-bold">LOFI</span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-rose-400 font-bold">VERB</span>
        </div>
        <div>
          [SHIFT + ARROWS]: Move Viewport | [TAB]: Toggle Mode
        </div>
      </footer>
    </div>
  );
};

export default App;