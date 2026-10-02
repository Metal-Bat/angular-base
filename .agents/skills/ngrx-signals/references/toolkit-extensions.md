# NgRx Toolkit Extensions (`@angular-architects/ngrx-toolkit`)

A **community** package (by Angular Architects, not part of official NgRx) that adds extra `signalStore` features. Each is a normal SignalStore feature you drop into `signalStore(...)` alongside `withState`/`withMethods`/etc.

```sh
npm i @angular-architects/ngrx-toolkit
```

> All imports below come from `@angular-architects/ngrx-toolkit`. This is a third-party package on its own release cadence — verify the installed version and prefer official `@ngrx/signals` equivalents where they exist (noted below). Docs: https://ngrx-toolkit.angulararchitects.io/docs/extensions

## Quick map

| Extension                                     | Use it for                                             | Notes                                                                                              |
| --------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `withDevtools`                                | Redux DevTools integration                             | ⭐️ most-used                                                                                       |
| `withStorageSync`                             | Persist state to localStorage/sessionStorage/IndexedDB |                                                                                                    |
| `withCallState`                               | Loading/loaded/error status for async ops              |                                                                                                    |
| `withReset`                                   | `resetState()` back to initial                         |                                                                                                    |
| `withUndoRedo`                                | Undo/redo history                                      |                                                                                                    |
| `withImmutableState`                          | Throw on accidental mutation                           | dev-mode by default                                                                                |
| `withConditional`                             | Pick a feature at runtime                              |                                                                                                    |
| `withDataService`                             | CRUD wiring over `withEntities`                        |                                                                                                    |
| `withResource` / `withEntityResources`        | Angular `Resource`/`httpResource` in the store         | early access; may land in NgRx                                                                     |
| `withMutations` (`httpMutation`/`rxMutation`) | Write operations (POST/PUT/DELETE)                     | early access                                                                                       |
| `withRedux`                                   | Redux pattern in the store                             | **deprecated** → use `@ngrx/signals/events` ([events.md](events.md))                               |
| `withFeatureFactory`                          | Pass store data into a feature                         | **deprecated** → use `withFeature` from `@ngrx/signals` ([custom-features.md](custom-features.md)) |

---

## `withDevtools` ⭐️

Connects a SignalStore to the Redux DevTools browser extension. Pass a store name. Activates when you open the DevTools "NgRx Signal Store" tab.

```ts
import { withDevtools } from "@angular-architects/ngrx-toolkit";

export const FlightStore = signalStore(
  { providedIn: "root" },
  withDevtools("flights"),
  withState({ flights: [] as Flight[] }),
);
```

Companions (all from the toolkit):

- `updateState(store, 'action name', partial)` — like `patchState` but labels the action in DevTools.
- `renameDevtoolsName(store, name)` — rename at runtime (e.g. per instance).
- `withGlitchTracking()` — record intermediate states Angular would otherwise coalesce: `withDevtools('counter', withGlitchTracking())`.
- `withMapper((state) => …)` — transform state before it's sent (e.g. redact passwords).
- `withDisabledNameIndices()` — disable auto-indexing of duplicate names (throws if two instances coexist).
- `withTrackedReducer(...)` — DevTools tracking for the Events plugin ([events.md](events.md)); replaces `withReducer` and **requires** `withDevtools(..., withGlitchTracking())` (v20.7+).

**Production:** `withDevtools()` is enabled in prod by default. To tree-shake it out, swap it for `withDevtoolsStub` via Angular `fileReplacements` in `angular.json` and reference it through your `environment` file.

## `withStorageSync`

Synchronizes state with Web Storage / IndexedDB.

```ts
import { withStorageSync } from "@angular-architects/ngrx-toolkit";

const UserStore = signalStore(
  withState({ name: "John", sessionToken: "secret" }),
  withStorageSync({
    key: "user",
    autoSync: true, // read on init, write on every change (default)
    select: ({ name }) => ({ name }), // persist only a subset
    // stringify / parse to customize serialization (e.g. Date handling)
  }),
);
```

- `autoSync: false` → call `readFromStorage()` / `writeToStorage()` / `clearStorage()` manually.
- `withSessionStorage()` for `sessionStorage`: `withStorageSync('user', withSessionStorage())`.
- `withIndexedDB()` for async storage — methods return promises; await `store.whenSynced()` (or disable autoSync and read in `onInit`) to sequence reads before writes.
- SSR-safe: falls back to a stub on the server.

## `withCallState`

Adds async status tracking: a `callState` slice (`'init' | 'loading' | 'loaded' | { error }`), computed `loading`/`loaded`/`error`, and updaters `setLoading()`/`setLoaded()`/`setError(err)`.

```ts
import {
  withCallState,
  setLoading,
  setLoaded,
  setError,
} from "@angular-architects/ngrx-toolkit";

const store = signalStore(
  withCallState(), // or { collection: 'todos' } / { collections: ['todos','users'] }
  withMethods((store) => ({
    async load() {
      patchState(store, setLoading());
      try {
        /* ... */ patchState(store, setLoaded());
      } catch (e) {
        patchState(store, setError(e));
      }
    },
  })),
);
```

Named collections prefix everything (`todosLoading`, `setLoading('todos')`, …). For a hand-rolled equivalent, see the `withRequestStatus` example in [custom-features.md](custom-features.md).

