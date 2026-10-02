# RxJS Integration (`rxMethod`)

`rxMethod` (from `@ngrx/signals/rxjs-interop`) is the **opt-in** bridge to RxJS. It takes a pipe of operators and returns a reactive method that can be called with a **static value, a signal, a computation function, or an observable**. It's the recommended way to handle API calls and any async work that needs cancellation, debouncing, or race-condition control.

> Import: `import { rxMethod } from '@ngrx/signals/rxjs-interop';`

## Basics

```ts
import { map, pipe, tap } from "rxjs";
import { rxMethod } from "@ngrx/signals/rxjs-interop";

readonly logDoubled = rxMethod<number>(
  pipe(map((n) => n * 2), tap(console.log))
);
```

How the chain executes depends on the argument:

```ts
this.logDoubled(2); // runs once → 4
this.logDoubled(signal(10)); // re-runs whenever the signal changes
this.logDoubled(() => a() + b()); // computation combining multiple signals; re-runs on change
this.logDoubled(of(100, 200)); // runs per emission → 200, 400
```

## Handling API calls (the main use case)

Pick the flattening operator deliberately to control race conditions, and **always handle errors with `tapResponse`** (see [operators.md](operators.md)) so the stream survives errors.

```ts
import { debounceTime, distinctUntilChanged, pipe, switchMap, tap } from "rxjs";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { tapResponse } from "@ngrx/operators";

loadByQuery: rxMethod<string>(
  pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap(() => patchState(store, { isLoading: true })),
    switchMap((query) =>
      booksService.getByQuery(query).pipe(
        tapResponse({
          next: (books) => patchState(store, { books }),
          error: console.error,
          finalize: () => patchState(store, { isLoading: false }),
        })
      )
    )
  )
),
```

**Choosing the flattening operator:**

- `switchMap` — cancel the previous request (typeahead/search).
- `concatMap` — queue requests in order.
- `exhaustMap` — ignore new triggers while one is in flight (submit buttons, refresh).
- `mergeMap` — run concurrently (use sparingly).

### Reactive method without arguments

Use the `void` generic:

```ts
loadAllBooks: rxMethod<void>(
  exhaustMap(() =>
    booksService.getAll().pipe(
      tapResponse({ next: (books) => patchState(store, { books }), error: console.error })
    )
  )
),
// later: store.loadAllBooks();
```

### Wiring to a signal in a component

```ts
constructor() {
  // re-fetch whenever the query signal changes
  this.store.loadByQuery(this.store.filter.query);
}
```

## Lifecycle & cleanup

- `rxMethod` must be **created in an injection context**; it's tied to that injector and cleaned up automatically when the injector is destroyed.
- If created outside an injection context, pass an injector: `rxMethod(pipe(...), { injector })`.
- **Calling** the method with a signal/computation/observable outside an injection context without an explicit injector is **deprecated** (will throw in future). Either call it in a constructor/field initializer, or pass `{ injector }` in the config.
- Cross-injector calls: if you call an ancestor-provided `rxMethod` from a descendant outside that descendant's context, pass `{ injector: this.#injector }` so cleanup tracks the descendant.
- Manual cleanup: the method exposes `.destroy()`, and each call returns a ref with its own `.destroy()`.

## `rxMethod` vs `signalMethod`

If you don't need RxJS operators/observables, prefer [`signalMethod`](signal-method.md) — it has no RxJS dependency and a smaller bundle. Choose `rxMethod` when you need operators like `switchMap`/`debounceTime` or observable inputs, since RxJS handles race conditions better than plain signals.
