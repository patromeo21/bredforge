// ============================================================================
// BREDFORGE v1.0 — ANTI-CLICK SMOOTHING REFINEMENT
// ============================================================================

// Inside playBuffer method in AudioInstrumentChannel.ts:
    const now = this.audioContext.currentTime;
    const rampDuration = 0.003; // 3ms anti-click crossfade envelope

    // 1. Create buffer source node
    const source = this.audioContext.createBufferSource();
    source.buffer = this.sampleBuffer;

    // 2. Pitch scaling
    const targetMidi = this.noteToMidi(note);
    const semitoneOffset = targetMidi - this.baseNoteMidi;
    source.playbackRate.setValueAtTime(Math.pow(2, semitoneOffset / 12), now);

    // 3. Gain envelope with 3ms ramp to prevent clicks
    const gainNode = this.audioContext.createGain();
    const normalizedVolume = Math.max(0, Math.min(64, volume)) / 64;

    // Start at zero gain, ramp up smoothly over 3ms
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(normalizedVolume, now + rampDuration);

    // If note duration/release requires it, schedule fade out before stop
    // (For one-shot chops, Web Audio lets them ring out or stops cleanly)

    // 4. Routing & Execution
    source.connect(gainNode);
    gainNode.connect(this.outputNode);

    source.start(now);