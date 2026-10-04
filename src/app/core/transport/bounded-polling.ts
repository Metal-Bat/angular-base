import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ActorState } from '../auth/actor-state';
@Injectable()
export class BoundedPolling {
  readonly paused = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private controller: AbortController | undefined;
  private generation = 0;
  private failures = 0;
  private work: ((signal: AbortSignal) => Promise<void>) | undefined;
  private enabled: () => boolean = () => true;
  private readonly changed = (): void => {
    this.generation++;
    this.paused.set(document.hidden || !navigator.onLine);
    this.controller?.abort();
    clearTimeout(this.timer);
    if (!this.paused() && this.work) {
      this.schedule(500);
    }
  };
  constructor() {
    document.addEventListener('visibilitychange', this.changed);
    window.addEventListener('online', this.changed);
    window.addEventListener('offline', this.changed);
    const release = inject(ActorState).register(() => this.stop());
    inject(DestroyRef).onDestroy(() => {
      this.stop();
      release();
      document.removeEventListener('visibilitychange', this.changed);
      window.removeEventListener('online', this.changed);
      window.removeEventListener('offline', this.changed);
    });
  }
  start(
    work: (signal: AbortSignal) => Promise<void>,
    enabled: () => boolean = () => true,
  ): void {
    this.stop();
    this.work = work;
    this.enabled = enabled;
    this.changed();
  }
  stop(): void {
    this.generation++;
    clearTimeout(this.timer);
    this.controller?.abort();
    this.controller = undefined;
    this.work = undefined;
    this.failures = 0;
  }
  private schedule(delay: number): void {
    const generation = this.generation;
    this.timer = setTimeout(() => {
      void this.tick(generation);
    }, delay);
  }
  private async tick(generation: number): Promise<void> {
    if (
      generation !== this.generation ||
      !this.work ||
      document.hidden ||
      !navigator.onLine
    ) {
      return;
    }
    if (this.controller) {
      this.schedule(1000);
      return;
    }
    const controller = new AbortController();
    this.controller = controller;
    try {
      if (this.enabled()) {
        await this.work(controller.signal);
      }
      this.failures = 0;
    } catch {
      this.failures = Math.min(this.failures + 1, 4);
    } finally {
      if (this.controller === controller) {
        this.controller = undefined;
      }
      if (
        generation === this.generation &&
        !document.hidden &&
        navigator.onLine
      ) {
        this.schedule(
          Math.min(60000, 15000 * 2 ** this.failures) +
            Math.floor(Math.random() * 2000),
        );
      }
    }
  }
}
