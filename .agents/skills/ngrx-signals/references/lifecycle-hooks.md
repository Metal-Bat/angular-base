# Lifecycle Hooks (`withHooks`)

`withHooks` runs logic when the store is initialized or destroyed. Both `onInit` and `onDestroy` receive the store instance and run in the **injection context** (so you can `inject(...)` and use `takeUntilDestroyed`).

## Object signature

```ts
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { interval } from "rxjs";
import {
  signalStore,
  withState,
  withMethods,
  withHooks,
  patchState,
} from "@ngrx/signals";

export const CounterStore = signalStore(
  withState({ count: 0 }),
  withMethods((store) => ({
    increment: () => patchState(store, (s) => ({ count: s.count + 1 })),
  })),
  withHooks({
    onInit(store) {
      interval(2_000)
        .pipe(takeUntilDestroyed()) // auto-unsubscribe on destroy
        .subscribe(() => store.increment());
    },
    onDestroy(store) {
      console.log("count on destroy", store.count());
    },
  }),
);
```

## Factory signature (share state / inject for `onDestroy`)

Use the factory form to share variables between hooks or to use injected dependencies inside `onDestroy` (which would otherwise be outside the injection context).

```ts
withHooks((store) => {
  const logger = inject(Logger);
  let id = 0;
  return {
    onInit() {
      id = setInterval(() => store.increment(), 2_000);
    },
    onDestroy() {
      logger.info("count on destroy", store.count());
      clearInterval(id);
    },
  };
});
```

**Tips:**

- A common `onInit` use is kicking off an `rxMethod` data load, e.g. `store.loadByQuery(store.filter.query)`.
- To run an `effect` that reacts to state, call it inside `onInit` (you're in the injection context). For synchronous tracking of every change, use `watchState` — see [state-tracking.md](state-tracking.md).
- Always clean up imperative timers/subscriptions in `onDestroy` (or use `takeUntilDestroyed`).
