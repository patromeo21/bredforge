// ============================================================================
// STAGE D - PHASE 26: DECOUPLED UI FRAME PROXY DRAW PIPELINE (UIFrameProxy.ts)
// ============================================================================

export class UIFrameProxy {
  private static animationFrameId: number | null = null;
  private static isRunning: boolean = false;

  public static startLoop(callback: () => void): void {
    if (UIFrameProxy.isRunning) {
      return;
    }

    UIFrameProxy.isRunning = true;

    const loop = () => {
      if (!UIFrameProxy.isRunning) {
        return;
      }
      callback();
      UIFrameProxy.animationFrameId = requestAnimationFrame(loop);
    };

    UIFrameProxy.animationFrameId = requestAnimationFrame(loop);
  }

  public static stopLoop(): void {
    UIFrameProxy.isRunning = false;
    if (UIFrameProxy.animationFrameId !== null) {
      cancelAnimationFrame(UIFrameProxy.animationFrameId);
      UIFrameProxy.animationFrameId = null;
    }
  }
}