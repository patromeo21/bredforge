import { useEffect, useRef, useState } from 'react';
import { audioEngine } from './services/audio/AudioEngine';

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('No sample loaded');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = window.setInterval(() => {
      const nextTime = audioEngine.getCurrentTime();
      setCurrentTime(nextTime);

      if (duration > 0 && nextTime >= duration) {
        audioEngine.pause();
        setIsPlaying(false);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [isPlaying, duration]);

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
    } catch (playError) {
      console.error(playError);
      setError('Playback requires a user gesture to resume the audio context.');
    }
  };

  const handleReset = () => {
    audioEngine.seek(0);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <main style={{ minHeight: '100vh', background: '#07111f', color: '#e2e8f0', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: 'min(980px, 100%)', background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 20, padding: 24, boxShadow: '0 30px 60px rgba(2,6,23,0.6)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#67e8f9', marginBottom: 8 }}>Bredforge</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Audio engine foundation</h1>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ appearance: 'none', border: '1px solid rgba(103,232,249,0.35)', background: '#111827', color: '#e0f2fe', borderRadius: 12, padding: '0.8rem 1rem', cursor: 'pointer' }}
          >
            Import sample
          </button>
          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileLoad} hidden />
        </header>

        <section style={{ display: 'grid', gap: 20 }}>
          <div style={{ background: '#020817', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 18, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: '#cbd5e1', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Transport</span>
              <span style={{ color: '#a5f3fc', fontFamily: 'monospace' }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleReset} style={buttonStyle}>Reset</button>
              <button onClick={handlePlaybackToggle} style={{ ...buttonStyle, background: isPlaying ? '#ef4444' : '#22c55e', borderColor: 'transparent' }}>{isPlaying ? 'Pause' : 'Play'}</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            <div style={panelStyle}>
              <label style={labelStyle}>Master volume</label>
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
              <div style={{ color: '#a5f3fc' }}>{masterVolume.toFixed(2)}</div>
            </div>

            <div style={panelStyle}>
              <label style={labelStyle}>Playback rate</label>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.01}
                value={playbackRate}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setPlaybackRate(value);
                  audioEngine.setPlaybackRate(value);
                }}
              />
              <div style={{ color: '#a5f3fc' }}>{playbackRate.toFixed(2)}x</div>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={labelStyle}>Engine status</div>
            <div style={{ display: 'grid', gap: 8, color: '#dbeafe' }}>
              <div>File: {fileName}</div>
              <div>Loaded: {audioEngine.isLoaded() ? 'yes' : 'no'}</div>
              <div>Track count: {audioEngine.getTrackCount()}</div>
              <div>Output chain: master -> analyser -> destination</div>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(127,29,29,0.35)', border: '1px solid rgba(248,113,113,0.45)', color: '#fecaca', borderRadius: 12, padding: '0.8rem 1rem' }}>
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const buttonStyle: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid rgba(148,163,184,0.25)',
  background: '#111827',
  color: '#f8fafc',
  borderRadius: 10,
  padding: '0.7rem 1rem',
  cursor: 'pointer'
};

const panelStyle: React.CSSProperties = {
  background: '#020817',
  border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: 16,
  padding: 18,
  display: 'grid',
  gap: 10
};

const labelStyle: React.CSSProperties = {
  color: '#cbd5e1',
  fontSize: 12,
  letterSpacing: '0.12em',
  textTransform: 'uppercase'
};

export default App;


