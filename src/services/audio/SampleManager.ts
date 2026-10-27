export class AudioTransport {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private startedAt = 0;
  private pausedAt = 0;
  private isRunning = false;

  attachContext(context: AudioContext) {
    this.context = context;
  }

  async start(source: AudioBufferSourceNode, offset = 0) {
    if (!this.context) {
      throw new Error('Audio context is not initialized.');
    }

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    if (this.source) {
      this.stop();
    }

    this.source = source;
    this.source.start(0, offset);
    this.startedAt = this.context.currentTime - offset;
    this.pausedAt = offset;
    this.isRunning = true;
  }

  pause() {
    if (!this.context || !this.source || !this.isRunning) return;

    try {
      this.source.stop();
    } catch {
      // safe no-op when the source has already ended
    }

    this.pausedAt = this.context.currentTime - this.startedAt;
    this.isRunning = false;
    this.source.disconnect();
    this.source = null;
  }

  stop() {
    if (!this.source) return;

    try {
      this.source.stop();
    } catch {
      // safe no-op when the source has already stopped
    }

    this.source.disconnect();
    this.source = null;
    this.pausedAt = 0;
    this.isRunning = false;
  }

  seek(time: number) {
    this.pausedAt = Math.max(0, time);
    if (this.isRunning) {
      this.pause();
    }
  }

  getCurrentTime() {
    if (!this.context || !this.isRunning) return this.pausedAt;
    return this.context.currentTime - this.startedAt;
  }

  isPlaying() {
    return this.isRunning;
  }
}
