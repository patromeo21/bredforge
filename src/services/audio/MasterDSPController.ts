import { AudioGraph } from './AudioGraph';

export class MasterDSPController {
  private audioGraph: AudioGraph;

  constructor(audioGraph: AudioGraph) {
    this.audioGraph = audioGraph;
  }

  public applySidechainPreset(preset: 'soft' | 'medium' | 'hard'): void {
    this.audioGraph.setSidechainPreset(preset);
  }

  public setFilterFlipMode(isLowpass: boolean): void {
    this.audioGraph.toggleFilterFlip(isLowpass);
  }

  public async unlockAudioContext(): Promise<void> {
    await this.audioGraph.resumeContext();
  }
}