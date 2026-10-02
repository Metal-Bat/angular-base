# `@ngrx/operators`

A small companion package of RxJS operators used heavily inside `rxMethod` ([rxjs-integration.md](rxjs-integration.md)) and classic Effects. Install with `ng add @ngrx/operators@latest`.

> Historical note: `tapResponse` moved here from `@ngrx/component-store`, and `concatLatestFrom` from `@ngrx/effects`, in v18. Always import from `@ngrx/operators`.

## `tapResponse` — safe response handling

Wraps `tap` (next/error) plus `catchError(() => EMPTY)`, so the **error case is always handled and the stream keeps running** after an error. This is the recommended way to handle API responses in `rxMethod`. Put it on the **inner** observable (inside `switchMap`/`exhaustMap`/etc.) so the outer stream isn't completed by an error.

```ts
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { tapResponse } from "@ngrx/operators";

readonly loadMovie = rxMethod<string>(
  pipe(
    switchMap((id) =>
      this.moviesService.getMovie(id).pipe(
        tapResponse({
          next: (movie) => patchState(store, { movie }),
          error: (error: HttpErrorResponse) => this.logError(error),
        })
      )
    )
  )
);
```

`tapResponse` also accepts optional `complete` and `finalize` callbacks (e.g. clear a loading flag in `finalize`):

```ts
tapResponse({
  next: (movies) => patchState(store, { movies }),
  error: (e: HttpErrorResponse) => this.logError(e),
  finalize: () => patchState(store, { isLoading: false }),
});
```

## `mapResponse` — map result to a value/event/action

Like `tapResponse` but you **return** a value from `next`/`error` (it `map`s rather than `tap`s). Ideal for the Events plugin ([events.md](events.md)) and classic Effects, where each branch returns the next event/action.

```ts
import { mapResponse } from "@ngrx/operators";

// In an Events-plugin handler:
switchMap(() =>
  booksService.getByQuery(query).pipe(
    mapResponse({
      next: (books) => booksApiEvents.loadedSuccess(books),
      error: (error: { message: string }) =>
        booksApiEvents.loadedFailure(error.message),
    }),
  ),
);

// In a classic functional Effect:
exhaustMap(() =>
  moviesService.getAll().pipe(
    mapResponse({
      next: (movies) => MoviesApiActions.moviesLoadedSuccess({ movies }),
      error: (error: { message: string }) =>
        MoviesApiActions.moviesLoadedFailure({ errorMsg: error.message }),
    }),
  ),
);
```

## `concatLatestFrom` — lazy `withLatestFrom`

Like `withLatestFrom`, but the observable factory is **evaluated lazily** (only when the source emits). This avoids eagerly evaluating selectors and the cost of creating observables that may never be needed.

```ts
import { concatLatestFrom } from "@ngrx/operators";

actions$.pipe(
  ofType(routerNavigatedAction),
  concatLatestFrom(() => store.select(selectRouteData)), // not evaluated until source emits
  map(([, data]) => `Book Collection - ${data["title"]}`),
  tap((title) => titleService.setTitle(title)),
);
```

The factory may return a single observable or an array of observables.

**Rule of thumb:** `tapResponse` when you patch state directly inside the handler; `mapResponse` when the handler must return an event/action.
