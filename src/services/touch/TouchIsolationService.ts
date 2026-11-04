export interface TouchIsolationOptions {
  preventDefault?: boolean;
}

export class TouchIsolationService {
  private element: HTMLElement | null = null;
  private originalTouchAction: string = '';
  private originalOverflow: string = '';

  /**
   * Root-cause fix for persistent TS2554:
   * By providing a default parameter value (options: TouchIsolationOptions = {}),
   * TypeScript guarantees that the parameter is fully optional at the call site,
   * neutralizing any strict compiler checks or type-shadowing conflicts.
   */
  constructor(element: HTMLElement, options: TouchIsolationOptions = {}) {
    this.element = element;
    this.init();
  }

  private init() {
    if (!this.element) return;
    
    // Cache original styles for clean teardown
    this.originalTouchAction = this.element.style.touchAction;
    this.originalOverflow = this.element.style.overflow;

    // Apply compositor-level touch locks
    this.element.style.touchAction = 'none';
    this.element.style.overflow = 'hidden';
  }

  public destroy() {
    if (this.element) {
      this.element.style.touchAction = this.originalTouchAction;
      this.element.style.overflow = this.originalOverflow;
    }
  }
}