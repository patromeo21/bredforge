// ============================================================================
// BREDFORGE v1.0 — GLOBAL FX & PUNCH-IN MACRO LABORATORY [REF: FX-LAB-01]
// ============================================================================

import React, { useState } from 'react';

export interface FxMacroConfig {
  filterCutoff: number; // Hz (20 to 20000)
  filterResonance: number; // Q (0.1 to 20)
  bitcrushBits: number; // Bits (4 to 16)
  sampleRateReduction: number; // 1 to 8
  tapeStopDuration: number; // ms (100 to 2000)
  gaterDivision: string; // "1/4", "1/8", "1/16", "1/32"
  reverbSend: number; // 0 to 100%
  delayFeedback: number; // 0 to 100%
}

interface GlobalFxViewProps {
  initialConfig?: Partial<FxMacroConfig>;
  onUpdateConfig?: (config: FxMacroConfig) => void;
}

export function GlobalFxView({
  initialConfig,
  onUpdateConfig,
}: GlobalFxViewProps) {
  const [config, setConfig] = useState<FxMacroConfig>({
    filterCutoff: initialConfig?.filterCutoff ?? 8500,
    filterResonance: initialConfig?.filterResonance ?? 4.5,
    bitcrushBits: initialConfig?.bitcrushBits ?? 12,
    sampleRateReduction: initialConfig?.sampleRateReduction ?? 2,
    tapeStopDuration: initialConfig?.tapeStopDuration ?? 500,
    gaterDivision: initialConfig?.gaterDivision ?? '1/16',
    reverbSend: initialConfig?.reverbSend ?? 25,
    delayFeedback: initialConfig?.delayFeedback ?? 35,
  });

  const [activePreset, setActivePreset] = useState<string>('DEFAULT');

  const updateParam = <K extends keyof FxMacroConfig>(key: K, value: FxMacroConfig[K]) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      if (onUpdateConfig) onUpdateConfig(next);
      return next;
    });
  };

  const handlePresetSelect = (presetName: string) => {
    setActivePreset(presetName);
    let preset: FxMacroConfig;
    switch (presetName) {
      case 'LO-FI CRUSH':
        preset = { filterCutoff: 4200, filterResonance: 2.0, bitcrushBits: 8, sampleRateReduction: 4, tapeStopDuration: 300, gaterDivision: '1/32', reverbSend: 15, delayFeedback: 20 };
        break;
      case 'DUB ECHO':
        preset = { filterCutoff: 12000, filterResonance: 1.2, bitcrushBits: 16, sampleRateReduction: 1, tapeStopDuration: 800, gaterDivision: '1/8', reverbSend: 45, delayFeedback: 75 };
        break;
      case 'INDUSTRIAL':
        preset = { filterCutoff: 18000, filterResonance: 12.0, bitcrushBits: 6, sampleRateReduction: 6, tapeStopDuration: 200, gaterDivision: '1/16', reverbSend: 30, delayFeedback: 10 };
        break;
      default:
        preset = { filterCutoff: 8500, filterResonance: 4.5, bitcrushBits: 12, sampleRateReduction: 2, tapeStopDuration: 500, gaterDivision: '1/16', reverbSend: 25, delayFeedback: 35 };
        break;
    }
    setConfig(preset);
    if (onUpdateConfig) onUpdateConfig(preset);
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-3 gap-3 select-none overflow-hidden border border-zinc-800 rounded-lg">
      
      {/* Header: Macro Laboratory Title & Preset Manager */}
      <div className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-lg shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 tracking-wider">
            GLOBAL FX // PUNCH-IN MACRO LABORATORY
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            DSP BRIDGE: ACTIVE
          </span>
        </div>

        {/* Preset Selector */}
        <div className="flex gap-1">
          {['DEFAULT', 'LO-FI CRUSH', 'DUB ECHO', 'INDUSTRIAL'].map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetSelect(preset)}
              className={`px-2.5 py-1 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                activePreset === preset
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Main Parameters Grid Viewport */}
      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 min-h-0 overflow-y-auto">
        
        {/* 1. Filter Cutoff & Resonance */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="text-[11px] font-bold text-amber-400">RESONANT FILTER</span>
            <span className="text-[9px] text-zinc-500">DFX-1</span>
          </div>

          <div className="flex flex-col gap-3 my-auto">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">CUTOFF:</span>
                <span className="text-sky-400 font-bold">{config.filterCutoff} Hz</span>
              </div>
              <input
                type="range"
                min="20"
                max="20000"
                step="100"
                value={config.filterCutoff}
                onChange={(e) => updateParam('filterCutoff', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">RESONANCE (Q):</span>
                <span className="text-sky-400 font-bold">{config.filterResonance.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.5"
                value={config.filterResonance}
                onChange={(e) => updateParam('filterResonance', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
          <span className="text-[8px] text-zinc-500 text-center pt-2 border-t border-zinc-800">M8 D-Pad Macro Target</span>
        </div>

        {/* 2. Bitcrusher & Sample Rate Reduction */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="text-[11px] font-bold text-amber-400">LO-FI CRUSH</span>
            <span className="text-[9px] text-zinc-500">DFX-2</span>
          </div>

          <div className="flex flex-col gap-3 my-auto">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">BIT DEPTH:</span>
                <span className="text-sky-400 font-bold">{config.bitcrushBits} BITS</span>
              </div>
              <input
                type="range"
                min="4"
                max="16"
                step="1"
                value={config.bitcrushBits}
                onChange={(e) => updateParam('bitcrushBits', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">DOWNSAMPLE:</span>
                <span className="text-sky-400 font-bold">{config.sampleRateReduction}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={config.sampleRateReduction}
                onChange={(e) => updateParam('sampleRateReduction', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
          <span className="text-[8px] text-zinc-500 text-center pt-2 border-t border-zinc-800">[OPTION] Key Punch Target</span>
        </div>

        {/* 3. Tape Stop & Gater Stutter */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="text-[11px] font-bold text-amber-400">TAPE & GATER</span>
            <span className="text-[9px] text-zinc-500">DFX-3</span>
          </div>

          <div className="flex flex-col gap-3 my-auto">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">TAPE STOP TIME:</span>
                <span className="text-sky-400 font-bold">{config.tapeStopDuration} ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={config.tapeStopDuration}
                onChange={(e) => updateParam('tapeStopDuration', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-400 mb-1">GATER DIVISION:</span>
              <div className="grid grid-cols-4 gap-1">
                {['1/4', '1/8', '1/16', '1/32'].map((div) => (
                  <button
                    key={div}
                    onClick={() => updateParam('gaterDivision', div)}
                    className={`py-1 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                      config.gaterDivision === div
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    {div}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <span className="text-[8px] text-zinc-500 text-center pt-2 border-t border-zinc-800">[EDIT] / [SHIFT] Targets</span>
        </div>

        {/* 4. Spatial Sends (Reverb & Delay) */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="text-[11px] font-bold text-amber-400">SPATIAL SENDS</span>
            <span className="text-[9px] text-zinc-500">DFX-4</span>
          </div>

          <div className="flex flex-col gap-3 my-auto">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">REVERB SEND:</span>
                <span className="text-sky-400 font-bold">{config.reverbSend}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.reverbSend}
                onChange={(e) => updateParam('reverbSend', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">DELAY FEEDBACK:</span>
                <span className="text-sky-400 font-bold">{config.delayFeedback}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.delayFeedback}
                onChange={(e) => updateParam('delayFeedback', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
          <span className="text-[8px] text-zinc-500 text-center pt-2 border-t border-zinc-800">Auxiliary Bus Routing</span>
        </div>

      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[9px] text-zinc-500 px-1 shrink-0">
        <span>Parameter adjustments take effect instantaneously across all live M8 punch-in performance macros.</span>
        <span className="text-emerald-400 font-bold">LABORATORY: ONLINE</span>
      </div>

    </div>
  );
}

export default GlobalFxView;
