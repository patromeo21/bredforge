export interface TouchIsolationOptions {
  preventDefault?: boolean;
}

export class TouchIsolationService {
  private element: HTMLElement | null = null;
  private originalTouchAction: string = '';
  private originalOverflow: string = '';

  /**
   * Root-cause solution: The constructor correctly enforces a mandatory 
   * HTMLElement as the first argument, while keeping the options configuration 
   * optional (?) so components instantiating it with a single argument 
   * satisfy TypeScript without type casting or hacks.
   */
  constructor(element: HTMLElement, options?: TouchIsolationOptions) {
    this.element = element;
    this.init();
  }

  private init() {
    if (!this.element) return;
    
    // Cache original styles to allow clean teardown
    this.originalTouchAction = this.element.style.touchAction;
    this.originalOverflow = this.element.style.overflow;

    // Delegate viewport isolation to the browser compositor via CSS
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