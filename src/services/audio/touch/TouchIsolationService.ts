export interface TouchPoint {
  pointerId: number;
  x: number;
  y: number;
  targetId: string;
}

export class TouchIsolationService {
  private activeTouches = new Map<number, TouchPoint>();
  private listenerElement: HTMLElement | null = null;

  constructor(element: HTMLElement) {
    this.listenerElement = element;
    this.initListeners();
  }

  private initListeners(): void {
    if (!this.listenerElement) return;

    // Enforce touch-action: none programmatically for extra safety
    this.listenerElement.style.touchAction = 'none';

    this.listenerElement.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.listenerElement.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.listenerElement.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.listenerElement.addEventListener('pointercancel', this.handlePointerCancel.bind(this));

    // Global window blur safety cleanup to flush orphaned touches on app switch
    window.addEventListener('blur', this.flushAllTouches.bind(this));
  }

  private handlePointerDown(e: PointerEvent): void {
    if (this.listenerElement) {
      try {
        this.listenerElement.setPointerCapture(e.pointerId);
      } catch {
        // Fallback if capture fails on specific mobile WebKit edge cases
      }
    }

    const rect = this.listenerElement?.getBoundingClientRect() || { left: 0, top: 0 };
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.activeTouches.set(e.pointerId, {
      pointerId: e.pointerId,
      x,
      y,
      targetId: (e.target as HTMLElement)?.dataset?.id || 'unknown',
    });
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.activeTouches.has(e.pointerId)) return;
    const rect = this.listenerElement?.getBoundingClientRect() || { left: 0, top: 0 };
    const touch = this.activeTouches.get(e.pointerId)!;
    touch.x = e.clientX - rect.left;
    touch.y = e.clientY - rect.top;
  }

  private handlePointerUp(e: PointerEvent): void {
    this.releasePointer(e.pointerId);
  }

  private handlePointerCancel(e: PointerEvent): void {
    this.releasePointer(e.pointerId);
  }

  private releasePointer(pointerId: number): void {
    if (this.activeTouches.has(pointerId)) {
      this.activeTouches.delete(pointerId);
    }
    if (this.listenerElement) {
      try {
        this.listenerElement.releasePointerCapture(pointerId);
      } catch {
        // Suppress if already released
      }
    }
  }

  public flushAllTouches(): void {
    this.activeTouches.clear();
  }

  public destroy(): void {
    if (!this.listenerElement) return;
    this.listenerElement.removeEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.listenerElement.removeEventListener('pointermove', this.handlePointerMove.bind(this));
    this.listenerElement.removeEventListener('pointerup', this.handlePointerUp.bind(this));
    this.listenerElement.removeEventListener('pointercancel', this.handlePointerCancel.bind(this));
    window.removeEventListener('blur', this.flushAllTouches.bind(this));
  }
}