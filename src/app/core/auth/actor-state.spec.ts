import { TestBed } from '@angular/core/testing';

import { ActorState } from './actor-state';
import { SessionContext } from './session-context';

describe('Actor state isolation', () => {
  it('clears memory and aborts old work when accounts change or sign out', () => {
    const actors = TestBed.inject(ActorState);
    const session = TestBed.inject(SessionContext);
    let privateDraft: string | null = 'actor A private draft';
    actors.register(() => {
      privateDraft = null;
    });
    const oldSignal = actors.abortSignal;
    const oldEpoch = actors.epoch;
    session.resolve({
      status: 'authenticated',
      permissions: ['requests.start'],
    });
    expect(privateDraft).toBeNull();
    expect(oldSignal.aborted).toBe(true);
    expect(actors.epoch).toBeGreaterThan(oldEpoch);
    expect(actors.abortSignal.aborted).toBe(false);
    session.clear();
    expect(session.snapshot()).toEqual({ status: 'signed-out' });
  });
  it('runs every cleanup and still removes access when one cleanup fails', () => {
    const actors = TestBed.inject(ActorState);
    const session = TestBed.inject(SessionContext);
    const cleanup = vi.fn();
    actors.register(() => {
      throw new Error('fixture failure');
    });
    actors.register(cleanup);
    expect(() => session.clear()).toThrow('Actor state cleanup failed');
    expect(cleanup).toHaveBeenCalledOnce();
    expect(session.snapshot()).toEqual({ status: 'signed-out' });
  });
  it('allows destroyed features to unregister their cleanup', () => {
    const actors = TestBed.inject(ActorState);
    const cleanup = vi.fn();
    actors.register(cleanup)();
    actors.reset();
    expect(cleanup).not.toHaveBeenCalled();
  });
});
