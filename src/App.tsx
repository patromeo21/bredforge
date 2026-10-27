import { useMemo, useRef, useState } from 'react';
import { audioEngine } from './services/audio/AudioEngine';
import type { TrackKey } from './services/audio/types';

type WorkspaceName =
  | 'Groovebox'
  | 'Samples'
  | 'Sampler'
  | 'Tracker'
  | 'Mixer'
  | 'Effects'
  | 'Routing'
  | 'Arrangement';

type TrackDefinition = {
  id: string;
  name: string;
  color: string;
  gain: number;
  pan: number;
  muted: boolean;
  solo: boolean;
};

type PatternStep = {
  active: boolean;
};

const workspaces: WorkspaceName[] = [
  'Groovebox',
  'Samples',
  'Sampler',
  'Tracker',
  'Mixer',
  'Effects',
  'Routing',
  'Arrangement',
];

const trackNames = ['vocals', 'drums', 'bass', 'other'];
const patternLength = 16;

const defaultTrackState: TrackDefinition[] = [
  { id: 'vocals', name: 'vocals', color: '#67e8f9', gain: 1, pan: 0, muted: false, solo: false },
  { id: 'drums', name: 'drums', color: '#60a5fa', gain: 1, pan: 0, muted: false, solo: false },
  { id: 'bass', name: 'bass', color: '#a78bfa', gain: 1, pan: 0, muted: false, solo: false },
  { id: 'other', name: 'other', color: '#fbbf24', gain: 1, pan: 0, muted: false, solo: false },
];

