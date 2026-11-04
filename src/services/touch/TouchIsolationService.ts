export class TouchIsolationService {
  private element: HTMLElement | null = null;
  private originalTouchAction: string = '';
  private originalOverflow: string = '';

  // Explicit constructor overloads to allow both 1 and 2 arguments
  constructor(element: HTMLElement);
  constructor(element: HTMLElement, options: any);
  constructor(element: HTMLElement, options?: any) {
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