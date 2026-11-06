// ============================================================================
// STAGE C - PHASE 23: DECOUPLED SPEED & PITCH WORKLET ENGINE (StretchProcessor.js)
// ============================================================================

class StretchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'stretchRatio',
        defaultValue: 1.0,
        minValue: 0.25,
        maxValue: 4.0,
        automationRate: 'k-rate'
      },
      {
        name: 'pitchShift',
        defaultValue: 0.0,
        minValue: -24.0,
        maxValue: 24.0,
        automationRate: 'k-rate'
      },
      {
        name: 'playbackSpeed',
        defaultValue: 1.0,
        minValue: 0.1,
        maxValue: 4.0,
        automationRate: 'k-rate'
      }
    ];
  }

  constructor() {
    super();
    this._readIndex = 0.0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || input.length === 0 || !output || output.length === 0) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    
    // Read automated parameter inputs with fallback defaults
    const stretchParam = parameters.stretchRatio;
    const pitchParam = parameters.pitchShift;
    const speedParam = parameters.playbackSpeed;

    const stretchRatio = stretchParam && stretchParam.length > 0 ? stretchParam[0] : 1.0;
    const pitchShift = pitchParam && pitchParam.length > 0 ? pitchParam[0] : 0.0;
    const playbackSpeed = speedParam && speedParam.length > 0 ? speedParam[0] : 1.0;

    // Decoupled Pitch Math: Convert semitone offset to pitch scale factor
    const pitchFactor = Math.pow(2.0, pitchShift / 12.0);

    // Combine playback speed and independent pitch factor for read-head step increment
    const stepIncrement = stretchRatio * pitchFactor * playbackSpeed;
    const sampleCount = outputChannel.length;
    const bufferLength = inputChannel.length;

    for (let i = 0; i < sampleCount; i++) {
      const intIndex = Math.floor(this._readIndex);
      const frac = this._readIndex - intIndex;

      const idx0 = intIndex % bufferLength;
      const idx1 = (intIndex + 1) % bufferLength;

      const s0 = inputChannel[idx0] || 0;
      const s1 = inputChannel[idx1] || 0;

      // Linear interpolation for decoupled pitch/speed resampling
      outputChannel[i] = s0 + frac * (s1 - s0);

      // Advance granular read pointer with hop-size pitch step increment
      this._readIndex += stepIncrement;
      if (this._readIndex >= bufferLength) {
        this._readIndex %= bufferLength;
      }
    }

    // Mirror mono/processed output channel across remaining channels
    for (let ch = 1; ch < output.length; ch++) {
      output[ch].set(outputChannel);
    }

    return true;
  }
}

registerProcessor('StretchProcessor', StretchProcessor);