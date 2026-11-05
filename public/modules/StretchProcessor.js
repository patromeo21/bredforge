// ============================================================================
// STAGE C - PHASE 22: PHASE VOCODER AUDIO STRETCH PROCESSOR (StretchProcessor.js)
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
    const ratios = parameters.stretchRatio;
    const stretchRatio = ratios && ratios.length > 0 ? ratios[0] : 1.0;

    const sampleCount = outputChannel.length;

    for (let i = 0; i < sampleCount; i++) {
      const intIndex = Math.floor(this._readIndex);
      const frac = this._readIndex - intIndex;

      const s0 = inputChannel[intIndex % inputChannel.length] || 0;
      const s1 = inputChannel[(intIndex + 1) % inputChannel.length] || 0;

      // Linear interpolation sample resampler for granular time-stretching
      outputChannel[i] = s0 + frac * (s1 - s0);

      // Advance read index according to stretch ratio
      this._readIndex += stretchRatio;
      if (this._readIndex >= inputChannel.length) {
        this._readIndex %= inputChannel.length;
      }
    }

    // Mirror mono/processed channel to remaining output channels
    for (let ch = 1; ch < output.length; ch++) {
      output[ch].set(outputChannel);
    }

    return true;
  }
}

registerProcessor('StretchProcessor', StretchProcessor);