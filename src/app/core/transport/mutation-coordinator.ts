import { immutablePayload } from './immutable-payload';
// Framework-independent queue: callers supply authorized commands and read/reconcile
// adapters. No wire references or idempotency keys are manufactured from revisions.
export type MutationFailure = {
  readonly httpStatus?: number;
  readonly applicationCode?: string | number | null;
  readonly conflictKind?: ConflictKind | null;
  readonly uncertain?: boolean;
};
export type ConflictKind = 'revision' | 'lifecycle' | 'idempotency' | 'unknown';
export type MutationResult<T> = {
  readonly reference: string;
  readonly value: T;
};
export type MutationCommand<P, T> = {
  readonly payload: P;
  readonly replayable: boolean;
  readonly key: string | null;
  readonly send: (
    reference: string,
    payload: P,
    key: string | null,
    signal: AbortSignal,
  ) => Promise<MutationResult<T>>;
};
export type QueueState =
  'ready' | 'pending' | 'conflict' | 'uncertain' | 'closed';
export function conflictKind(
  code: string | number | null | undefined,
): ConflictKind {
  if (code === 'VERSION_CONFLICT') {
    return 'revision';
  }
  if (code === 'IDEMPOTENCY_MISMATCH' || code === 'COMMAND_KEY_REUSED') {
    return 'idempotency';
  }
  if (code === 'INVALID_STATE' || code === 'LIFECYCLE_CONFLICT') {
    return 'lifecycle';
  }
  return 'unknown';
}
export class MutationCoordinator {
  private reference: string;
  private state: QueueState = 'ready';
  private tail: Promise<unknown> = Promise.resolve();
  private controller = new AbortController();
  private generation = 0;
  private retained: MutationCommand<unknown, unknown> | null = null;
  private readonly commands = new WeakSet<object>();
  private readonly sent = new WeakSet<object>();
  private conflict: ConflictKind | null = null;
  constructor(
    reference: string,
    private readonly keyFactory: () => string = (): string =>
      crypto.randomUUID(),
  ) {
    if (!reference) {
      throw new Error('A current reference is required.');
    }
    this.reference = reference;
  }
  snapshot(): {
    reference: string;
    state: QueueState;
    conflict: ConflictKind | null;
    retainedPayload: unknown;
  } {
    return {
      reference: this.reference,
      state: this.state,
      conflict: this.conflict,
      retainedPayload: this.retained?.payload ?? null,
    };
  }
  command<P, T>(
    payload: P,
    replayable: boolean,
    send: MutationCommand<P, T>['send'],
  ): MutationCommand<P, T> {
    const command = Object.freeze({
      payload: immutablePayload(payload),
      replayable,
      key: replayable ? this.keyFactory() : null,
      send,
    });
    this.commands.add(command);
    return command;
  }
  enqueue<P, T>(command: MutationCommand<P, T>): Promise<T> {
    if (!this.commands.has(command)) {
      return Promise.reject(
        new Error('Use this resource queue to create the command.'),
      );
    }
    const generation = this.generation;
    const work = this.tail.then(async (): Promise<T> => {
      if (generation !== this.generation || this.state !== 'ready') {
        throw new Error('Queue requires reconciliation or is closed.');
      }
      if (!command.replayable && this.sent.has(command)) {
        throw new Error(
          'Create a new intentional command after reconciliation.',
        );
      }
      this.sent.add(command);
      this.state = 'pending';
      this.retained = command as MutationCommand<unknown, unknown>;
      try {
        const result = await command.send(
          this.reference,
          structuredClone(command.payload),
          command.key,
          this.controller.signal,
        );
        if (generation !== this.generation || this.controller.signal.aborted) {
          throw new Error('Actor changed.');
        }
        if (!result.reference) {
          throw new Error('Missing mutation revision.');
        }
        this.reference = result.reference;
        this.state = 'ready';
        this.retained = null;
        this.conflict = null;
        return result.value;
      } catch (error) {
        if (generation !== this.generation) {
          throw error;
        }
        this.recordFailure(error);
        throw error;
      }
    });
    this.tail = work.catch((): void => {
      /* Keep serial order after failure. */
    });
    return work;
  }
  private recordFailure(error: unknown): void {
    const failure = error as MutationFailure | null;
    if (failure?.httpStatus === 409 && !failure.uncertain) {
      this.state = 'conflict';
      this.conflict =
        failure.conflictKind ?? conflictKind(failure.applicationCode);
    } else if (
      failure?.uncertain ||
      failure?.httpStatus === 0 ||
      !failure?.httpStatus ||
      failure.httpStatus >= 500
    ) {
      this.state = 'uncertain';
    } else {
      this.state = 'ready';
    }
  }
  reconcile(reference: string): void {
    if (!reference || this.state === 'pending' || this.state === 'closed') {
      throw new Error('Cannot reconcile this queue.');
    }
    this.generation++;
    this.controller.abort();
    this.controller = new AbortController();
    this.reference = reference;
    this.state = 'ready';
    this.conflict = null;
    // Retained edits remain available. The caller chooses a new logical command
    // after reconciling; unchanged explicit idempotent replay keeps its original key.
  }
  close(): void {
    this.generation++;
    this.controller.abort();
    this.retained = null;
    this.state = 'closed';
  }
}
