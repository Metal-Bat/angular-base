# Store Properties (`withProps`) & Private Members

## `withProps` — non-state members

`withProps` adds **static properties, observables, injected dependencies, or any custom values** to a store. It takes a factory receiving previously defined members and returns a dictionary. Use it for things that aren't reactive state slices.

### Exposing observables (RxJS interop)

```ts
import { toObservable } from "@angular/core/rxjs-interop";
import { signalStore, withProps, withState } from "@ngrx/signals";

export const BooksStore = signalStore(
  withState({ books: [] as Book[], isLoading: false }),
  withProps(({ isLoading }) => ({
    isLoading$: toObservable(isLoading),
  })),
);
```

### Grouping dependencies

Inject once in `withProps` and consume across later features. Note the destructuring `({ booksService, logger, ...store })` so `patchState(store, ...)` still works.

```ts
export const BooksStore = signalStore(
  withState({ books: [] as Book[], isLoading: false }),
  withProps(() => ({
    booksService: inject(BooksService),
    logger: inject(Logger),
  })),
  withMethods(({ booksService, logger, ...store }) => ({
    async loadBooks(): Promise<void> {
      logger.debug("Loading books...");
      patchState(store, { isLoading: true });
      const books = await booksService.getAll();
      patchState(store, { books, isLoading: false });
    },
  })),
  withHooks({ onInit: ({ logger }) => logger.debug("BooksStore initialized") }),
);
```

> Injecting deps in `withProps` vs. default params of `withMethods` are both fine. Prefer `withProps` when the same dependency is needed by **multiple** later features.

## Private members (`_` prefix)

Prefix any root-level **state slice, computed signal, property, or method** with `_` to make it inaccessible from outside the store. This is purely a SignalStore convention (enforced via types), and applies across `withState`, `withComputed`, `withProps`, and `withMethods`.

```ts
export const CounterStore = signalStore(
  withState({ count1: 0, _count2: 0 }), // _count2 private
  withComputed(({ count1, _count2 }) => ({
    _doubleCount1: computed(() => count1() * 2), // private
    doubleCount2: computed(() => _count2() * 2), // public
  })),
  withProps(({ _count2, _doubleCount1 }) => ({
    _count2$: toObservable(_count2), // private
    doubleCount1$: toObservable(_doubleCount1), // public
  })),
  withMethods((store) => ({
    increment1: () => patchState(store, { count1: store.count1() + 1 }),
    _increment2: () => patchState(store, { _count2: store._count2() + 1 }), // private
  })),
);
```

From a component, `store.count1()` / `store.doubleCount2()` / `store.increment1()` are allowed; the `_`-prefixed members are type errors.

**Pattern:** keep internal machinery private (`_`) and expose a small, intentional public API. This pairs well with private entity collections (`collection: '_todo'`) — see [entity-management.md](entity-management.md).
