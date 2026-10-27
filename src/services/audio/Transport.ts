import type { TrackKey } from './types';

export type { TrackKey } from './types';

export class AudioGraph {
  readonly context: AudioContext;
  readonly masterGain: GainNode;
  readonly analyser: AnalyserNode;
  readonly output: GainNode;
  readonly tracks: Record<TrackKey, { filter: BiquadFilterNode; gain: GainNode; pan: StereoPannerNode }>;

  constructor(context: AudioContext) {
    this.context = context;
    this.masterGain = context.createGain();
    this.output = context.createGain();
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 2048;

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

    this.masterGain.connect(this.output);
    this.output.connect(this.analyser);
    this.output.connect(this.context.destination);
  }

  private createTrackNode(type: BiquadFilterType, frequency: number) {
    const filter = this.context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 1;

    const gain = this.context.createGain();
    gain.gain.value = 1;

    const pan = this.context.createStereoPanner();
    pan.pan.value = 0;

    filter.connect(gain);
    return { filter, gain, pan };
  }

  connectSource(source: AudioBufferSourceNode) {
    (Object.keys(this.tracks) as TrackKey[]).forEach((key) => {
      const track = this.tracks[key];
      source.connect(track.filter);
    });
  }

  setTrackGain(track: TrackKey, value: number) {
    const node = this.tracks[track];
    if (!node) return;
    node.gain.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
    node.filter.gain.setTargetAtTime((value - 1) * 20, this.context.currentTime, 0.1);
  }

  setTrackPan(track: TrackKey, value: number) {
    const node = this.tracks[track];
    if (!node) return;
    node.pan.pan.setTargetAtTime(value, this.context.currentTime, 0.05);
  }

  setMasterVolume(value: number) {
    this.output.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
  }

  getTrackCount() {
    return Object.keys(this.tracks).length;
  }
}
