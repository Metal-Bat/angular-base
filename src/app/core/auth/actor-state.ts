import { Injectable } from '@angular/core';

// Register actor-owned memory cleanup. No browser persistence is introduced here.
@Injectable({ providedIn: 'root' })
export class ActorState {
  private readonly cleanups = new Set<() => void>();
  private revision = 0;
  private controller = new AbortController();

  get epoch(): number {
    return this.revision;
  }
  get abortSignal(): AbortSignal {
    return this.controller.signal;
  }

  register(cleanup: () => void): () => void {
    this.cleanups.add(cleanup);
    return (): void => {
      this.cleanups.delete(cleanup);
    };
  }

  reset(): void {
    this.revision += 1;
    this.controller.abort();
    this.controller = new AbortController();
    const errors: unknown[] = [];
    for (const cleanup of this.cleanups) {
      try {
        cleanup();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, 'Actor state cleanup failed.');
    }
  }
}