## `withReset`

Adds `resetState()` to restore the initial state. `setResetState(store, newBaseline)` changes what "reset" reverts to.

```ts
import { withReset, setResetState } from "@angular-architects/ngrx-toolkit";

const Store = signalStore(
  withState(initial),
  withReset(),
  withMethods(/* ... */),
);
// store.resetState();  setResetState(store, { ... });
```

## `withUndoRedo`

Adds `undo()`, `redo()`, and computed `canUndo`/`canRedo`. Configure history size and what to track.

```ts
import { withUndoRedo, clearUndoRedo } from "@angular-architects/ngrx-toolkit";

const Store = signalStore(
  withUndoRedo({
    maxStackSize: 100, // default 100
    collections: ["flight"], // entity collections to track
    keys: ["filter"], // non-entity keys to track
    skip: 0,
  }),
);
// clearUndoRedo(store) resets the history stack.
```

## `withImmutableState`

Drop-in replacement for `withState` that **throws on any mutation** (inside or outside the store, including via Angular APIs like `[(ngModel)]`). Active in dev mode only; enable in prod with `{ enableInProduction: true }`.

```ts
import { withImmutableState } from "@angular-architects/ngrx-toolkit";

const UserStore = signalStore(
  withImmutableState({ user: { id: 1, name: "Konrad" } }),
);
```

## `withConditional`

Activates one of two features based on a runtime condition. **Both features must expose exactly the same state, props, and methods** (type-enforced).

```ts
import { withConditional } from "@angular-architects/ngrx-toolkit";

signalStore(
  withMethods(() => ({ useRealUser: () => true })),
  withConditional((store) => store.useRealUser(), withUser, withFakeUser),
);
```

## `withDataService`

Builds a full CRUD store on top of `withEntities`. Provide a service implementing the `DataService<Entity, Filter>` interface (`load`, `loadById`, `create`, `update`, `delete`, …). Pairs with `withCallState` and `withUndoRedo`.

```ts
import { withDataService } from "@angular-architects/ngrx-toolkit";

export const FlightStore = signalStore(
  { providedIn: "root" },
  withCallState(),
  withEntities<Flight>(),
  withDataService({
    dataServiceType: FlightService,
    filter: { from: "Paris", to: "NYC" },
  }),
  withUndoRedo(),
);
// exposes: store.entities, store.filter, store.selectedEntities, store.loading,
//          store.load(), store.updateFilter(...), store.updateSelected(id, bool), ...
```

Pass a `collection` name to all three features to prefix members (`flightEntities`, `loadFlightEntities()`, `updateFlightFilter(...)`) and avoid naming clashes.

## `withResource` / `withEntityResources`

Integrate Angular's `resource`/`httpResource` (read operations) into the store. _Early access — likely to land in official NgRx once Angular's `Resource` stabilizes._

```ts
import { withResource } from "@angular-architects/ngrx-toolkit";
import { httpResource } from "@angular/core";

export const UserStore = signalStore(
  withState({ userId: 1 }),
  withResource((state) => httpResource(() => `/user/${state.userId}`)),
);
// store.value(), store.status(), store.error(), store.isLoading(), store.hasValue(), store._reload()
```

- **Named resources** (dictionary form) prefix members: `listValue()`, `detailIsLoading()`, … Use `mapToResource(store, 'name')` to get a typed `Resource<T>`.
- **`withEntityResources`** layers entity helpers (`ids`/`entityMap`/`entities`) over an **array** resource, writable via the standard entity updaters ([entity-management.md](entity-management.md)). Use `defaultValue: []`.
- **Error handling** (v20.6+): default `errorHandling: 'undefined value'` (value becomes `undefined` on error — so value signals are `T | undefined`); alternatives `'previous value'` and `'native'`.

## `withMutations`

The write-side counterpart to resources (POST/PUT/DELETE), inspired by TanStack Query mutations. Define mutations with `httpMutation` (HttpClient) or `rxMutation` (RxJS), optionally inside `withMutations`.

```ts
import {
  withMutations,
  httpMutation,
  rxMutation,
} from "@angular-architects/ngrx-toolkit";

export const CounterStore = signalStore(
  withState({ counter: 0 }),
  withMutations((store) => ({
    saveToServer: httpMutation({
      request: () => ({
        url: "/post",
        method: "POST",
        body: { counter: store.counter() },
      }),
      parse: (res) => res as CounterResponse,
      onSuccess: (res) => patchState(store, { lastResponse: res }),
      onError: (err) => console.error(err),
    }),
  })),
);
```

- Each mutation exposes `value`/`status`/`error`/`isPending`/`hasValue` signals and is callable (returns a `Promise`).
- Flattening operators: `concatOp` (default), `exhaustOp`, `mergeOp`, `switchOp`.
- `httpMutation` for plain HTTP; `rxMutation` when you need an RxJS `operation`. Both work standalone in a component/service too.

## Deprecated (prefer official NgRx)

- **`withRedux`** — Redux pattern (actions/reducer/effects) in the store. **Deprecated** in favor of the official Events plugin → [events.md](events.md).
- **`withFeatureFactory`** — pass store data into a feature. **Deprecated** in favor of `withFeature` from `@ngrx/signals` → [custom-features.md](custom-features.md).
