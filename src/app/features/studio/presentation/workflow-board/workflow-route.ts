import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
/** React only after router guards accept a different workflow version. */
export function watchWorkflowRoute(changed: (reference: string) => void): void {
  const route = inject(ActivatedRoute);
  let previous = route.snapshot.paramMap.get('ref') ?? '';
  route.paramMap
    .pipe(
      map((params) => params.get('ref') ?? ''),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    )
    .subscribe((reference) => {
      if (!reference || reference === previous) {
        return;
      }
      previous = reference;
      changed(reference);
    });
}
