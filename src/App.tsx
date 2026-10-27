# bredforge

Browser-based music production engine with Web Audio sequencing, sample editing, mixer, routing, recording, and WAV export.

## Milestone 1: audio engine foundation

This project now includes the first implementation milestone for the browser-based audio engine:

- AudioContext lifecycle setup and resume handling
- user audio import and AudioBuffer decoding
- real transport controls for play, pause, stop, and seek
- master output and analyser routing
- minimal per-track gain and pan controls
- simple React UI to validate the engine in-browser

## Local setup

```bash
npm install
npm run dev
```

## Validation status

- Audio context creation: implemented
- Audio decoder: implemented
- Transport playback: implemented
- Gain and analyser graph: implemented
- Sequencer, mixer, recording, and export: not yet implemented

This milestone intentionally keeps the UI simple so the engine can be validated before adding sequencer and routing features.



























































































































































test





