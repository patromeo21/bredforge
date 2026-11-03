import type {
  AudioGraphRuntimeState,
  MasterEQState,
  SidechainPresetConfig,
  SidechainPresetName,
  TrackEffectState,
  TrackGraphState,
  TrackKey,
} from './types';

type EffectSlotNode = {
  input: GainNode;
  dryGain: GainNode;
  wetGain: GainNode;
  process: AudioNode;
  output: GainNode;
};

type TrackNodeBundle = {
  id: string;
  input: GainNode;
  outputGain: GainNode;
  pan: StereoPannerNode;
  muteGain: GainNode;
  effects: {
    bitcrush: EffectSlotNode;
    phaser: EffectSlotNode;
    looper: EffectSlotNode;
  };
};

export class AudioGraph {
  readonly context: AudioContext;
  readonly analyser: AnalyserNode;
  readonly output: GainNode;
  readonly masterInput: GainNode;
  readonly masterEq: BiquadFilterNode[];
  readonly masterLimiter: DynamicsCompressorNode;
  readonly sidechainCompressor: DynamicsCompressorNode;
  readonly sidechainInput: GainNode;
  readonly sidechainSource: GainNode;
  readonly tracks: Record<string, TrackNodeBundle>;
  readonly trackIds: string[];
  private trackState: Record<string, TrackGraphState>;
  private masterVolumeValue: number;
  private sidechainPresetValue: SidechainPresetName;
  private sidechainSourceLevelValue: number;

  constructor(context: AudioContext) {
    this.context = context;
    this.output = context.createGain();
    this.output.gain.value = 1;
    this.masterVolumeValue = 1;

    this.masterInput = context.createGain();
    this.masterInput.gain.value = 1;

    this.masterEq = this.createMasterEq();
    this.masterLimiter = context.createDynamicsCompressor();
    this.masterLimiter.threshold.value = -18;
    this.masterLimiter.knee.value = 18;
    this.masterLimiter.ratio.value = 4;
    this.masterLimiter.attack.value = 0.003;
    this.masterLimiter.release.value = 0.2;

    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 32;
    this.analyser.smoothingTimeConstant = 0.85;

    this.sidechainInput = context.createGain();
    this.sidechainInput.gain.value = 0;

    this.sidechainSource = context.createGain();
    this.sidechainSource.gain.value = 0;
    this.sidechainSourceLevelValue = 0;

    this.sidechainCompressor = context.createDynamicsCompressor();
    this.sidechainCompressor.threshold.value = -28;
    this.sidechainCompressor.knee.value = 15;
    this.sidechainCompressor.ratio.value = 2;
    this.sidechainCompressor.attack.value = 0.01;
    this.sidechainCompressor.release.value = 0.08;
    this.sidechainPresetValue = 'medium';

    this.trackIds = Array.from({ length: 8 }, (_, index) => `track${index + 1}`);
    this.tracks = {} as Record<string, TrackNodeBundle>;
    this.trackState = {} as Record<string, TrackGraphState>;

    this.trackIds.forEach((trackId) => {
      this.tracks[trackId] = this.createTrack(trackId);
      this.tracks[trackId].outputGain.connect(this.tracks[trackId].pan);
      this.tracks[trackId].pan.connect(this.masterInput);
      this.trackState[trackId] = {
        id: trackId,
        gain: 1,
        pan: 0,
        muted: false,
        soloed: false,
        effects: {
          bitcrush: { wet: 0, dry: 1, enabled: false },
          phaser: { wet: 0, dry: 1, enabled: false },
          looper: { wet: 0, dry: 1, enabled: false },
        },
      };
    });

    this.masterInput.connect(this.masterEq[0]);
    this.masterEq.forEach((filter, index) => {
      if (index < this.masterEq.length - 1) {
        filter.connect(this.masterEq[index + 1]);
      }
    });

    this.masterEq[this.masterEq.length - 1].connect(this.masterLimiter);
    this.masterLimiter.connect(this.output);
    this.output.connect(this.analyser);
    this.output.connect(context.destination);

    this.sidechainSource.connect(this.sidechainInput);
    this.sidechainInput.connect(this.sidechainCompressor);
    this.sidechainCompressor.connect(this.masterLimiter);
  }

  private createMasterEq(): BiquadFilterNode[] {
    const context = this.context;
    const bands = [
      { type: 'lowshelf' as const, frequency: 130, Q: 0.7, gain: 3 },
      { type: 'peaking' as const, frequency: 400, Q: 0.8, gain: 2 },
      { type: 'peaking' as const, frequency: 1100, Q: 1.1, gain: 1.5 },
      { type: 'peaking' as const, frequency: 3600, Q: 1.2, gain: 1 },
      { type: 'highshelf' as const, frequency: 12000, Q: 0.8, gain: 2.5 },
    ];

    return bands.map(({ type, frequency, Q, gain }) => {
      const filter = context.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.Q.value = Q;
      filter.gain.value = gain;
      return filter;
    });
  }

