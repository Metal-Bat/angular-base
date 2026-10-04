import { TestBed } from '@angular/core/testing';
import { ActorState } from '../auth/actor-state';
import { BoundedPolling } from './bounded-polling';
describe('Bounded polling lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    TestBed.configureTestingModule({ providers: [BoundedPolling] });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  it('serializes polls and aborts work on logout', async () => {
    const polling = TestBed.inject(BoundedPolling);
    let abort: AbortSignal | undefined;
    const work = vi.fn((signal: AbortSignal) => {
      abort = signal;
      return new Promise<void>(() => undefined);
    });
    polling.start(work);
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(60000);
    expect(work).toHaveBeenCalledTimes(1);
    TestBed.inject(ActorState).reset();
    expect(abort?.aborted).toBe(true);
  });
  it('pauses while hidden and resumes with one scheduled stream', async () => {
    const work = vi.fn().mockResolvedValue(undefined);
    const polling = TestBed.inject(BoundedPolling);
    polling.start(work);
    await vi.advanceTimersByTimeAsync(500);
    expect(work).toHaveBeenCalledTimes(1);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(60000);
    expect(work).toHaveBeenCalledTimes(1);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(500);
    expect(work).toHaveBeenCalledTimes(2);
  });
  it('backs off errors and never runs while edits disable polling', async () => {
    const work = vi.fn().mockRejectedValue(Error('Unavailable'));
    const polling = TestBed.inject(BoundedPolling);
    polling.start(work);
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(15000);
    expect(work).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15000);
    expect(work).toHaveBeenCalledTimes(2);
    polling.start(work, () => false);
    await vi.advanceTimersByTimeAsync(65000);
    expect(work).toHaveBeenCalledTimes(2);
  });
});
