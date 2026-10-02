# SignalState (lightweight local state)

`signalState` is a minimal utility for managing signal-based state directly in a component, service, or standalone function — without the full `signalStore` machinery. Reach for it when state is small and local; reach for `signalStore` ([signal-store.md](signal-store.md)) when you need computed signals, methods, entities, or DI-injected dependencies as a cohesive unit.

## Creating state

`signalState(initialState)` — the initial state **must be a record/object literal**. It returns a read-only signal that also exposes a signal per property (nested objects become `DeepSignal`s, generated lazily).

```ts
import { signalState } from "@ngrx/signals";

type UserState = {
  user: { firstName: string; lastName: string };
  isAdmin: boolean;
};

const state = signalState<UserState>({
  user: { firstName: "Eric", lastName: "Clapton" },
  isAdmin: false,
});

state(); // whole state
state.isAdmin(); // Signal<boolean>
state.user(); // DeepSignal<{...}>
state.user.firstName(); // Signal<string>
```

It behaves like any read-only signal, so it works with `computed` and `effect`.

## Updating with `patchState`

Same `patchState` used by SignalStore: pass partial states and/or updater functions. **Updates must be immutable.**

```ts
import { patchState } from "@ngrx/signals";

patchState(state, { isAdmin: true });
patchState(state, (s) => ({ user: { ...s.user, firstName: "Jimi" } }));
patchState(state, { isAdmin: false }, (s) => ({
  user: { ...s.user, lastName: "Hendrix" },
}));
```

### Reusable custom updaters

Extract updaters as functions returning `PartialStateUpdater<T>` — easy to test and reuse, and composable in one `patchState` call.

```ts
import { PartialStateUpdater } from "@ngrx/signals";

function setFirstName(firstName: string): PartialStateUpdater<{ user: User }> {
  return (state) => ({ user: { ...state.user, firstName } });
}
const setAdmin = () => ({ isAdmin: true });

patchState(state, setFirstName("Stevie"), setAdmin());
```

## Usage in a component

```ts
@Component({
  selector: "ngrx-counter",
  template: `
    <p>Count: {{ state.count() }}</p>
    <button (click)="increment()">Increment</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Counter {
  readonly state = signalState({ count: 0 });

  increment(): void {
    patchState(this.state, (s) => ({ count: s.count + 1 }));
  }
}
```

## Usage in a service (with async)

`signalState` pairs with `rxMethod` ([rxjs-integration.md](rxjs-integration.md)) and `tapResponse` ([operators.md](operators.md)) for async work, using `#`-private fields to keep the state internal and exposing only the slices you need.

```ts
@Injectable()
export class BookListStore {
  readonly #booksService = inject(BooksService);
  readonly #state = signalState({ books: [] as Book[], isLoading: false });

  readonly books = this.#state.books;
  readonly isLoading = this.#state.isLoading;

  readonly loadBooks = rxMethod<void>(
    pipe(
      tap(() => patchState(this.#state, { isLoading: true })),
      exhaustMap(() =>
        this.#booksService.getAll().pipe(
          tapResponse({
            next: (books) => patchState(this.#state, { books }),
            error: console.error,
            finalize: () => patchState(this.#state, { isLoading: false }),
          }),
        ),
      ),
    ),
  );
}
```
