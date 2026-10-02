# SignalStore Fundamentals

A SignalStore is created with `signalStore(...features)` and returns an **injectable Angular service**. Features compose state, computed signals, properties, and methods. Build the store by combining `withState`, `withComputed`, `withMethods`, and other features in order.

## State with `withState`

`withState` adds state slices. The initial state **must be a record/object literal**. A `Signal` is generated for every slice; nested objects become `DeepSignal`s with a signal per property (generated lazily).

```ts
import { signalStore, withState } from "@ngrx/signals";

type BookSearchState = {
  books: Book[];
  isLoading: boolean;
  filter: { query: string; order: "asc" | "desc" };
};

const initialState: BookSearchState = {
  books: [],
  isLoading: false,
  filter: { query: "", order: "asc" },
};

export const BookSearchStore = signalStore(withState(initialState));
// → books: Signal<Book[]>, isLoading: Signal<boolean>,
//   filter: DeepSignal<{...}>, filter.query: Signal<string>, ...
```

`withState` also accepts a **factory** run in the injection context, so initial state can come from a service or token: `withState(() => inject(BOOK_SEARCH_STATE))`.

## Computed signals with `withComputed`

Pass a factory that receives previously defined members and returns a dictionary of computed signals. A bare function value is automatically wrapped in `computed()`.

```ts
import { computed } from "@angular/core";
import { signalStore, withComputed, withState } from "@ngrx/signals";

export const BookSearchStore = signalStore(
  withState(initialState),
  withComputed(({ books, filter }) => ({
    booksCount: computed(() => books().length),
    sortedBooks: computed(() => {
      const dir = filter.order() === "asc" ? 1 : -1;
      return books().toSorted((a, b) => dir * a.title.localeCompare(b.title));
    }),
  })),
);
```

## Methods with `withMethods`

Pass a factory that receives the `store` instance (state, computed, prior methods). Inject dependencies via default parameters. Update state with `patchState`.

```ts
import { inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";

export const BookSearchStore = signalStore(
  withState(initialState),
  withMethods((store, booksService = inject(BooksService)) => ({
    updateQuery(query: string): void {
      // 👇 immutable update via updater function
      patchState(store, (state) => ({ filter: { ...state.filter, query } }));
    },
    async loadAll(): Promise<void> {
      patchState(store, { isLoading: true });
      const books = await booksService.getAll();
      patchState(store, { books, isLoading: false });
    },
  })),
);
```

For RxJS-based async (debouncing, cancellation, race conditions), use `rxMethod` — see [rxjs-integration.md](rxjs-integration.md). For signal-driven effects without RxJS, see [signal-method.md](signal-method.md).

## `patchState` — the only way to update

`patchState(store, ...updates)` accepts partial state objects and/or updater functions, applied in sequence.

```ts
patchState(store, { isLoading: true });
patchState(store, (state) => ({ filter: { ...state.filter, query } }));
patchState(store, { isLoading: false }, (s) => ({ books: [...s.books, book] }));
```

**CRITICAL RULES:**

- Updates **must be immutable** — spread/clone, never mutate the existing object/array.
- Use `patchState` only; do not reach into signals directly to mutate state.
- Reusable updaters can be extracted as `PartialStateUpdater<T>` functions (see [signal-state.md](signal-state.md) and [custom-features.md](custom-features.md)).

## Providing & injecting

A SignalStore is **not** registered anywhere by default. Choose the scope deliberately:

```ts
// Global / shared singleton — registered with the root injector.
export const BookSearchStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
);

// Local — tied to a component/route lifecycle.
@Component({
  providers: [BookSearchStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /* ... */
})
export class BookSearch {
  readonly store = inject(BookSearchStore);
}
```

Read state in templates via the generated signals: `store.books()`, `store.filter.query()`, `store.booksCount()`.

## Protected state (default)

By default, state is **protected** — it can only be changed by methods defined inside the store, not patched from outside. This is the recommended setting. Disabling it (`{ protectedState: false }`) is rarely appropriate:

```ts
export const BookSearchStore = signalStore(
  { protectedState: false }, // ⚠️ allows external patchState — avoid unless necessary
  withState(initialState),
);
```

For tests that need to set state directly, prefer the `unprotected` helper over disabling protection — see [testing.md](testing.md).

## Related features

- Lifecycle: [lifecycle-hooks.md](lifecycle-hooks.md) · Properties/private members: [store-props.md](store-props.md)
- Entities: [entity-management.md](entity-management.md) · Reusable features: [custom-features.md](custom-features.md)
- Derived writable state: [linked-state.md](linked-state.md) · Redux-style flow: [events.md](events.md)
