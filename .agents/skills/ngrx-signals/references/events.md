# Events Plugin (Flux/Redux-style SignalStore)

The Events plugin (`@ngrx/signals/events`, **v19.2+**) adds an event-based layer to SignalStore, inspired by Flux/NgRx Store + Effects. It decouples _what_ happened (the event) from _how_ the store reacts (state transitions and side effects).

> The default SignalStore approach (`withMethods` + `rxMethod`) is sufficient for most cases. Reach for the Events plugin for **inter-store coordination, decoupled architectures, or micro-frontends**. Verify the package version supports it.

**Building blocks:** Event → Dispatcher (event bus) → Store (reducers + event handlers) → View (reads state, dispatches events).

## 1. Define events

`event(type, payloadType?)` for single creators; `eventGroup({ source, events })` to group by source. Convention: `"[Source] Event Name"`.

```ts
import { type } from "@ngrx/signals";
import { event, eventGroup } from "@ngrx/signals/events";

// individual
export const opened = event("[Book Search Page] Opened");
export const queryChanged = event(
  "[Book Search Page] Query Changed",
  type<string>(),
);

// grouped (preferred when many share a source)
export const bookSearchEvents = eventGroup({
  source: "Book Search Page",
  events: {
    opened: type<void>(),
    queryChanged: type<string>(),
  },
});
export const booksApiEvents = eventGroup({
  source: "Books API",
  events: {
    loadedSuccess: type<Book[]>(),
    loadedFailure: type<string>(),
  },
});
// bookSearchEvents.queryChanged('foo') → { type: '[Book Search Page] queryChanged', payload: 'foo' }
```

## 2. State transitions with `withReducer` + `on`

`on(...events, handler)` maps events to a handler `(event, state) => partial | updater | (partial|updater)[]`.

```ts
import { signalStore, withState } from "@ngrx/signals";
import { on, withReducer } from "@ngrx/signals/events";

export const BookSearchStore = signalStore(
  withState({ query: "", books: [] as Book[], isLoading: false }),
  withReducer(
    on(bookSearchEvents.opened, () => ({ isLoading: true })),
    on(bookSearchEvents.queryChanged, ({ payload: query }) => ({
      query,
      isLoading: true,
    })),
    on(booksApiEvents.loadedSuccess, ({ payload: books }) => ({
      books,
      isLoading: false,
    })),
    on(booksApiEvents.loadedFailure, () => ({ isLoading: false })),
  ),
);
```

A handler may return a partial state object, a `PartialStateUpdater`, or an array of them.

## 3. Side effects with `withEventHandlers`

Receives the store and returns a dictionary (or array) of observables that react to events via the injected `Events` service. **If a handler emits an event, it is auto-dispatched.** Use `mapResponse` ([operators.md](operators.md)) to turn results into success/failure events.

```ts
import { switchMap, tap } from "rxjs";
import { Events, withEventHandlers } from "@ngrx/signals/events";
import { mapResponse } from "@ngrx/operators";

export const BookSearchStore = signalStore(
  withState(/* ... */),
  withReducer(/* ... */),
  withEventHandlers(
    (store, events = inject(Events), booksService = inject(BooksService)) => ({
      loadBooksByQuery$: events
        .on(bookSearchEvents.opened, bookSearchEvents.queryChanged)
        .pipe(
          switchMap(() =>
            booksService.getByQuery(store.query()).pipe(
              mapResponse({
                next: (books) => booksApiEvents.loadedSuccess(books),
                error: (e: { message: string }) =>
                  booksApiEvents.loadedFailure(e.message),
              }),
            ),
          ),
        ),
      logError$: events
        .on(booksApiEvents.loadedFailure)
        .pipe(tap(({ payload }) => console.error(payload))),
    }),
  ),
);
```

- Handlers can also subscribe to any observable source (e.g. `timer(0, 30_000)` for polling).
- For custom state transitions that `withReducer` can't express, inject `ReducerEvents` instead of `Events` — it receives events _before_ `Events`, so state is updated before other handlers react.

## 4. Read state & dispatch

State is read exactly as in a normal SignalStore (`store.books()`, `store.isLoading()`). Dispatch via the `Dispatcher` service, or the ergonomic `injectDispatch`:

```ts
import { Dispatcher, injectDispatch } from "@ngrx/signals/events";

export class BookSearch {
  readonly store = inject(BookSearchStore);

  // option A: Dispatcher
  readonly dispatcher = inject(Dispatcher);
  open() {
    this.dispatcher.dispatch(bookSearchEvents.opened());
  }

  // option B (preferred): injectDispatch mirrors the event group as methods
  readonly dispatch = injectDispatch(bookSearchEvents);
  changeQuery(q: string) {
    this.dispatch.queryChanged(q);
  }
}
```

## Scoped events (advanced)

By default the `Dispatcher`/`Events` are global. Provide a local scope with `provideDispatcher()` in a component/feature `providers`. Events default to `self`; forward explicitly with `{ scope: 'parent' | 'global' }`:

```ts
@Component({ providers: [provideDispatcher(), BookSearchStore] })
export class BookSearch {
  readonly dispatch = injectDispatch(bookSearchEvents);
  changeQuery(q: string) {
    this.dispatch({ scope: "parent" }).queryChanged(q);
  }
}
```

A scope's `Events` sees its own events **and** those from ancestor/global scopes, but not the other way around. Inside handlers, forward returned events with `toScope('global')` (single) or the `mapToScope('parent')` operator (all).

**Use the Events plugin when** decoupling and cross-store/feature coordination justify the extra indirection; otherwise stick with plain `withMethods`/`rxMethod` ([signal-store.md](signal-store.md), [rxjs-integration.md](rxjs-integration.md)).
