// ============================================================================
// BREDFORGE v1.0 — ADAPTIVE CANVAS PERFORMANCE OPTIMIZER [REF: M50]
// ============================================================================

export class VisualizerPerformanceOptimizer {
  private lastFrameTimestamp: number = performance.now();
  private frameCount: number = 0;
  private currentFps: number = 60;
  private isLowPowerMode: boolean = false;

  public monitorFrame(timestamp: number): { skipFrame: boolean; targetStride: number } {
    this.frameCount++;
    
    if (timestamp - this.lastFrameTimestamp >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (timestamp - this.lastFrameTimestamp));
      this.frameCount = 0;
      this.lastFrameTimestamp = timestamp;

      // Auto-trigger adaptive throttling if FPS drops below 45 under heavy stress
      this.isLowPowerMode = this.currentFps < 45;
    }

    // If under strain, double the array step stride to cut draw call overhead in half
    const targetStride = this.isLowPowerMode ? 2 : 1;
    
    return {
      skipFrame: false, // Maintain continuous line rendering, adjust stride instead
      targetStride,
    };
  }

  public getDiagnosticStats(): { fps: number; lowPower: boolean } {
    return {
      fps: this.currentFps,
      lowPower: this.isLowPowerMode,
    };
  }
}

export const visualizerPerformanceOptimizer = new VisualizerPerformanceOptimizer();