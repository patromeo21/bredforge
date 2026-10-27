# bredforge

Browser-based music production engine with Web Audio sequencing, sample editing, mixer, routing, recording, and WAV export.

## First milestone

This repository now includes the first engine foundation milestone:

- AudioContext initialization
- sample import and decode
- transport controls for play, pause, stop, and seek
- master output and analyser routing
- shared graph structure for track gain and pan control
- a minimal React UI to validate the engine lifecycle

## Local setup

```bash
npm install
npm run dev
```

## Notes

This is intentionally scoped to the audio engine foundation and does not yet implement the full sequencer, tracker, mixer, or export pipeline.
