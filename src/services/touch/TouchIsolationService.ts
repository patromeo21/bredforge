export interface TouchIsolationOptions {
  preventDefault?: boolean;
}

export class TouchIsolationService {
  private element: HTMLElement | null = null;
  private originalTouchAction: string = '';
  private originalOverflow: string = '';

  constructor(element: HTMLElement, options: TouchIsolationOptions = {}) {
    this.element = element;
    this.init();
  }

  private init() {
    if (!this.element) return;
    
    this.originalTouchAction = this.element.style.touchAction;
    this.originalOverflow = this.element.style.overflow;

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