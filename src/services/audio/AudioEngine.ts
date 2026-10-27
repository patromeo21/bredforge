import type { TrackKey } from './types';

const makeDriveCurve = (amount: number) => {
  const samples = 8192;
  const curve = new Float32Array(samples);
  const safeAmount = Math.max(0.25, amount);

  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * safeAmount * 1.8);
  }

  return curve;
};

export class AudioGraph {
  readonly context: AudioContext;
  readonly masterGain: GainNode;
  readonly masterDrive: WaveShaperNode;
  readonly masterFilter: BiquadFilterNode;
  readonly masterLimiter: DynamicsCompressorNode;
  readonly analyser: AnalyserNode;
  readonly output: GainNode;
  readonly tracks: Record<
    TrackKey,
    {
      preGain: GainNode;
      drive: WaveShaperNode;
      filter: BiquadFilterNode;
      gain: GainNode;
      pan: StereoPannerNode;
      compressor: DynamicsCompressorNode;
    }
  >;

  constructor(context: AudioContext) {
    this.context = context;
    this.masterGain = context.createGain();
    this.masterDrive = context.createWaveShaper();
    this.masterDrive.curve = makeDriveCurve(1.2);
    this.masterDrive.oversample = '4x';

    this.masterFilter = context.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 12000;
    this.masterFilter.Q.value = 1;

    this.masterLimiter = context.createDynamicsCompressor();
    this.masterLimiter.threshold.value = -4;
    this.masterLimiter.knee.value = 12;
    this.masterLimiter.ratio.value = 4;
    this.masterLimiter.attack.value = 0.003;
    this.masterLimiter.release.value = 0.12;

    this.output = context.createGain();
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 2048;

    this.masterGain.connect(this.masterDrive);
    this.masterDrive.connect(this.masterFilter);
    this.masterFilter.connect(this.masterLimiter);
    this.masterLimiter.connect(this.output);

    this.tracks = {
      vocals: this.createTrackNode('peaking', 2000),
      drums: this.createTrackNode('peaking', 400),
      bass: this.createTrackNode('lowshelf', 200),
      other: this.createTrackNode('highshelf', 5000),
    };

    (Object.keys(this.tracks) as TrackKey[]).forEach((key) => {
      const track = this.tracks[key];
      track.gain.connect(track.pan);
      track.pan.connect(this.masterGain);
    });

    this.output.connect(this.analyser);
    this.output.connect(this.context.destination);
  }

  private createTrackNode(type: BiquadFilterType, frequency: number) {
    const preGain = this.context.createGain();
    preGain.gain.value = 1;

    const drive = this.context.createWaveShaper();
    drive.curve = makeDriveCurve(1.6);
    drive.oversample = '4x';

    const filter = this.context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 1;

    const compressor = this.context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 8;
    compressor.ratio.value = 2.5;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.2;

    const gain = this.context.createGain();
    gain.gain.value = 1;

    const pan = this.context.createStereoPanner();
    pan.pan.value = 0;

    preGain.connect(drive);
    drive.connect(filter);
    filter.connect(compressor);
    compressor.connect(gain);

    return { preGain, drive, filter, gain, pan, compressor };
  }

  connectSource(source: AudioBufferSourceNode) {
    (Object.keys(this.tracks) as TrackKey[]).forEach((key) => {
      const track = this.tracks[key];
      source.connect(track.preGain);
    });
  }

  setTrackGain(track: TrackKey, value: number) {
    const node = this.tracks[track];
    if (!node) return;
    node.gain.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
    node.filter.gain.setTargetAtTime((value - 1) * 18, this.context.currentTime, 0.08);
  }

  setTrackDrive(track: TrackKey, value: number) {
    const node = this.tracks[track];
    if (!node) return;
    node.drive.curve = makeDriveCurve(value);
    node.drive.oversample = '4x';
  }

  setTrackFilterFrequency(track: TrackKey, value: number) {
    const node = this.tracks[track];
    if (!node) return;
    node.filter.frequency.setTargetAtTime(value, this.context.currentTime, 0.08);
  }

  setTrackFilterResonance(track: TrackKey, value: number) {
    const node = this.tracks[track];
    if (!node) return;
    node.filter.Q.setTargetAtTime(value, this.context.currentTime, 0.08);
  }

  setTrackPan(track: TrackKey, value: number) {
    const node = this.tracks[track];
    if (!node) return;
    node.pan.pan.setTargetAtTime(value, this.context.currentTime, 0.05);
  }

  setMasterDrive(value: number) {
    this.masterDrive.curve = makeDriveCurve(value);
    this.masterDrive.oversample = '4x';
  }

  setMasterFilterCutoff(value: number) {
    this.masterFilter.frequency.setTargetAtTime(value, this.context.currentTime, 0.08);
  }

  setMasterFilterResonance(value: number) {
    this.masterFilter.Q.setTargetAtTime(value, this.context.currentTime, 0.08);
  }

  setMasterLimiter(value: number) {
    this.masterLimiter.threshold.setTargetAtTime(value, this.context.currentTime, 0.08);
  }

  setMasterVolume(value: number) {
    this.output.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
  }

  getTrackCount() {
    return Object.keys(this.tracks).length;
  }
}
