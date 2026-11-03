import React, { useEffect, useRef, useState } from 'react';
import { AudioGraph } from './services/audio/AudioGraph';
import { MasterDSPController } from './services/audio/MasterDSPController';
import { TrackerEngine, PatternState } from './services/tracker/TrackerEngine';
import { TransportService } from './services/transport/TransportService';
import { BredForgeCanvas } from './components/canvas/BredForgeCanvas';
import { TouchIsolationService } from './services/touch/TouchIsolationService';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Core Service Instances
  const audioGraphRef = useRef<AudioGraph | null>(null);
  const masterDspRef = useRef<MasterDSPController | null>(null);
  const trackerEngineRef = useRef<TrackerEngine | null>(null);
  const transportRef = useRef<TransportService>(new TransportService(120));
  const touchServiceRef = useRef<TouchIsolationService | null>(null);

  // Reactive UI States
  const [patternState, setPatternState] = useState<PatternState | null>(null);
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<1 | 2>(2);
  const [rmsLevel, setRmsLevel] = useState<number>(0.15);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);

  useEffect(() => {
    // 1. Instantiate Core Engine Services
    const audioGraph = new AudioGraph();
    const masterDsp = new MasterDSPController(audioGraph);
    const trackerEngine = new TrackerEngine(120, 64, 4);

    audioGraphRef.current = audioGraph;
    masterDspRef.current = masterDsp;
    trackerEngineRef.current = trackerEngine;
    setPatternState(trackerEngine.pattern);

    // 2. Attach Mobile Pointer Touch Isolation
    if (containerRef.current) {
      touchServiceRef.current = new TouchIsolationService(containerRef.current);
    }

    // 3. Master 60fps Audio/Visual Ticker Loop
    let animFrameId: number;

    const renderLoop = () => {
      // If playing, update row position from transport clock
      if (transportRef.current.isPlaying && trackerEngineRef.current) {
        const elapsed = transportRef.current.getElapsedSeconds();
        const row = trackerEngineRef.current.getRowFromAudioTime(elapsed);
        setCurrentRow(row);
      }

      // Simulated RMS signal flutter for LED meter testing
      const baseRms = transportRef.current.isPlaying 
        ? 0.3 + Math.sin(performance.now() * 0.01) * 0.2 + Math.random() * 0.1 
        : 0.08;
      setRmsLevel(Math.max(0, Math.min(1, baseRms)));

      animFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animFrameId);
      if (touchServiceRef.current) {
        touchServiceRef.current.destroy();
      }
    };
  }, []);

  // Unlock Web Audio Context on First User Touch
  const handleFirstInteraction = async () => {
    if (!isAudioUnlocked && masterDspRef.current) {
      await masterDspRef.current.unlockAudioContext();
      setIsAudioUnlocked(true);
    }
  };

  const handleTogglePlay = async () => {
    await handleFirstInteraction();
    if (transportRef.current.isPlaying) {
      transportRef.current.pause();
      setIsPlaying(false);
    } else {
      transportRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    transportRef.current.stop();
    setIsPlaying(false);
    setCurrentRow(0);
  };

  if (!patternState) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleFirstInteraction}
      onPointerDown={handleFirstInteraction}
      style={{
        width: '1440px',
        height: '900px',
        backgroundColor: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <BredForgeCanvas
        patternState={patternState}
        currentRow={currentRow}
        activeTab={activeTab}
        onTabChange={(tab: 1 | 2) => setActiveTab(tab)}
        masterRmsLevel={rmsLevel}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
      />
    </div>
  );
};

export default App;