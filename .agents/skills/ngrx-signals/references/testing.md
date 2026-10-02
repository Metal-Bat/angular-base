# Testing SignalStore

A SignalStore is an Angular service — test it like one. Examples use Vitest, but the ideas apply to any runner.

## Guiding principles

- **Assert on the public API only** (state signals, computed values, and the effect of calling methods). Don't read internal/private members or spy on the store's own methods — that couples tests to implementation. If a method gets complex, extract the logic into a service, call it from the method, and mock the service.
- **Use `TestBed`.** It supplies the DI/injection context that `rxMethod`, `signalMethod`, and `inject()` require. Instantiating with `new` won't work for those.

## Injecting the store

```ts
import { TestBed } from "@angular/core/testing";

// Global store: { providedIn: 'root' } — just inject it.
const store = TestBed.inject(CounterStore);

// Local store: provide it in the testing module first.
TestBed.configureTestingModule({ providers: [CounterStore] });
const store = TestBed.inject(CounterStore);
```

## Asserting state, computed & methods

```ts
const CounterStore = signalStore(
  { providedIn: "root" },
  withState({ count: 0 }),
  withComputed(({ count }) => ({ doubleCount: () => count() * 2 })),
  withMethods((store) => ({
    increment: () => patchState(store, ({ count }) => ({ count: count + 1 })),
  })),
);

it("derives doubleCount and updates on increment", () => {
  const store = TestBed.inject(CounterStore);
  expect(store.count()).toBe(0);
  expect(store.doubleCount()).toBe(0);

  store.increment();
  expect(store.count()).toBe(1);
  expect(store.doubleCount()).toBe(2);
});
```

## The `unprotected` helper

State is protected by default, so `patchState` can't set it from a test. Wrap the store with `unprotected` (from `@ngrx/signals/testing`) to get a writable view — preferable to disabling `protectedState` in production code.

```ts
import { unprotected } from "@ngrx/signals/testing";

patchState(unprotected(store), { count: 5 });
expect(store.doubleCount()).toBe(10);
```

## Mocking dependencies

Register a fake with `useValue` implementing only the methods the store uses:

```ts
TestBed.configureTestingModule({
  providers: [{ provide: StepService, useValue: { getStep: () => 3 } }],
});
const store = TestBed.inject(CounterStore);
store.increment();
expect(store.count()).toBe(3);
```

## Testing `signalMethod`

The method runs an internal `effect`. Call it within an injection context (`TestBed.runInInjectionContext`) and wait for the effect (`expect.poll` or `TestBed.tick()`) before asserting. Static-value calls apply synchronously.

```ts
it("increments by a signal step after tick", async () => {
  const store = TestBed.inject(CounterStore);
  const step = signal(2);

  TestBed.runInInjectionContext(() => store.increment(step));
  await expect.poll(() => store.count()).toBe(2);

  step.set(3);
  TestBed.tick();
  // or: await expect.poll(() => store.count()).toBe(5);
});
```

## Testing `rxMethod`

Same as `signalMethod`, plus it accepts an `Observable`. Synchronous observables apply immediately; async ones need `expect.poll`.

```ts
store.increment(of(1, 2, 3));
expect(store.count()).toBe(6);

store.increment(scheduled([1, 2, 3], asyncScheduler));
await expect.poll(() => store.count()).toBe(6);
```

## Mocking the store in a component test

Replace the store with a plain object exposing the same API (signals for state/computed, functions for methods) via `useValue`.

```ts
const count = signal(0);
const mockStore = { count, increment: () => count.set(count() + 1) };

TestBed.configureTestingModule({
  providers: [{ provide: CounterStore, useValue: mockStore }],
}).createComponent(CounterComponent);
```

Prefer asserting the resulting **state/DOM** over asserting that a method was called (`vi.fn()`), per the public-API principle.

## Testing custom features

Wrap the [`signalStoreFeature`](custom-features.md) in a minimal store and assert on it:

```ts
const TestStore = signalStore({ providedIn: "root" }, withCounter());
const store = TestBed.inject(TestStore);
store.increment();
expect(store.doubleCount()).toBe(2);
```
