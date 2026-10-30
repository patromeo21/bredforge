import React, { useState } from 'react';

/**
 * Addon Module: Filter Routing & Resonant Controls Deck
 * Layout: Left-Side Bento Deck placement
 * Pure JavaScript / React JSX implementation for BredForge M8 tracker.
 */
export default function FilterRoutingAddon({ onFilterChange }) {
  const [filterType, setFilterType] = useState('lowpass'); // 'lowpass' | 'highpass' | 'bandpass'
  const [cutoff, setCutoff] = useState(20000);             // 20Hz to 20000Hz
  const [resonance, setResonance] = useState(1.0);         // 0.1 to 20.0
  const [envAmount, setEnvAmount] = useState(0);           // -100 to +100 %

  const handleTypeChange = (type) => {
    setFilterType(type);
    if (onFilterChange) onFilterChange({ type, cutoff, resonance, envAmount });
  };

  const handleCutoffChange = (e) => {
    const val = Number(e.target.value);
    setCutoff(val);
    if (onFilterChange) onFilterChange({ type: filterType, cutoff: val, resonance, envAmount });
  };

  const handleResonanceChange = (e) => {
    const val = Number(e.target.value);
    setResonance(val);
    if (onFilterChange) onFilterChange({ type: filterType, cutoff, resonance: val, envAmount });
  };

  const handleEnvChange = (e) => {
    const val = Number(e.target.value);
    setEnvAmount(val);
    if (onFilterChange) onFilterChange({ type: filterType, cutoff, resonance, envAmount: val });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-200 font-mono shadow-xl mt-3">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs uppercase tracking-wider text-purple-400 font-bold">Filter Routing Deck</span>
        <span className="text-[10px] text-gray-400 uppercase font-bold">{filterType}</span>
      </div>

      {/* Filter Mode Selector */}
      <div className="grid grid-cols-3 gap-1 mb-4 bg-gray-950 p-1 rounded border border-gray-800">
        {['lowpass', 'highpass', 'bandpass'].map((mode) => (
          <button
            key={mode}
            onClick={() => handleTypeChange(mode)}
            className={`py-1 text-[10px] uppercase font-bold rounded transition-colors ${
              filterType === mode
                ? 'bg-purple-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {mode === 'lowpass' ? 'LPF' : mode === 'highpass' ? 'HPF' : 'BPF'}
          </button>
        ))}
      </div>

      {/* Sliders Grid */}
      <div className="space-y-3 text-[11px]">
        {/* Cutoff Slider */}
        <div>
          <div className="flex justify-between text-gray-400 mb-1">
            <span>Cutoff Freq</span>
            <span className="text-purple-300 font-bold">{cutoff >= 1000 ? `${(cutoff / 1000).toFixed(1)} kHz` : `${cutoff} Hz`}</span>
          </div>
          <input
            type="range"
            min="20"
            max="20000"
            step="10"
            value={cutoff}
            onChange={handleCutoffChange}
            className="w-full h-1.5 bg-gray-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Resonance Slider */}
        <div>
          <div className="flex justify-between text-gray-400 mb-1">
            <span>Resonance (Q)</span>
            <span className="text-emerald-400 font-bold">{resonance.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="20.0"
            step="0.1"
            value={resonance}
            onChange={handleResonanceChange}
            className="w-full h-1.5 bg-gray-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Envelope Modulation Slider */}
        <div>
          <div className="flex justify-between text-gray-400 mb-1">
            <span>Env Mod</span>
            <span className="text-amber-400 font-bold">{envAmount > 0 ? `+${envAmount}%` : `${envAmount}%`}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={envAmount}
            onChange={handleEnvChange}
            className="w-full h-1.5 bg-gray-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
