import { MutationCoordinator } from './mutation-coordinator';
import { ApiFailure, failure } from './api-failure';
function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
describe('Per-resource mutation coordination', () => {
  it('serializes save, row, attachment and complete using each returned whole revision', async () => {
    const queue = new MutationCoordinator('opaque/0');
    const gate = deferred<{ reference: string; value: number }>();
    const seen: string[] = [];
    const first = queue.enqueue(
      queue.command({ save: true }, true, async (ref) => {
        seen.push(ref);
        return gate.promise;
      }),
    );
    const rest = ['row', 'attachment', 'complete'].map((name, index) =>
      queue.enqueue(
        queue.command({ action: name }, true, async (ref) => {
          seen.push(ref);
          return { reference: 'opaque/' + (index + 2), value: index };
        }),
      ),
    );
    await Promise.resolve();
    expect(seen).toEqual(['opaque/0']);
    gate.resolve({ reference: 'opaque/1', value: 1 });
    await first;
    await Promise.all(rest);
    expect(seen).toEqual(['opaque/0', 'opaque/1', 'opaque/2', 'opaque/3']);
    expect(queue.snapshot().reference).toBe('opaque/4');
  });
  it.each(['revision', 'lifecycle', 'idempotency', 'unknown'] as const)(
    'retains edits and blocks queued commands after a %s conflict',
    async (kind) => {
      const queue = new MutationCoordinator('old');
      let calls = 0;
      const command = queue.command({ amount: '125.00' }, true, async () => {
        calls++;
        throw failure(
          409,
          { code: 1004, data: { conflict_kind: kind } },
          'fixture',
        );
      });
      const work = queue.enqueue(command).catch((error: unknown) => error);
      const next = queue
        .enqueue(
          queue.command({ complete: true }, true, async () => {
            calls++;
            return { reference: 'new', value: true };
          }),
        )
        .catch((error: unknown) => error);
      expect(await work).toBeInstanceOf(ApiFailure);
      await next;
      expect(calls).toBe(1);
      expect(queue.snapshot()).toMatchObject({
        state: 'conflict',
        conflict: kind,
        retainedPayload: { amount: '125.00' },
      });
    },
  );
  it('classifies old undifferentiated 1004 responses as unknown', async () => {
    const queue = new MutationCoordinator('old');
    await queue
      .enqueue(
        queue.command({}, true, async () => {
          throw failure(409, { code: 1004 }, null);
        }),
      )
      .catch(() => undefined);
    expect(queue.snapshot().conflict).toBe('unknown');
  });
  it('never retries an uncertain row command and requires a new intentional command after reconciliation', async () => {
    const queue = new MutationCoordinator('old');
    const send = vi.fn(async (): Promise<never> => {
      throw new ApiFailure(503, null, null, [], true);
    });
    const command = queue.command({ row: 'insert' }, false, send);
    await expect(queue.enqueue(command)).rejects.toBeInstanceOf(ApiFailure);
    expect(queue.snapshot().state).toBe('uncertain');
    expect(send).toHaveBeenCalledTimes(1);
    queue.reconcile('current');
    await expect(queue.enqueue(command)).rejects.toThrow('intentional');
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('keeps the original intent for replay and creates a new key for changed payload', async () => {
    let sequence = 0;
    const queue = new MutationCoordinator('old', () => 'key-' + ++sequence);
    const seen: unknown[] = [];
    let attempt = 0;
    const send = async (
      _ref: string,
      payload: { value: string },
      key: string | null,
    ): Promise<{ reference: string; value: boolean }> => {
      seen.push({ payload, key });
      if (!attempt++) {
        throw new ApiFailure(0, null, null, [], true);
      }
      return { reference: 'new', value: true };
    };
    const payload = { value: 'first' };
    const original = queue.command(payload, true, send);
    payload.value = 'outside change';
    await queue.enqueue(original).catch(() => undefined);
    queue.reconcile('latest');
    await queue.enqueue(original);
    const changed = queue.command({ value: 'changed' }, true, send);
    await queue.enqueue(changed);
    expect(seen).toEqual([
      { payload: { value: 'first' }, key: 'key-1' },
      { payload: { value: 'first' }, key: 'key-1' },
      { payload: { value: 'changed' }, key: 'key-2' },
    ]);
    expect(Object.isFrozen(original.payload)).toBe(true);
  });
  it('discards a late response and retained values after actor cleanup', async () => {
    const queue = new MutationCoordinator('old');
    const gate = deferred<{ reference: string; value: string }>();
    let signal!: AbortSignal;
    const work = queue.enqueue(
      queue.command({}, true, async (_ref, _body, _key, abort) => {
        signal = abort;
        return gate.promise;
      }),
    );
    await Promise.resolve();
    queue.close();
    gate.resolve({ reference: 'late', value: 'private' });
    await expect(work).rejects.toThrow('Actor changed');
    expect(signal.aborted).toBe(true);
    expect(queue.snapshot()).toMatchObject({
      reference: 'old',
      state: 'closed',
      retainedPayload: null,
    });
  });
  it('rejects a stale losing claimant without affecting another resource queue', async () => {
    const winner = new MutationCoordinator('task/current');
    const loser = new MutationCoordinator('task/stale');
    await winner.enqueue(
      winner.command({}, true, async () => ({
        reference: 'task/claimed',
        value: true,
      })),
    );
    await loser
      .enqueue(
        loser.command({}, true, async () => {
          throw failure(409, { data: { conflict_kind: 'revision' } }, null);
        }),
      )
      .catch(() => undefined);
    expect(winner.snapshot().state).toBe('ready');
    expect(loser.snapshot().state).toBe('conflict');
  });
});
