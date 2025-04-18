export class Debouncer {
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(private delay: number) {}

  public debounce(fn: () => void): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      fn();
      this.timeoutId = null;
    }, this.delay);
  }

  public cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
