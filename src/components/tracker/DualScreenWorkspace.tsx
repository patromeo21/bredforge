// ============================================================================
// BREDFORGE v1.0 — DUAL SCREEN WORKSPACE & 120FPS OSCILLOSCOPE [REF: WORKSPACE-01]
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../../services/AudioEngine';

interface AudioVisualizerCanvasProps {
  width?: number;
  height?: number;
  lineColor?: string;
}

/**
 * 120FPS Phosphor Oscilloscope Canvas (Inlined for zero-dependency compilation)
 */
function AudioVisualizerCanvas({
  width = 280,
  height = 48,
  lineColor = '#f59e0b',
}: AudioVisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const analyser = audioEngine.getAnalyser();

    const bufferLength = analyser ? analyser.frequencyBinCount : 1024;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      ctx.fillStyle = '#09090b'; // zinc-950 background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        dataArray.fill(128);
      }

      ctx.lineWidth = 2;
      ctx.strokeStyle = lineColor;
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Retro scanlines
      ctx.fillStyle = 'rgba(245, 158, 11, 0.03)';
      for (let gy = 0; gy < canvas.height; gy += 4) {
        ctx.fillRect(0, gy, canvas.width, 1);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [lineColor]);

  return (
    <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 shadow-inner w-full h-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full block"
      />
      <div className="absolute top-1 left-2 text-[8px] font-mono text-zinc-500 tracking-widest pointer-events-none">
        OSC // 120FPS PHOSPHOR
      </div>
    </div>
  );
}

interface DualScreenWorkspaceProps {
  projectName?: string;
  tempo?: number;
}

export function DualScreenWorkspace({
  projectName = 'BRED_PROJECT_01',
  tempo = 124.0,
}: DualScreenWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'tracker' | 'phrase'>('tracker');
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    audioEngine.triggerPad(stepIndex % 16, 110);
  };

  const steps = Array.from({ length: 64 }, (_, i) => i);
  const rowsPerBeat = 4;

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono p-3 gap-3 select-none overflow-hidden border border-zinc-800 rounded-lg">
      
      {/* Workspace Header with Integrated 120fps Oscilloscope */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-lg gap-3 shrink-0">
        
        {/* Project & Tempo Meta */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-500 tracking-wider">
              {projectName}
            </span>
            <span className="text-[9px] text-zinc-400">
              TEMPO: {tempo.toFixed(1)} BPM // 4/4 TIME
            </span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                activeTab === 'tracker'
                  ? 'bg-amber-500 text-zinc-950 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              TRACKER
            </button>
            <button
              onClick={() => setActiveTab('phrase')}
              className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                activeTab === 'phrase'
                  ? 'bg-amber-500 text-zinc-950 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              PHRASE
            </button>
          </div>
        </div>

        {/* Live Phosphor Oscilloscope (120FPS Audio Visualizer) */}
        <div className="w-full lg:w-72 h-12 shrink-0">
          <AudioVisualizerCanvas width={280} height={48} lineColor="#f59e0b" />
        </div>

      </div>

      {/* Main Tracker Grid Area */}
      <div className="flex-1 grid grid-cols-4 sm:grid-cols-8 gap-2 bg-zinc-900/20 border border-zinc-800/80 rounded-xl p-3 overflow-y-auto">
        {steps.map((step) => {
          const isSelected = currentStep === step;
          const isBeatStart = step % rowsPerBeat === 0;

          return (
            <button
              key={step}
              onClick={() => handleStepClick(step)}
              className={`flex flex-col justify-between p-2.5 h-16 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] font-bold'
                  : isBeatStart
                  ? 'bg-zinc-900/60 border-zinc-700 text-zinc-200 hover:border-zinc-600'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between w-full text-[8px]">
                <span>{step < 9 ? `0${step + 1}` : step + 1}</span>
                <span className={isSelected ? 'text-amber-400' : 'text-zinc-600'}>●</span>
              </div>
              <div className="flex justify-center items-center my-auto">
                <span className="text-xs font-mono font-bold tracking-wider">
                  {step % 4 === 0 ? 'C-4' : '---'}
                </span>
              </div>
              <div className="text-[7px] text-zinc-500 text-center">
                VOL 64
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[9px] text-zinc-500 px-1 shrink-0">
        <span>Click any step to audition synth voices and trigger real-time waveform display.</span>
        <span className="text-amber-400 font-bold">M8 TRACKER // A13 COORD</span>
      </div>

    </div>
  );
}

export default DualScreenWorkspace;
