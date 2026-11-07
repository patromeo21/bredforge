import React, { useEffect, useRef, useState } from 'react';
import { PunchInEffectBus } from '../../services/audio/PunchInEffectBus';
import { PerformanceMacroEngine, MacroMode } from '../../services/audio/PerformanceMacroEngine';
import './TrackerTheme.css';

export const TrackerLayout: React.FC = () => {
  const macroEngineRef = useRef<PerformanceMacroEngine | null>(null);
  const [activeMacro, setActiveMacro] = useState<MacroMode>('none');

  useEffect(() => {
    // Initialize AudioContext and DSP buses on first user interaction
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const effectBus = new PunchInEffectBus(audioCtx);
    effectBus.connect(audioCtx.destination);

    macroEngineRef.current = new PerformanceMacroEngine(effectBus);

    return () => {
      effectBus.dispose();
    };
  }, []);

  const handleMacroDown = (mode: MacroMode) => {
    if (macroEngineRef.current) {
      macroEngineRef.current.pressMacroButton(mode);
      setActiveMacro(mode);
    }
  };

  const handleMacroUp = () => {
    if (macroEngineRef.current) {
      macroEngineRef.current.releaseMacroButton();
      setActiveMacro('none');
    }
  };

  return (
    <div className="bredforge-root bredforge-viewport-lock flex flex-col justify-between p-4">
      {/* Top Header */}
      <header className="flex justify-between items-center border-b border-gray-800 pb-2">
        <h1 className="text-xl font-bold tracking-widest text-emerald-400">BREDFORGE v1.0</h1>
        <div className="text-xs text-gray-400">iPad 9th Gen | Hardware Engine Active</div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-sm text-gray-400">Tracker Grid & Phrase Viewport</div>
        
        {/* SP-Style Momentary Performance Pads */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-6">
          <button
            onPointerDown={() => handleMacroDown('punchInFilter')}
            onPointerUp={handleMacroUp}
            onPointerCancel={handleMacroUp}
            className={`p-6 rounded-lg font-bold text-center gpu-accelerated-cell transition-all touch-none select-none ${
              activeMacro === 'punchInFilter'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 scale-95'
                : 'bg-gray-800 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            FILTER SLAM
          </button>

          <button
            onPointerDown={() => handleMacroDown('bitcrushSlam')}
            onPointerUp={handleMacroUp}
            onPointerCancel={handleMacroUp}
            className={`p-6 rounded-lg font-bold text-center gpu-accelerated-cell transition-all touch-none select-none ${
              activeMacro === 'bitcrushSlam'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50 scale-95'
                : 'bg-gray-800 text-amber-400 border border-amber-500/30'
            }`}
          >
            BITCRUSH SLAM
          </button>
        </div>
      </main>

      {/* Footer Status */}
      <footer className="text-center text-xs text-gray-600 pb-2">
        M8 Precision Engine • SP Punch-In Architecture
      </footer>
    </div>
  );
};

export default TrackerLayout;