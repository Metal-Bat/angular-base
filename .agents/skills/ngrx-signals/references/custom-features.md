# Custom Store Features (`signalStoreFeature`)

`signalStoreFeature(...features)` merges a sequence of features into one reusable feature. Use it to extract recurring patterns (request status, logging, pagination, selected-entity) and share them across stores. This is the primary mechanism for keeping SignalStores DRY.

## Basic reusable feature

```ts
import { computed } from "@angular/core";
import { signalStoreFeature, withComputed, withState } from "@ngrx/signals";

export type RequestStatus =
  | "idle"
  | "pending"
  | "fulfilled"
  | { error: string };
export type RequestStatusState = { requestStatus: RequestStatus };

export function withRequestStatus() {
  return signalStoreFeature(
    withState<RequestStatusState>({ requestStatus: "idle" }),
    withComputed(({ requestStatus }) => ({
      isPending: computed(() => requestStatus() === "pending"),
      isFulfilled: computed(() => requestStatus() === "fulfilled"),
      error: computed(() => {
        const s = requestStatus();
        return typeof s === "object" ? s.error : null;
      }),
    })),
  );
}

// 👇 Prefer standalone updaters over feature methods: tree-shakable, testable,
//    and composable in a single patchState call.
export const setPending = (): RequestStatusState => ({
  requestStatus: "pending",
});
export const setFulfilled = (): RequestStatusState => ({
  requestStatus: "fulfilled",
});
export const setError = (error: string): RequestStatusState => ({
  requestStatus: { error },
});
```

Use it like any other feature:

```ts
export const BooksStore = signalStore(
  withEntities<Book>(),
  withRequestStatus(),
  withMethods((store, booksService = inject(BooksService)) => ({
    async loadAll() {
      patchState(store, setPending());
      const books = await booksService.getAll();
      patchState(store, setAllEntities(books), setFulfilled());
    },
  })),
);
```

**CRITICAL RULE:** define a custom feature's state updaters as **standalone functions**, not as methods on the feature. This enables tree-shaking, simplifies testing, and lets them be combined with other updaters in one `patchState(...)` call.

## Hook-based feature (e.g. logging)

```ts
import { effect } from "@angular/core";
import { getState, signalStoreFeature, withHooks } from "@ngrx/signals";

export function withLogger(name: string) {
  return signalStoreFeature(
    withHooks({
      onInit(store) {
        effect(() => console.log(`${name} state changed`, getState(store)));
      },
    }),
  );
}
```

## Features that require input

A feature can declare state/props/methods it **expects the host store to already provide**, using `type<...>()` as the first argument. The compiler enforces the contract.

```ts
import {
  signalStoreFeature,
  type,
  withComputed,
  withState,
} from "@ngrx/signals";
import { EntityId, EntityState } from "@ngrx/signals/entities";

export type SelectedEntityState = { selectedEntityId: EntityId | null };

export function withSelectedEntity<Entity>() {
  return signalStoreFeature(
    { state: type<EntityState<Entity>>() }, // 👈 requires withEntities upstream
    withState<SelectedEntityState>({ selectedEntityId: null }),
    withComputed(({ entityMap, selectedEntityId }) => ({
      selectedEntity: computed(() => {
        const id = selectedEntityId();
        return id ? entityMap()[id] : null;
      }),
    })),
  );
}

export const BooksStore = signalStore(
  withEntities<Book>(),
  withSelectedEntity(),
);
```

You can also require `props` and `methods`:

```ts
signalStoreFeature(
  {
    props: type<{ foo: Signal<Foo> }>(),
    methods: type<{ bar(foo: number): void }>(),
  },
  withMethods((store) => ({
    /* can use store.foo() and store.bar() */
  })),
);
```

> Prefer **loosely-coupled** features (no required input) whenever possible.

## `withFeature` — pass store data into a feature

When a feature needs a value from the host store (not just a type contract), `withFeature` gives a callback that receives the store instance and returns a feature.

```ts
export function withBooksFilter(books: Signal<Book[]>) {
  return signalStoreFeature(
    withState({ query: "" }),
    withComputed(({ query }) => ({
      filteredBooks: computed(() =>
        books().filter((b) => b.name.includes(query())),
      ),
    })),
    withMethods((store) => ({
      setQuery: (query: string) => patchState(store, { query }),
    })),
  );
}

export const BooksStore = signalStore(
  withEntities<Book>(),
  withFeature(({ entities }) => withBooksFilter(entities)), // 👈 inject store data
);
```

## Known TypeScript gotcha

Combining multiple input-requiring features that have **no generic parameter** can cause spurious compile errors. Fix by adding an unused generic:

```ts
function withZ<_>() {
  return signalStoreFeature(
    { state: type<{ x: number }>() },
    withState({ z: 10 }),
  );
}
function withW<_>() {
  return signalStoreFeature(
    { state: type<{ y: number }>() },
    withState({ w: 100 }),
  );
}
```
