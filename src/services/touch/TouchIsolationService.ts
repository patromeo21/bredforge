export class TouchIsolationService {
  private element: HTMLElement;
  private boundHandler: (e: TouchEvent) => void;

  constructor(element: HTMLElement) {
    this.element = element;
    this.boundHandler = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };
    this.element.addEventListener('touchstart', this.boundHandler, { passive: false });
    this.element.addEventListener('touchmove', this.boundHandler, { passive: false });
  }

  public destroy(): void {
    this.element.removeEventListener('touchstart', this.boundHandler);
    this.element.removeEventListener('touchmove', this.boundHandler);
  }
}