  private createTrack(trackId: string): TrackNodeBundle {
    const context = this.context;
    const input = context.createGain();
    const outputGain = context.createGain();
    const pan = context.createStereoPanner();
    const muteGain = context.createGain();
    muteGain.gain.value = 1;

    const bitcrush = this.createEffectSlot(this.createBitcrushProcess());
    const phaser = this.createEffectSlot(this.createPhaserProcess());
    const looper = this.createEffectSlot(this.createLooperProcess());

    input.connect(bitcrush.input);
    bitcrush.output.connect(phaser.input);
    phaser.output.connect(looper.input);
    looper.output.connect(outputGain);
    outputGain.connect(muteGain);
    muteGain.connect(pan);

    return {
      id: trackId,
      input,
      outputGain,
      pan,
      muteGain,
      effects: {
        bitcrush,
        phaser,
        looper,
      },
    };
  }

  private createEffectSlot(process: AudioNode): EffectSlotNode {
    const context = this.context;
    const input = context.createGain();
    const dryGain = context.createGain();
    const wetGain = context.createGain();
    const output = context.createGain();

    dryGain.gain.value = 1;
    wetGain.gain.value = 0;

    input.connect(dryGain);
    input.connect(process);
    process.connect(wetGain);
    dryGain.connect(output);
    wetGain.connect(output);

    return { input, dryGain, wetGain, process, output };
  }

  private createBitcrushProcess(): AudioNode {
    const shaper = this.context.createWaveShaper();
    shaper.curve = this.makeBitcrushCurve(8);
    shaper.oversample = 'none';
    return shaper;
  }

  private createPhaserProcess(): AudioNode {
    const filter = this.context.createBiquadFilter();
    filter.type = 'allpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.6;
    return filter;
  }

  private createLooperProcess(): AudioNode {
    const delay = this.context.createDelay(0.5);
    delay.delayTime.value = 0.11;

    const feedback = this.context.createGain();
    feedback.gain.value = 0.35;

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    filter.Q.value = 0.8;

    delay.connect(filter);
    filter.connect(feedback);
    feedback.connect(delay);

    return delay;
  }

  private makeBitcrushCurve(bits: number): Float32Array {
    const sampleCount = 4096;
    const curve = new Float32Array(sampleCount);
    const steps = Math.pow(2, bits);
    const max = 1;

    for (let i = 0; i < sampleCount; i++) {
      const x = (i / sampleCount) * 2 - 1;
      const step = Math.round(x * (steps - 1)) / (steps - 1);
      curve[i] = Math.max(-max, Math.min(max, step));
    }

    return curve;
  }

  private syncTrackRuntimeState(trackKey: TrackKey): void {
    const track = this.tracks[trackKey];
    const state = this.trackState[trackKey];
    if (!track || !state) {
      return;
    }

    track.outputGain.gain.setValueAtTime(state.gain, this.context.currentTime);
    track.pan.pan.setValueAtTime(state.pan, this.context.currentTime);
    track.muteGain.gain.setValueAtTime(state.muted ? 0 : 1, this.context.currentTime);

    (Object.keys(track.effects) as Array<keyof TrackEffectState>).forEach((effectKey) => {
      const slot = track.effects[effectKey];
      const effectState = state.effects[effectKey];
      const wet = Math.max(0, Math.min(1, effectState.wet));
      const dry = Math.max(0, Math.min(1, effectState.dry));

      slot.wetGain.gain.setValueAtTime(effectState.enabled ? wet : 0, this.context.currentTime);
      slot.dryGain.gain.setValueAtTime(effectState.enabled ? dry : 1, this.context.currentTime);
    });
  }

  getRuntimeState(): AudioGraphRuntimeState {
    const tracks = Object.fromEntries(
      Object.entries(this.trackState).map(([trackId, state]) => [trackId, { ...state, effects: { ...state.effects } }]),
    ) as Record<string, TrackGraphState>;

    return {
      masterVolume: this.masterVolumeValue,
      masterEq: {
        bands: this.masterEq.map((filter) => ({
          type: filter.type,
          frequency: filter.frequency.value,
          Q: filter.Q.value,
          gain: filter.gain.value,
        })),
        filterFlipEnabled: this.masterEq[this.masterEq.length - 1]?.type === 'lowpass',
      },
      sidechainPreset: this.sidechainPresetValue,
      sidechainSourceLevel: this.sidechainSourceLevelValue,
      tracks,
    };
  }

  connectSource(source: AudioNode, trackKey: TrackKey): void {
    const track = this.tracks[trackKey];
    if (!track) {
      return;
    }

    source.connect(track.input);
  }

  setTrackGain(trackKey: TrackKey, value: number): void {
    const track = this.tracks[trackKey];
    const state = this.trackState[trackKey];
    if (!track || !state) {
      return;
    }

    state.gain = Math.max(0, Math.min(2, value));
    track.outputGain.gain.setValueAtTime(state.gain, this.context.currentTime);
  }

