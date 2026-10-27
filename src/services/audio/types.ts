import { useMemo, useRef, useState } from 'react';
import { audioEngine } from './services/audio/AudioEngine';

function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1);

  const status = useMemo(() => {
    return {
      currentTime: audioEngine.getCurrentTime(),
      duration: audioEngine.getDuration(),
      loaded: audioEngine.isLoaded(),
      trackCount: audioEngine.getTrackCount()
    };
  }, [isPlaying, selectedFile]);

  const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setSelectedFile(file);
      await audioEngine.loadFile(file);
      audioEngine.setMasterVolume(masterVolume);
      audioEngine.setPlaybackRate(playbackRate);
    } catch (loadError) {
      console.error(loadError);
      setError('Failed to decode audio. Please choose a valid WAV, MP3, or AAC file.');
    }
  };

  const togglePlayback = async () => {
    try {
      if (!audioEngine.isLoaded()) {
        setError('Load an audio file before playing.');
        return;
      }

      if (isPlaying) {
        audioEngine.pause();
        setIsPlaying(false);
        return;
      }

      await audioEngine.play();
      setIsPlaying(true);
    } catch (playError) {
      console.error(playError);
      setError('Audio playback failed. User interaction may be required to resume the audio context.');
    }
  };

  const seekToZero = () => {
    audioEngine.seek(0);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #050b16 0%, #0a1325 100%)',
      display: 'grid',
      placeItems: 'center',
      padding: 24
    }}>
      <div style={{
        width: 'min(980px, 100%)',
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.4)'
      }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#67e8f9', marginBottom: 8 }}>
              Bredforge
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>Audio engine foundation</h1>
          </div>

          <button
            onClick={() => inputRef.current?.click()}
            style={{
              appearance: 'none',
              border: '1px solid rgba(103, 232, 249, 0.35)',
              background: '#0f172a',
              color: '#e0f2fe',
              borderRadius: 12,
              padding: '0.75rem 1rem',
              cursor: 'pointer'
            }}
          >
            Import sample
          </button>
          <input ref={inputRef} type="file" accept="audio/*" onChange={onFileUpload} hidden />
        </header>

        <section style={{ display: 'grid', gap: 20 }}>
          <div style={{
            background: '#020817',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: 18,
            padding: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: '#cbd5e1', fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Transport
              </span>
              <span style={{ color: '#a5f3fc', fontFamily: 'monospace' }}>
                {formatTime(status.currentTime)} / {formatTime(status.duration)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={seekToZero} style={buttonStyle}>Reset</button>
              <button onClick={togglePlayback} style={{ ...buttonStyle, background: isPlaying ? '#ef4444' : '#22c55e', borderColor: 'transparent' }}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
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
              <div>File: {selectedFile ? selectedFile.name : 'No audio loaded'}</div>
              <div>Audio loaded: {status.loaded ? 'yes' : 'no'}</div>
              <div>Track count: {status.trackCount}</div>
              <div>Output: master bus + analyser connected</div>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(127, 29, 29, 0.35)',
              border: '1px solid rgba(248, 113, 113, 0.45)',
              color: '#fecaca',
              borderRadius: 12,
              padding: '0.75rem 1rem'
            }}>
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
  border: '1px solid rgba(148, 163, 184, 0.25)',
  background: '#111827',
  color: '#f8fafc',
  borderRadius: 10,
  padding: '0.7rem 1rem',
  cursor: 'pointer'
};

const panelStyle: React.CSSProperties = {
  background: '#020817',
  border: '1px solid rgba(148, 163, 184, 0.15)',
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
