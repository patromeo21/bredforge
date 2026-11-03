import React, { useEffect, useRef } from 'react';
import { SampleLoader } from '../../services/sample/SampleLoader';
import { SampleManager } from '../../services/sample/SampleManager';
import { TouchIsolationService } from '../../services/touch/TouchIsolationService';

interface BredForgeCanvasProps {
  audioCtx: AudioContext | null;
}

export const BredForgeCanvas: React.FC<BredForgeCanvasProps> = ({ audioCtx }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sampleManagerRef = useRef<SampleManager | null>(null);
  const sampleLoaderRef = useRef<SampleLoader | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    // Initialize Services
    const manager = new SampleManager(audioCtx);
    const loader = new SampleLoader(audioCtx);
    sampleManagerRef.current = manager;
    sampleLoaderRef.current = loader;

    // Apply Touch Isolation to prevent scroll bounce on iPad
    let touchService: TouchIsolationService | null = null;
    if (containerRef.current) {
      touchService = new TouchIsolationService(containerRef.current);
    }

    return () => {
      touchService?.destroy();
    };
  }, [audioCtx]);

  const handlePadTap = (padId: number) => {
    const manager = sampleManagerRef.current;
    if (!manager) return;

    const pad = manager.getPad(padId);
    if (pad && pad.buffer) {
      // Trigger sample playback
      manager.triggerPad(padId);
    } else {
      // Prompt user to load a sample if pad is empty
      handleLoadSample(padId);
    }
  };

  const handleLoadSample = (padId: number) => {
    const loader = sampleLoaderRef.current;
    const manager = sampleManagerRef.current;
    if (!loader || !manager) return;

    loader.openFilePicker(async (file: File) => {
      try {
        const decodedBuffer = await loader.loadAudioFile(file);
        manager.assignBufferToPad(padId, decodedBuffer, file.name);
        console.log(`Successfully loaded ${file.name} onto Pad ${padId}`);
      } catch (err) {
        console.error(`Failed to assign sample to Pad ${padId}`, err);
      }
    });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4 select-none touch-none"
    >
      <h1 className="text-xl font-bold mb-4 tracking-wide">BredForge :: Sampler Matrix</h1>
      
      {/* 4x4 Pad Grid */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-md aspect-square">
        {Array.from({ length: 16 }, (_, i) => i + 1).map((padId) => (
          <button
            key={padId}
            onClick={() => handlePadTap(padId)}
            className="bg-neutral-800 hover:bg-neutral-700 active:bg-amber-500 border border-neutral-700 rounded-lg flex flex-col items-center justify-center p-2 transition-colors active:scale-95 touch-none"
          >
            <span className="text-xs text-neutral-400">PAD</span>
            <span className="text-lg font-bold">{padId < 10 ? `0${padId}` : padId}</span>
          </button>
        ))}
      </div>
    </div>
  );
};