  setTrackPan(trackKey: TrackKey, value: number): void {
    const track = this.tracks[trackKey];
    const state = this.trackState[trackKey];
    if (!track || !state) {
      return;
    }

    state.pan = Math.max(-1, Math.min(1, value));
    track.pan.pan.setValueAtTime(state.pan, this.context.currentTime);
  }

  setTrackMute(trackKey: TrackKey, muted: boolean): void {
    const track = this.tracks[trackKey];
    const state = this.trackState[trackKey];
    if (!track || !state) {
      return;
    }

    state.muted = muted;
    track.muteGain.gain.setValueAtTime(muted ? 0 : 1, this.context.currentTime);
  }

  setTrackEffectWet(trackKey: TrackKey, effect: keyof TrackEffectState, wet: number): void {
    const track = this.tracks[trackKey];
    const state = this.trackState[trackKey];
    if (!track || !state) {
      return;
    }

    const nextWet = Math.max(0, Math.min(1, wet));
    const nextDry = 1 - nextWet;
    state.effects[effect].wet = nextWet;
    state.effects[effect].dry = nextDry;
    state.effects[effect].enabled = nextWet > 0.001 || nextDry < 0.999;

    this.syncTrackRuntimeState(trackKey);
  }

  setTrackEffectEnabled(trackKey: TrackKey, effect: keyof TrackEffectState, enabled: boolean): void {
    const track = this.tracks[trackKey];
    const state = this.trackState[trackKey];
    if (!track || !state) {
      return;
    }

    const effectState = state.effects[effect];
    effectState.enabled = enabled;
    const wet = enabled ? effectState.wet : 0;
    const dry = enabled ? effectState.dry : 1;

    track.effects[effect].wetGain.gain.setValueAtTime(wet, this.context.currentTime);
    track.effects[effect].dryGain.gain.setValueAtTime(dry, this.context.currentTime);
  }

  setMasterVolume(value: number): void {
    const safeValue = Math.max(0, Math.min(2, value));
    this.masterVolumeValue = safeValue;
    this.output.gain.setValueAtTime(safeValue, this.context.currentTime);
  }

  setMasterEqState(state: MasterEQState): void {
    const bands = state.bands;
    this.masterEq.forEach((filter, index) => {
      const config = bands[index];
      if (!config) {
        return;
      }

      filter.type = config.type;
      filter.frequency.setValueAtTime(config.frequency, this.context.currentTime);
      filter.Q.setValueAtTime(config.Q, this.context.currentTime);
      filter.gain.setValueAtTime(config.gain, this.context.currentTime);
    });

    const lastBand = this.masterEq[this.masterEq.length - 1];
    if (lastBand) {
      lastBand.type = state.filterFlipEnabled ? 'lowpass' : 'highshelf';
    }
  }

  setSidechainPreset(preset: SidechainPresetName): void {
    this.sidechainPresetValue = preset;
    const presetMap: Record<SidechainPresetName, SidechainPresetConfig> = {
      soft: {
        thresholdDb: -22,
        kneeDb: 8,
        ratio: 1.5,
        attackMs: 20,
        releaseMs: 150,
      },
      medium: {
        thresholdDb: -18,
        kneeDb: 10,
        ratio: 2,
        attackMs: 10,
        releaseMs: 80,
      },
      hard: {
        thresholdDb: -12,
        kneeDb: 12,
        ratio: 3.5,
        attackMs: 1,
        releaseMs: 40,
      },
    };

    const config = presetMap[preset];
    const threshold = config.thresholdDb;
    const knee = config.kneeDb;
    const ratio = config.ratio;
    const attack = config.attackMs / 1000;
    const release = config.releaseMs / 1000;

    this.sidechainCompressor.threshold.setValueAtTime(threshold, this.context.currentTime);
    this.sidechainCompressor.knee.setValueAtTime(knee, this.context.currentTime);
    this.sidechainCompressor.ratio.setValueAtTime(ratio, this.context.currentTime);
    this.sidechainCompressor.attack.setValueAtTime(attack, this.context.currentTime);
    this.sidechainCompressor.release.setValueAtTime(release, this.context.currentTime);
  }

  setSidechainSourceGain(value: number): void {
    const safeValue = Math.max(0, Math.min(1, value));
    this.sidechainSourceLevelValue = safeValue;
    this.sidechainSource.gain.setValueAtTime(safeValue, this.context.currentTime);
  }

  getTrackCount(): number {
    return this.trackIds.length;
  }

  getMeterRms(): number {
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);

    let total = 0;
    for (let i = 0; i < data.length; i += 1) {
      const sample = (data[i] - 128) / 128;
      total += sample * sample;
    }

    const rms = Math.sqrt(total / data.length);
    return rms;
  }
}

export { AudioGraph };
