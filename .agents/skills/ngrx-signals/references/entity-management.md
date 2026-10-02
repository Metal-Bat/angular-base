# Entity Management (`withEntities`)

The `@ngrx/signals/entities` plugin manages normalized entity collections in a SignalStore. Add `withEntities`, then mutate the collection with standalone **entity updaters** passed to `patchState`.

> Import: `import { withEntities, addEntity, ... } from '@ngrx/signals/entities';`

## `withEntities`

By default an entity needs an `id` of type `EntityId` (`string | number`).

```ts
import { signalStore } from "@ngrx/signals";
import { withEntities } from "@ngrx/signals/entities";

type Todo = { id: number; text: string; completed: boolean };

export const TodosStore = signalStore(withEntities<Todo>());
```

Adds:

- `ids: Signal<EntityId[]>` — state slice
- `entityMap: Signal<EntityMap<Todo>>` — state slice (keyed by id)
- `entities: Signal<Todo[]>` — **computed** array of all entities

## Entity updaters

Standalone functions used inside `patchState`. None throw on missing/duplicate ids.

```ts
import { patchState } from "@ngrx/signals";
import { addEntity, removeEntities, updateAllEntities } from "@ngrx/signals/entities";

addTodo:   (todo) => patchState(store, addEntity(todo)),
clearDone: ()     => patchState(store, removeEntities(({ completed }) => completed)),
completeAll: ()   => patchState(store, updateAllEntities({ completed: true })),
```

| Updater                                                 | Effect                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| `addEntity(e)` / `addEntities([...])`                   | Add; ignored if id exists                                            |
| `prependEntity(e)` / `prependEntities([...])`           | Add at start; ignored if id exists                                   |
| `setEntity(e)` / `setEntities([...])`                   | Add or **replace** by id                                             |
| `setAllEntities([...])`                                 | Replace the whole collection                                         |
| `upsertEntity(e)` / `upsertEntities([...])`             | Add, or **merge** provided props into existing                       |
| `updateEntity({ id, changes })`                         | Partial update by id; `changes` can be a partial or `(e) => partial` |
| `updateEntities({ ids \| predicate, changes })`         | Update many by ids or predicate                                      |
| `updateAllEntities(changes)`                            | Update every entity                                                  |
| `removeEntity(id)` / `removeEntities(ids \| predicate)` | Remove by id(s)/predicate                                            |
| `removeAllEntities()`                                   | Empty the collection                                                 |

```ts
patchState(store, updateEntity({ id: 1, changes: { completed: true } }));
patchState(
  store,
  updateEntity({ id: 1, changes: (t) => ({ completed: !t.completed }) }),
);
patchState(
  store,
  updateEntities({ predicate: ({ text }) => !text, changes: { text: "—" } }),
);
patchState(
  store,
  removeEntities((t) => t.completed),
);
```

## Custom id selector

If the id field isn't `id`, pass a `selectId` to `add*`/`set*`/`update*` updaters (the `remove*` updaters infer the id automatically).

```ts
import { SelectEntityId, addEntities, setEntity } from "@ngrx/signals/entities";

type Todo = { key: number; text: string; completed: boolean };
const selectId: SelectEntityId<Todo> = (todo) => todo.key;

patchState(store, addEntities(todos, { selectId }));
patchState(store, setEntity(todo, { selectId }));
```

## Named collections

Pass a `collection` name to prefix the generated members and manage multiple collections in one store. Updaters then require `{ collection }`.

```ts
import { signalStore, type } from "@ngrx/signals";
import { withEntities, addEntity } from "@ngrx/signals/entities";

export const TodosStore = signalStore(
  withEntities({ entity: type<Todo>(), collection: "todo" }), // → todoIds, todoEntityMap, todoEntities
  withMethods((store) => ({
    addTodo: (todo: Todo) =>
      patchState(store, addEntity(todo, { collection: "todo" })),
  })),
);
```

> You _can_ hold multiple named collections in one store, but **prefer a dedicated store per entity type** in most cases.

## `entityConfig` — DRY config

Bundle `entity` + optional `collection` + `selectId` once and reuse it for both `withEntities` and updaters:

```ts
import {
  entityConfig,
  withEntities,
  addEntity,
  removeEntity,
} from "@ngrx/signals/entities";

const todoConfig = entityConfig({
  entity: type<Todo>(),
  collection: "todo",
  selectId: (todo) => todo.key,
});

export const TodosStore = signalStore(
  withEntities(todoConfig),
  withMethods((store) => ({
    addTodo: (todo: Todo) => patchState(store, addEntity(todo, todoConfig)),
    removeTodo: (todo: Todo) =>
      patchState(store, removeEntity(todo, todoConfig)),
  })),
);
```

## Private collections

Prefix the collection name with `_` to keep it internal, then expose a curated public signal (see [store-props.md](store-props.md)):

```ts
const todoConfig = entityConfig({ entity: type<Todo>(), collection: "_todo" });

const TodosStore = signalStore(
  withEntities(todoConfig),
  withComputed(({ _todoEntities }) => ({ todos: _todoEntities })), // expose publicly
);
```

Combine with a reusable `withSelectedEntity()` feature — see [custom-features.md](custom-features.md).
