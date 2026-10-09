import { DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { ActorState } from '../../core/auth/actor-state';
export type ReferenceLabels = Record<string, { key: string; label: string }>;
export function actorReferenceLabels(): WritableSignal<ReferenceLabels> {
  const labels = signal<ReferenceLabels>({});
  const release = inject(ActorState).register(() => labels.set({}));
  inject(DestroyRef).onDestroy(release);
  return labels;
}
export function rememberReference(
  labels: WritableSignal<ReferenceLabels>,
  path: string,
  key: string,
  label: string,
): void {
  labels.update((previous) => ({ ...previous, [path]: { key, label } }));
}
