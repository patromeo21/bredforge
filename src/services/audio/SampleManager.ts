export class AudioTransport {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private startTimestamp = 0;
  private pausedAt = 0;
  private isRunning = false;

  attachContext(context: AudioContext) {
    this.context = context;
  }

  async start(buffer: AudioBuffer, offset = 0, when: number = 0) {
    if (!this.context) {
      throw new Error('Audio context is not initialized.');
    }

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    if (this.source) {
      this.stop();
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = false;
    source.start(when, offset);

    this.source = source;
    this.startTimestamp = this.context.currentTime - offset;
    this.pausedAt = offset;
    this.isRunning = true;
  }

  pause() {
    if (!this.context || !this.source || !this.isRunning) return;

    try {
      this.source.stop();
    } catch {
      // No-op if source already ended.
    }

    this.pausedAt = this.context.currentTime - this.startTimestamp;
    this.isRunning = false;
    this.source.disconnect();
    this.source = null;
  }

  stop() {
    if (!this.source) return;

    try {
      this.source.stop();
    } catch {
      // No-op if source already stopped.
    }

    this.source.disconnect();
    this.source = null;
    this.isRunning = false;
    this.pausedAt = 0;
  }

  seek(time: number) {
    this.pausedAt = Math.max(0, time);
    if (this.isRunning) {
      this.pause();
    }
  }

  getCurrentTime() {
    if (!this.context || !this.isRunning) return this.pausedAt;
    return this.context.currentTime - this.startTimestamp;
  }

  isPlaying() {
    return this.isRunning;
  }
}
