# State Tracking (`getState`, `watchState`)

These utilities (from `@ngrx/signals`) read the full state reactively — the basis for logging, undo/redo, and storage sync features.

## `getState` + `effect` (coalesced)

`getState(store)` returns the current state value. Inside a reactive context it tracks changes. Because `effect` is **glitch-free**, multiple synchronous updates in one tick collapse into a **single** effect run with the final value.

```ts
import { effect } from "@angular/core";
import { getState, signalStore, withHooks, withState } from "@ngrx/signals";

export const CounterStore = signalStore(
  withState({ count: 0 }),
  withHooks({
    onInit(store) {
      effect(() => console.log("counter state", getState(store)));
    },
  }),
);
```

Use this for logging/persistence where only the latest state per tick matters.

## `watchState` (synchronous, every change)

`watchState(store, watcher)` fires the watcher **synchronously on every change** — not coalesced. Required for undo/redo or anything that must observe each intermediate state.

```ts
import {
  getState,
  watchState,
  signalStore,
  withHooks,
  withState,
} from "@ngrx/signals";

withHooks({
  onInit(store) {
    watchState(store, (state) => console.log("[watchState]", state));
    // increments below log every step: {count:0},{count:1},{count:2}

    effect(() => console.log("[effect]", getState(store)));
    // effect logs once with the final value: {count:2}

    store.increment();
    store.increment();
  },
});
```

## Lifecycle & cleanup

- `watchState` must run in an **injection context** (auto-cleaned when the injector is destroyed), or pass `{ injector }` to use it outside one.
- It returns `{ destroy }` for manual cleanup before the injector is destroyed.

```ts
const { destroy } = watchState(store, console.log);
setTimeout(() => destroy(), 5_000); // stop watching early
```

**Choosing:** `effect` + `getState` for coalesced/latest-state side effects (logging, localStorage sync); `watchState` when you must capture every individual transition.

> For a ready-made Redux DevTools integration and storage sync, see the ngrx-toolkit extensions — [toolkit-extensions.md](toolkit-extensions.md).
