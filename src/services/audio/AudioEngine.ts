// src/services/audio/AudioEngine.ts
// Fixed AudioEngine with proper TypeScript casting for AudioContext constructor

export class AudioEngine {
  private ctx: AudioContext | null = null;

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx!;
  }
}

export const audioEngine = new AudioEngine();
