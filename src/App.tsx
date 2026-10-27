:root {
  --bg-deep: #070d1a;
  --bg-strong: #0d1525;
  --bg-panel: #111d2f;
  --bg-panel-alt: #0c1626;
  --bg-soft: #17263c;
  --bg-mute: #1d2b3f;
  --line: rgba(156, 170, 189, 0.2);
  --line-strong: rgba(156, 170, 189, 0.36);
  --text: #e8edf6;
  --text-muted: #9cacbf;
  --text-soft: #738aa5;
  --primary: #67e8f9;
  --primary-strong: #3bd2f2;
  --secondary: #60a5fa;
  --secondary-soft: #8b5cf6;
  --accent: #fbbf24;
  --danger: #f87171;
  --success: #34d399;
  --shadow: rgba(2, 6, 23, 0.7);
  --track-a: #67e8f9;
  --track-b: #60a5fa;
  --track-c: #a78bfa;
  --track-d: #fbbf24;
  --radius: 16px;
}

* {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  min-height: 100%;
  min-width: 100%;
  background: var(--bg-deep);
  color: var(--text);
  font-family: Inter, 'Segoe UI', sans-serif;
}

body {
  background:
    radial-gradient(circle at top, rgba(96, 165, 250, 0.09), transparent 25%),
    linear-gradient(180deg, var(--bg-deep), var(--bg-strong));
}

button, input {
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

input[type='range'] {
  width: 100%;
  accent-color: var(--primary);
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  color: var(--text);
}

.panel {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(12, 18, 29, 0.98));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 12px 30px var(--shadow);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 18px;
}

.project-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: #04131d;
  font-weight: 900;
  font-size: 1.1rem;
}

.brand-name {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.project-name {
  color: var(--text-muted);
  font-size: 0.76rem;
}

.transport-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}

.transport-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.transport-button,
.primary-button,
.tiny-button,
.chip,
.nav-button,
.sample-entry {
  transition: all 0.2s ease;
}

.transport-button {
  border-radius: 10px;
  padding: 0.7rem 1.05rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.transport-button.primary {
  background: var(--primary);
  color: #071722;
}

.transport-button.secondary {
  background: rgba(103, 232, 249, 0.08);
  border: 1px solid rgba(103, 232, 249, 0.3);
  color: var(--text);
}

.transport-button.tertiary {
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #fecaca;
}

.transport-readout {
  display: grid;
  gap: 2px;
  min-width: 92px;
}

.transport-readout span,
.eyebrow,
.meta-row span,
.master-label,
.meter-row span,
.gain-readout,
.track-label small {
  color: var(--text-muted);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.transport-readout strong,
.meta-row strong,
.meter-row strong {
  font-size: 0.88rem;
  font-weight: 700;
}

.tempo-slider-wrap {
  width: 140px;
}

.master-panel {
  min-width: 190px;
  display: grid;
  gap: 8px;
}

.master-label {
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.meter-bar {
  position: relative;
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  overflow: hidden;
}

.meter-bar span {
  position: absolute;
  inset: 0 auto 0 0;
  background: linear-gradient(90deg, var(--success), var(--primary), var(--accent));
  border-radius: inherit;
}

.master-value {
  color: var(--primary);
  font-weight: 700;
  text-align: right;
}

.workspace-nav {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
  overflow-x: auto;
}

.nav-button {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0.68rem 0.8rem;
  font-weight: 600;
}

.nav-button.active {
  background: rgba(103, 232, 249, 0.08);
  border-color: rgba(103, 232, 249, 0.28);
  color: var(--text);
}

.workspace-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 250px;
  gap: 16px;
  min-height: 600px;
}

.left-rail,
.right-rail,
.center-rail {
  min-height: 0;
}

.left-rail,
.right-rail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.center-rail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header.compact {
  margin-bottom: 12px;
}

.section-header h2,
.section-header h3 {
  margin: 4px 0 0;
  font-weight: 700;
}

.meta-list,
.status-block {
  display: grid;
  gap: 10px;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(148, 163, 184, 0.03);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.meta-row strong {
  color: var(--text);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sample-list {
  display: grid;
  gap: 8px;
}

.sample-entry {
  width: 100%;
  padding: 0.7rem 0.8rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(148, 163, 184, 0.04);
  border: 1px solid var(--line);
  color: var(--text);
}

.sample-entry small {
  color: var(--text-muted);
}

.file-controls {
  display: flex;
  margin-top: auto;
}

.primary-button {
  width: 100%;
  border-radius: 10px;
  padding: 0.75rem 0.8rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: #071722;
  font-weight: 800;
}

.pattern-grid-panel,
.panel-empty {
  padding: 18px;
  min-height: 540px;
}

.chip-row {
  display: flex;
  gap: 8px;
}

.chip {
  background: rgba(148, 163, 184, 0.04);
  border: 1px solid var(--line);
  color: var(--text-muted);
  border-radius: 999px;
  padding: 0.45rem 0.72rem;
}

.chip.active {
  background: rgba(103, 232, 249, 0.08);
  border-color: rgba(103, 232, 249, 0.25);
  color: var(--text);
}

.sequencer-shell {
  display: grid;
  gap: 8px;
  overflow-x: auto;
}

.sequencer-header,
.sequencer-row {
  display: grid;
  grid-template-columns: 140px repeat(16, minmax(28px, 1fr));
  gap: 6px;
  align-items: center;
}

.track-label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  height: 42px;
  padding: 8px 10px;
  background: rgba(148, 163, 184, 0.03);
  border: 1px solid var(--line);
  border-radius: 10px;
  text-transform: uppercase;
}

.track-label span {
  font-size: 0.76rem;
  font-weight: 700;
}

.track-label.muted {
  justify-content: center;
  background: transparent;
  border: 0;
}

.step-index {
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--text-soft);
  font-size: 0.73rem;
  background: rgba(148, 163, 184, 0.03);
  border: 1px solid transparent;
}

.step-index.active {
  border-color: rgba(103, 232, 249, 0.28);
  background: rgba(103, 232, 249, 0.08);
  color: var(--text);
}

.step-cell {
  height: 42px;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.04);
  border: 1px solid var(--line);
  color: var(--primary);
  font-size: 0.8rem;
}

.step-cell.playhead {
  border-color: rgba(103, 232, 249, 0.45);
  box-shadow: inset 0 0 0 1px rgba(103, 232, 249, 0.25);
}

.placeholder-block {
  min-height: 280px;
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--text-muted);
  border: 1px dashed var(--line-strong);
  border-radius: 14px;
  background: rgba(148, 163, 184, 0.02);
}