const defaultPattern: Record<string, PatternStep[]> = {
  vocals: Array.from({ length: patternLength }, (_, i) => ({ active: i % 4 === 0 })),
  drums: Array.from({ length: patternLength }, (_, i) => ({ active: i % 2 === 0 })),
  bass: Array.from({ length: patternLength }, (_, i) => ({ active: i % 8 === 0 })),
  other: Array.from({ length: patternLength }, (_, i) => ({ active: i % 5 === 0 })),
};

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceName>('Groovebox');
  const [fileName, setFileName] = useState('No sample loaded');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [swing, setSwing] = useState(12);
  const [playhead, setPlayhead] = useState(0);
  const [tracks, setTracks] = useState<TrackDefinition[]>(defaultTrackState);
  const [pattern, setPattern] = useState<Record<string, PatternStep[]>>(defaultPattern);

  const trackState = useMemo(() => tracks, [tracks]);

  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setFileName(file.name);
      await audioEngine.loadFile(file);
      setDuration(audioEngine.getDuration());
      setCurrentTime(audioEngine.getCurrentTime());
      audioEngine.setMasterVolume(masterVolume);
      audioEngine.setPlaybackRate(playbackRate);
    } catch (loadError) {
      console.error(loadError);
      setError('Unable to decode this audio file in the current browser environment.');
    }
  };

  const handlePlaybackToggle = async () => {
    try {
      if (!audioEngine.isLoaded()) {
        setError('Load a valid audio sample before playback.');
        return;
      }

      if (isPlaying) {
        audioEngine.pause();
        setIsPlaying(false);
        setCurrentTime(audioEngine.getCurrentTime());
        return;
      }

      await audioEngine.play();
      setIsPlaying(true);
      setCurrentTime(audioEngine.getCurrentTime());
      setPlayhead((prev) => (prev + 1) % patternLength);
    } catch (playError) {
      console.error(playError);
      setError('Playback requires a user gesture to resume the audio context.');
    }
  };

  const handleReset = () => {
    audioEngine.seek(0);
    setCurrentTime(0);
    setPlayhead(0);
    setIsPlaying(false);
  };

  const toggleStep = (trackId: string, stepIndex: number) => {
    setPattern((prev) => {
      const nextTrackPattern = [...(prev[trackId] ?? Array.from({ length: patternLength }, () => ({ active: false })))]
      nextTrackPattern[stepIndex] = { active: !nextTrackPattern[stepIndex]?.active };
      return { ...prev, [trackId]: nextTrackPattern };
    });
  };

    const updateTrackGain = (trackId: string, nextValue: number) => {
    const key = trackId as TrackKey;

    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId
          ? {
              ...track,
              gain: nextValue,
            }
          : track,
      ),
    );

    audioEngine.setTrackGain(key, nextValue);
  };

  const updateTrackPan = (trackId: string, nextValue: number) => {
    const key = trackId as TrackKey;

    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId
          ? {
              ...track,
              pan: nextValue,
            }
          : track,
      ),
    );

    audioEngine.setTrackPan(key, nextValue);
  };

  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderPatternGrid = () => (
    <div className="pattern-grid-panel panel">
      <div className="section-header">
        <div>
          <span className="eyebrow">Groovebox</span>
          <h2>Pattern Sequencer</h2>
        </div>
        <div className="chip-row">
          <button className="chip active">16 steps</button>
          <button className="chip">32</button>
          <button className="chip">64</button>
        </div>
      </div>

      <div className="sequencer-shell">
        <div className="sequencer-header">
          <div className="track-label muted">Track</div>
          {Array.from({ length: patternLength }, (_, index) => (
            <div key={`step-header-${index}`} className={`step-index ${playhead === index ? 'active' : ''}`}>
              {index + 1}
            </div>
          ))}
        </div>

        {trackState.map((track) => (
          <div className="sequencer-row" key={track.id}>
            <div className="track-label" style={{ borderLeft: `3px solid ${track.color}` }}>
              <span>{track.name}</span>
              <small>{track.color}</small>
            </div>

            {Array.from({ length: patternLength }, (_, index) => {
              const isActive = pattern[track.id]?.[index]?.active ?? false;
              return (
                <button
                  key={`${track.id}-${index}`}
                  className={`step-cell ${playhead === index ? 'playhead' : ''} ${isActive ? 'enabled' : ''}`}
                  aria-label={`Toggle step ${index + 1} for ${track.name}`}
                  onClick={() => toggleStep(track.id, index)}
                >
                  {isActive ? '•' : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorkspaceBody = () => {
    if (activeWorkspace === 'Groovebox') {
      return renderPatternGrid();
    }

    if (activeWorkspace === 'Mixer') {
      return (
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">Mixer</span>
              <h2>Channel Strips</h2>
            </div>
          </div>
          <div className="mixer-layout">
            {trackState.map((track) => (
              <div className="mixer-strip" key={track.id}>
                <div className="strip-header">
                  <span className="dot" style={{ background: track.color }} />
                  <strong>{track.name}</strong>
                </div>

                <div className="fader-space">
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.01}
                    value={track.gain}
                    onChange={(event) => updateTrackGain(track.id, Number(event.target.value))}
                  />
                </div>

                <div className="meter-row">
                  <span>Gain</span>
                  <strong>{track.gain.toFixed(2)}</strong>
                </div>

                <div className="meter-row">
                  <span>Pan</span>
                  <strong>{track.pan.toFixed(2)}</strong>
                </div>

                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={track.pan}
                  onChange={(event) => updateTrackPan(track.id, Number(event.target.value))}
                />

                <div className="button-row">
                  <button className="tiny-button">Mute</button>
                  <button className="tiny-button">Solo</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="panel panel-empty">
        <div className="section-header">
          <div>
            <span className="eyebrow">Workspace</span>
            <h2>{activeWorkspace}</h2>
          </div>
        </div>
        <div className="placeholder-block">
          <p>{activeWorkspace} is ready for the next implementation phase.</p>
          <small>Current repo state is wired for a real DAW shell and engine integration layer.</small>
        </div>
      </div>
    );
  };

  return (
    <div className="app-shell">
      <header className="topbar panel">
        <div className="project-brand">
          <div className="brand-mark">B</div>
          <div>
            <div className="brand-name">BredForge</div>
            <div className="project-name">Project: Dawn Sequence</div>
          </div>
        </div>

        <div className="transport-wrap">
          <div className="transport-buttons">
            <button className="transport-button secondary" onClick={handleReset}>Reset</button>
            <button className="transport-button primary" onClick={handlePlaybackToggle}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button className="transport-button tertiary">Rec</button>
          </div>

          <div className="transport-readout">
            <span>Tempo</span>
            <strong>{tempo} BPM</strong>
          </div>

          <div className="transport-readout">
            <span>Time</span>
            <strong>{formatTime(currentTime)}</strong>
          </div>

          <div className="tempo-slider-wrap">
            <input
              type="range"
              min={70}
              max={180}
              step={1}
              value={tempo}
              onChange={(event) => setTempo(Number(event.target.value))}
            />
          </div>
        </div>

        <div className="master-panel">
          <div className="master-label">Master</div>
          <div className="meter-bar">
            <span style={{ width: `${Math.min(100, Math.round(masterVolume * 100))}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.01}
            value={masterVolume}
            onChange={(event) => {
              const value = Number(event.target.value);
              setMasterVolume(value);
              audioEngine.setMasterVolume(value);
            }}
          />
          <div className="master-value">{masterVolume.toFixed(2)}</div>
        </div>
      </header>

      <nav className="workspace-nav panel">
        {workspaces.map((workspace) => (
          <button
            className={`nav-button ${activeWorkspace === workspace ? 'active' : ''}`}
            key={workspace}
            onClick={() => setActiveWorkspace(workspace)}
          >
            {workspace}
          </button>
        ))}
      </nav>

      <main className="workspace-layout">
        <aside className="left-rail panel">
          <div className="section-header compact">
            <div>
              <span className="eyebrow">Session</span>
              <h2>Project</h2>
            </div>
          </div>

          <div className="meta-list">
            <div className="meta-row">
              <span>Sample</span>
              <strong>{fileName}</strong>
            </div>
            <div className="meta-row">
              <span>Loop</span>
              <strong>On</strong>
            </div>
            <div className="meta-row">
              <span>Signature</span>
              <strong>4 / 4</strong>
            </div>
            <div className="meta-row">
              <span>Swing</span>
              <strong>{swing}%</strong>
            </div>
          </div>

          <div className="panel-subsection">
            <div className="section-header compact small-gap">
              <div>
                <span className="eyebrow">Library</span>
                <h3>Sample Browser</h3>
              </div>
            </div>

            <div className="sample-list">
              {['Kicks', 'Snares', 'Hats', 'Bass', 'Synth'].map((sample) => (
                <button className="sample-entry" key={sample}>
                  <span>{sample}</span>
                  <small>Ready</small>
                </button>
              ))}
            </div>
          </div>

          <div className="file-controls">
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileLoad} hidden />
            <button className="primary-button" onClick={() => fileInputRef.current?.click()}>
              Import sample
            </button>
          </div>
        </aside>

        <section className="center-rail">{renderWorkspaceBody()}</section>

        <aside className="right-rail panel">
          <div className="section-header compact">
            <div>
              <span className="eyebrow">Monitor</span>
              <h2>Live Mixer</h2>
            </div>
          </div>

          <div className="mixer-stack">
            {trackState.map((track) => (
              <div className="mix-strip" key={track.id}>
                <div className="mix-strip-header">
                  <span className="dot" style={{ background: track.color }} />
                  <strong>{track.name}</strong>
                </div>
                <div className="mix-strip-body">
                  <div className="gain-readout">{track.gain.toFixed(2)}</div>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.01}
                    value={track.gain}
                    onChange={(event) => updateTrackGain(track.id, Number(event.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="status-block">
            <div className="meta-row">
              <span>Playback</span>
              <strong>{isPlaying ? 'Running' : 'Idle'}</strong>
            </div>
            <div className="meta-row">
              <span>Rate</span>
              <strong>{playbackRate.toFixed(2)}x</strong>
            </div>
            <div className="meta-row">
              <span>Loaded</span>
              <strong>{audioEngine.isLoaded() ? 'Yes' : 'No'}</strong>
            </div>
          </div>
        </aside>
      </main>

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}

export default App;
