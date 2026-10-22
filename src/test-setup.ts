import { vi } from 'vitest';

// JSDOM has no layout observer. Model its subscription lifecycle for DOM/controller
// tests; real sizing, overlays and container breakpoints are verified in Playwright.
class DomResizeObserver implements ResizeObserver {
  private readonly targets = new Set<Element>();
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element): void {
    this.targets.add(target);
    queueMicrotask(() => {
      if (this.targets.has(target)) {
        this.callback(
          [
            {
              target,
              contentRect: target.getBoundingClientRect(),
              borderBoxSize: [],
              contentBoxSize: [],
              devicePixelContentBoxSize: [],
            },
          ],
          this,
        );
      }
    });
  }
  unobserve(target: Element): void {
    this.targets.delete(target);
  }
  disconnect(): void {
    this.targets.clear();
  }
}
if (typeof ResizeObserver === 'undefined') {
  vi.stubGlobal('ResizeObserver', DomResizeObserver);
}
