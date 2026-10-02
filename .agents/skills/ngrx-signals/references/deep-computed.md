# `deepComputed`

`deepComputed` (from `@ngrx/signals`) creates a `DeepSignal` when the computation returns an **object literal**. It works like a regular computed signal but additionally exposes a computed signal for each nested property (created lazily on access).

```ts
import { signal } from "@angular/core";
import { deepComputed } from "@ngrx/signals";

const limit = signal(25);
const offset = signal(0);
const totalItems = signal(100);

const pagination = deepComputed(() => ({
  currentPage: Math.floor(offset() / limit()) + 1,
  pageSize: limit(),
  totalPages: Math.ceil(totalItems() / limit()),
}));

pagination(); // { currentPage: 1, pageSize: 25, totalPages: 4 }
pagination.currentPage(); // 1
pagination.pageSize(); // 25
pagination.totalPages(); // 4
```

**When to use:** a derived object whose individual fields are consumed separately (e.g. binding `pagination.currentPage()` and `pagination.totalPages()` in different places). Components reading only one field then re-render only when that field changes, instead of on every change to the whole object.

For object **state** (not derived), `withState` already produces a `DeepSignal`. Use `deepComputed` specifically for derived/computed object values.
