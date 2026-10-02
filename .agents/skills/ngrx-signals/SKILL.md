---
name: ngrx-signals
description: Builds and reviews Angular state management with NgRx SignalStore (@ngrx/signals). Trigger when creating or editing a signalStore/signalState, using withState/withComputed/withMethods/withProps/withHooks/withEntities/withLinkedState, patchState, rxMethod/signalMethod, the Events plugin (event/withReducer/withEventHandlers/Dispatcher), entity collections, custom signalStoreFeature, deepComputed, state tracking, testing SignalStore, or @ngrx/operators (tapResponse/mapResponse/concatLatestFrom).
license: MIT
metadata:
  author: Distilled from ngrx.io (ngrx/platform docs)
  version: "1.0"
---

# NgRx SignalStore Developer Guidelines

`@ngrx/signals` is the modern, signals-native state management solution for Angular and the **default recommendation** for new state management in this skill. It is lightweight, tree-shakable, declarative, and strongly typed. The classic global `@ngrx/store` + `@ngrx/effects` (Redux) stack remains valid for very large apps that need a single global event log — but reach for SignalStore first.

1. **Check the installed version before generating code.** Inspect `package.json` for `@ngrx/signals`. Some features are version-gated: the Events plugin requires **v19.2+**; `withLinkedState` and `withFeature` are recent additions. If a feature is missing, fall back to the equivalent older pattern (e.g. `rxMethod`/`withMethods` instead of the Events plugin). When unsure of an API, verify against [ngrx.io/guide/signals](https://ngrx.io/guide/signals).

2. **`signalStore` composes features.** A store is `signalStore(...features)`. Each feature (`withState`, `withComputed`, `withMethods`, `withProps`, `withHooks`, `withEntities`, `withLinkedState`, and custom `signalStoreFeature`s) adds state, computed signals, properties, or methods. Order matters: a feature can only access members defined by features **before** it.

3. **State is immutable and updated only through `patchState`.** Never mutate state in place. By default state is **protected** from external modification (the recommended setting) — components update it by calling store methods, not by patching directly.

4. **Prefer `OnPush` change detection** and read state via the generated signals (`store.count()`, `store.filter.query()`). Provide the store at the right level: `{ providedIn: 'root' }` for shared/global state, or in a component/route `providers` array for local state tied to that lifecycle.

## Start here

- **Getting started** — install (`ng add @ngrx/signals`), the package's entry points, idiomatic conventions, and SignalStore vs. classic global Store. Read [getting-started.md](references/getting-started.md)

## Core: building a store

When defining or editing a SignalStore, consult these references:

- **SignalStore fundamentals** — `signalStore`, `withState`, `withComputed`, `withMethods`, `patchState`, providing/injecting, protected state. Read [signal-store.md](references/signal-store.md)
- **Lightweight local state** — `signalState` for small component/service state without a full store. Read [signal-state.md](references/signal-state.md)
- **Lifecycle hooks** — `withHooks` (`onInit`/`onDestroy`). Read [lifecycle-hooks.md](references/lifecycle-hooks.md)
- **Store properties & private members** — `withProps` (observables, grouped deps) and the `_` private-member convention. Read [store-props.md](references/store-props.md)
- **Linked state** — `withLinkedState` for writable state derived from other signals. Read [linked-state.md](references/linked-state.md)

## Async & side effects

- **RxJS integration (`rxMethod`)** — reactive methods driven by values, signals, or observables; the primary way to do API calls. Read [rxjs-integration.md](references/rxjs-integration.md)
- **`signalMethod`** — signal-driven side effects without RxJS (smaller bundle). Read [signal-method.md](references/signal-method.md)
- **`@ngrx/operators`** — `tapResponse`, `mapResponse`, `concatLatestFrom` for safe response handling inside `rxMethod`/effects. Read [operators.md](references/operators.md)

## Entities & composition

- **Entity management** — `withEntities`, entity updaters (`addEntity`, `updateEntity`, `setAllEntities`, …), named/private collections, `entityConfig`. Read [entity-management.md](references/entity-management.md)
- **Custom store features** — `signalStoreFeature` to extract reusable patterns (request status, logging, selected-entity), features with input, `withFeature`. Read [custom-features.md](references/custom-features.md)

## Advanced

- **Events plugin (Flux/Redux style)** — `event`/`eventGroup`, `withReducer` + `on`, `withEventHandlers`, `Dispatcher`/`injectDispatch`, scoped events. For inter-store coordination and decoupled architectures (v19.2+). Read [events.md](references/events.md)
- **`deepComputed`** — computed signals with per-property nested signals. Read [deep-computed.md](references/deep-computed.md)
- **State tracking** — `getState`, `watchState` for logging, undo/redo, persistence. Read [state-tracking.md](references/state-tracking.md)

## Testing

- **Testing SignalStore** — `TestBed`, public-API assertions, the `unprotected` helper, mocking deps, testing `rxMethod`/`signalMethod` and custom features. Read [testing.md](references/testing.md)

## Ecosystem: NgRx Toolkit extensions

`@angular-architects/ngrx-toolkit` is a **community** package of extra SignalStore features. When the project depends on it (or the user asks for DevTools, storage persistence, undo/redo, CRUD data services, Angular `Resource`/mutations integration, etc.), consult:

- **Toolkit extensions** — `withDevtools`, `withStorageSync`, `withCallState`, `withReset`, `withUndoRedo`, `withImmutableState`, `withConditional`, `withDataService`, `withResource`/`withEntityResources`, `withMutations`, and the deprecated `withRedux`/`withFeatureFactory`. Read [toolkit-extensions.md](references/toolkit-extensions.md)

Prefer official `@ngrx/signals` APIs when they overlap: use the Events plugin instead of `withRedux`, and `withFeature` instead of `withFeatureFactory`.

---

If a topic isn't covered here or you need deeper detail, consult the official docs at [ngrx.io/guide/signals](https://ngrx.io/guide/signals).
