# `signalMethod`

`signalMethod` (from `@ngrx/signals`) manages side effects driven by **Angular signals, without RxJS**. It takes a processor callback and returns a function callable with a **static value, a signal, or a computation function**. It's a lighter alternative to `rxMethod` when you don't need RxJS operators.

```ts
import { signalMethod } from "@ngrx/signals";

readonly logDoubled = signalMethod<number>((num) => {
  console.log(num * 2);
});

// usage
this.logDoubled(1);                // → 2 (runs once)
this.logDoubled(signal(2));        // → 4, re-runs when the signal changes
this.logDoubled(() => a() + b());  // computation over multiple signals
```

## Why not just `effect`?

`signalMethod` has three advantages over a raw `effect`:

- **Flexible input** — accepts a static value (not only a signal), and can be called repeatedly with different inputs.
- **No injection context required to call** — the processor can run outside an injection context (the `effect` is created at definition time).
- **Explicit tracking** — only the signal(s) you pass (or read in the computation function) are tracked; signals read _inside the processor body_ stay untracked.

## Cleanup

`signalMethod` uses an internal `effect`. It must be **created in an injection context** (or pass `{ injector }`).

- When **called within an injection context**, cleanup follows that context.
- When created in a component and called in `ngOnInit`, it still cleans up with the component (it was created in the component's context).
- **Gotcha:** if the `signalMethod` is created in an **ancestor** (e.g. a `providedIn: 'root'` service) and called from a component with a signal, the internal effect outlives the component → memory leak. Pass the caller's injector explicitly:

```ts
ngOnInit(): void {
  const value = signal(1);
  this.numbersService.logDoubled(value, { injector: this.injector }); // 👈 cleanup on component destroy
  this.numbersService.logDoubled(2); // static value needs no injector
}
```

> Calling with a signal/computation outside an injection context without an explicit injector is **deprecated** (will throw in future).

## In a SignalStore

```ts
export const CounterStore = signalStore(
  { providedIn: "root" },
  withState({ count: 0 }),
  withMethods((store) => ({
    increment: signalMethod<number>((step) => {
      patchState(store, ({ count }) => ({ count: count + step }));
    }),
  })),
);
```

## `signalMethod` vs `rxMethod`

`signalMethod` is essentially `rxMethod` without RxJS — smaller bundle, no observable inputs. **Use `rxMethod`** ([rxjs-integration.md](rxjs-integration.md)) when you need operators like `switchMap`/`debounceTime`/`concatMap`, observable inputs, or robust race-condition handling. Signals are glitch-free (only the last of multiple synchronous changes propagates) and lack flattening operators.
