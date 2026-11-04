export class TouchIsolationService {
  private element: HTMLElement;
  private originalTouchAction: string = '';
  private originalOverflow: string = '';

  constructor(element: HTMLElement) {
    this.element = element;
    this.init();
  }

  private init() {
    // Save original styles
    this.originalTouchAction = this.element.style.touchAction;
    this.originalOverflow = this.element.style.overflow;

    // Apply native browser-level touch isolation via CSS compositor rules.
    // 'touch-action: none' prevents pinch-zoom, rubber-banding, and panning 
    // natively without hijacking the JavaScript event lifecycle or killing gesture trust.
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