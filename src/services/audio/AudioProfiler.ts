// ============================================================================
// BREDFORGE v1.0 — AUDIO THREAD & LATENCY PROFILER (AudioProfiler.ts)
// ============================================================================

export interface AudioPerformanceMetrics {
  sampleRate: number;
  baseLatency: number;
  outputLatency: number;
  state: AudioContextState;
  currentTime: number;
}

export class AudioProfiler {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  public getMetrics(): AudioPerformanceMetrics {
    return {
      sampleRate: this.ctx.sampleRate,
      baseLatency: (this.ctx as any).baseLatency || 0,
      outputLatency: (this.ctx as any).outputLatency || 0,
      state: this.ctx.state,
      currentTime: this.ctx.currentTime,
    };
  }

  public logDiagnostics(): void {
    const metrics = this.getMetrics();
    console.group('[BredForge Audio Diagnostics]');
    console.log(`Audio Context State: ${metrics.state}`);
    console.log(`Sample Rate: ${metrics.sampleRate} Hz`);
    console.log(`Base Latency: ${(metrics.baseLatency * 1000).toFixed(2)} ms`);
    console.log(`Output Latency: ${(metrics.outputLatency * 1000).toFixed(2)} ms`);
    console.log(`Engine Clock: ${metrics.currentTime.toFixed(3)} s`);
    console.groupEnd();
  }
}