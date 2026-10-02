# Getting Started with `@ngrx/signals`

`@ngrx/signals` is a standalone, signals-native reactive state management library for Angular. It's lightweight, tree-shakable, declarative, and strongly typed.

## Install

```sh
ng add @ngrx/signals@latest
```

Companion packages (install as needed):

```sh
ng add @ngrx/operators@latest   # tapResponse / mapResponse / concatLatestFrom
```

Sub-path entry points (no extra install — they ship with `@ngrx/signals`):

- `@ngrx/signals` — `signalStore`, `signalState`, `patchState`, `withState`, `withComputed`, `withMethods`, `withProps`, `withHooks`, `withLinkedState`, `signalMethod`, `deepComputed`, `getState`, `watchState`, `signalStoreFeature`, `type`, …
- `@ngrx/signals/rxjs-interop` — `rxMethod`
- `@ngrx/signals/entities` — `withEntities` + entity updaters
- `@ngrx/signals/events` — Events plugin (v19.2+)
- `@ngrx/signals/testing` — `unprotected`

## What's in the box

| Need                                    | Tool                       | Reference                                                                |
| --------------------------------------- | -------------------------- | ------------------------------------------------------------------------ |
| Full state management service           | `signalStore` + features   | [signal-store.md](signal-store.md)                                       |
| Small local state                       | `signalState`              | [signal-state.md](signal-state.md)                                       |
| Async / API calls (RxJS)                | `rxMethod` + `tapResponse` | [rxjs-integration.md](rxjs-integration.md), [operators.md](operators.md) |
| Signal-driven effects (no RxJS)         | `signalMethod`             | [signal-method.md](signal-method.md)                                     |
| Normalized collections                  | `withEntities`             | [entity-management.md](entity-management.md)                             |
| Reusable building blocks                | `signalStoreFeature`       | [custom-features.md](custom-features.md)                                 |
| Flux/Redux-style flow                   | Events plugin              | [events.md](events.md)                                                   |
| DevTools / storage sync / data services | ngrx-toolkit extensions    | [toolkit-extensions.md](toolkit-extensions.md)                           |

## SignalStore vs. classic global Store

**Default to SignalStore.** It covers global state (`{ providedIn: 'root' }`) and local component state (component `providers`) with far less boilerplate than the classic Redux stack.

Consider classic `@ngrx/store` + `@ngrx/effects` only when you specifically want a single global action log/time-travel across the whole app with the full Redux ceremony, or you're maintaining an existing Store-based codebase. Even then, SignalStore's **Events plugin** ([events.md](events.md)) provides a Flux/Redux-style flow within the signals world.

## Idiomatic conventions

- Use `ChangeDetectionStrategy.OnPush` and read state via generated signals (`store.x()`).
- Keep state **immutable**; update only through `patchState`.
- Leave state **protected** (the default); expose intent through store methods.
- Provide globally (`{ providedIn: 'root' }`) for shared state, locally for component-scoped state.
- Always verify the installed `@ngrx/signals` version for version-gated features (Events plugin, `withLinkedState`, `withFeature`).
