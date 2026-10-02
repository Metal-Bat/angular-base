# Linked State (`withLinkedState`)

`withLinkedState` creates **writable** state slices that derive from other signals. The factory runs in the injection context and returns a dictionary of either computation functions or `WritableSignal` instances. Each linked slice becomes a real part of the store's state — `DeepSignal`s are created and it can be updated via `patchState` — but it also auto-recomputes when its sources change.

Use this when a slice should normally track a source (e.g. "selected item" defaults from a list) yet still be independently settable by the user.

> Recent feature — verify it exists in the installed `@ngrx/signals` version. It builds on Angular's `linkedSignal()`.

## Implicit linking (computation function)

A computation function is wrapped in `linkedSignal()`. The slice updates automatically when dependencies change, but can also be overwritten with `patchState`.

```ts
import {
  patchState,
  signalStore,
  withLinkedState,
  withMethods,
  withState,
} from "@ngrx/signals";

export const OptionsStore = signalStore(
  withState({ options: [1, 2, 3] }),
  withLinkedState(({ options }) => ({
    selectedOption: () => options()[0] ?? undefined,
  })),
  withMethods((store) => ({
    setOptions: (options: number[]) => patchState(store, { options }),
    setSelectedOption: (selectedOption: number) =>
      patchState(store, { selectedOption }),
  })),
);

// selectedOption starts as 1; setSelectedOption(2) → 2;
// setOptions([4,5,6]) recomputes selectedOption → 4
```

## Explicit linking (`WritableSignal`)

Provide a `linkedSignal({ source, computation })` (or any `WritableSignal`) for full control. The store slice and the signal stay synchronized — updating either reflects in the other.

```ts
import { linkedSignal } from "@angular/core";
import { signalStore, withLinkedState, withState } from "@ngrx/signals";

export const OptionsStore = signalStore(
  withState({ options: [] as Option[] }),
  withLinkedState(({ options }) => ({
    selectedOption: linkedSignal<Option[], Option>({
      source: options,
      computation: (newOptions, previous) =>
        newOptions.find((o) => o.id === previous?.value.id) ?? newOptions[0],
    }),
  })),
);
```

**When to use which:**

- Implicit (function) — simple "default from source, overridable" slices.
- Explicit (`linkedSignal` with `computation`) — when you need the previous value to decide the new one (e.g. preserve selection by id across source changes).