.mixer-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
}

.mixer-strip,
.mix-strip {
  background: rgba(148, 163, 184, 0.04);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.strip-header,
.mix-strip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}

.fader-space {
  display: grid;
  gap: 8px;
}

.meter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.button-row {
  display: flex;
  gap: 8px;
}

.tiny-button {
  flex: 1;
  border-radius: 8px;
  padding: 0.5rem 0.45rem;
  background: rgba(148, 163, 184, 0.05);
  border: 1px solid var(--line);
  color: var(--text);
}

.tiny-button.active {
  background: rgba(103, 232, 249, 0.12);
  border-color: rgba(103, 232, 249, 0.35);
  color: var(--primary);
}

.mixer-stack {
  display: grid;
  gap: 10px;
}

.mix-strip-body {
  display: grid;
  gap: 8px;
}

.gain-readout {
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-align: right;
  color: var(--primary);
}

.waveform-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.02);
}

.waveform-shell {
  position: relative;
  height: 56px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: repeating-linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.09),
    rgba(148, 163, 184, 0.09) 2px,
    rgba(15, 23, 42, 0.2) 2px,
    rgba(15, 23, 42, 0.2) 6px
  );
  overflow: hidden;
}

.waveform-bar {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(103, 232, 249, 0.18), rgba(96, 165, 250, 0.8), rgba(251, 191, 36, 0.9));
  border-radius: inherit;
}

.sample-metadata {
  display: grid;
  gap: 8px;
}

.sample-metadata > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.sample-metadata strong {
  color: var(--text);
}

.error-banner {
  position: sticky;
  bottom: 20px;
  margin: 0 auto;
  width: min(100%, 760px);
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: rgba(127, 29, 29, 0.72);
  color: #fecaca;
  border: 1px solid rgba(248, 113, 113, 0.4);
  box-shadow: 0 16px 35px rgba(69, 10, 10, 0.38);
}

@media (max-width: 1100px) {
  .workspace-layout {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .right-rail {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .app-shell {
    padding: 12px;
  }

  .topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .transport-wrap {
    justify-content: space-between;
  }

  .workspace-layout {
    grid-template-columns: 1fr;
  }

  .sequencer-header,
  .sequencer-row {
    grid-template-columns: 110px repeat(16, minmax(26px, 1fr));
  }
}
