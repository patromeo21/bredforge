import React, { useState, useEffect, useRef } from 'react';
import { BredForgeCanvas } from './components/canvas/BredForgeCanvas';
import { TrackerEngine, PatternState } from './services/tracker/TrackerEngine';
import { TransportService } from './services/transport/TransportService';
import { SampleManager } from './services/sample/SampleManager';
import { SampleLoader } from './services/sample/SampleLoader';

export const App: React.FC = () => {
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [sampleManager, setSampleManager] = useState<SampleManager | null>(null);
  const [sampleLoader, setSampleLoader] = useState<SampleLoader | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<1 | 2>(2);
  const [masterRmsLevel, setMasterRmsLevel] = useState<number>(0);
  const [patternState, setPatternState] = useState<PatternState | undefined>(undefined);

  const trackerRef = useRef<TrackerEngine | null>(null);
  const transportRef = useRef<TransportService | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const tracker = new TrackerEngine(120, 64, 4);
    const transport = new TransportService(120);
    trackerRef.current = tracker;
    transportRef.current = transport;
    setPatternState(tracker.pattern);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const initAudioContext = () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      setAudioCtx(ctx);
      setSampleManager(new SampleManager(ctx));
      setSampleLoader(new SampleLoader(ctx));
    } else if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  const handleTogglePlay = async () => {
    initAudioContext();
    const transport = transportRef.current;
    if (!transport) return;

    if (transport.isPlaying) {
      transport.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      transport.play();
      setIsPlaying(true);
      startPlaybackLoop();
    }
  };

  const handleStop = () => {
    const transport = transportRef.current;
    if (!transport) return;

    transport.stop();
    setIsPlaying(false);
    setCurrentRow(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setMasterRmsLevel(0);
  };

  const startPlaybackLoop = () => {
    const tracker = trackerRef.current;
    const transport = transportRef.current;
    if (!tracker || !transport) return;

    const loop = () => {
      if (!transport.isPlaying) return;

      const elapsed = transport.getElapsedSeconds();
      const row = tracker.getRowFromAudioTime(elapsed);
      setCurrentRow(row);
      setMasterRmsLevel(0.3 + Math.random() * 0.4);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  return (
    <div
      className="w-full h-screen overflow-hidden bg-neutral-950 select-none"
      style={{
        WebkitUserSelect: 'none',
      }}
      onClick={initAudioContext}
      onTouchStart={initAudioContext}
    >
      <BredForgeCanvas
        audioCtx={audioCtx}
        sampleManager={sampleManager}
        sampleLoader={sampleLoader}
        patternState={patternState}
        currentRow={currentRow}
        activeTab={activeTab}
        onTabChange={(tab: 1 | 2) => setActiveTab(tab)}
        masterRmsLevel={masterRmsLevel}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
      />
    </div>
  );
};

export default App;