import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { STUDIO_API } from '../../bindings';
import { candidateKey, removeCandidate } from '../../domain/graph-controls';
@Component({
  selector: 'app-candidate-targets',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './candidate-targets.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateTargets {
  readonly graph = input.required<JsonObject>();
  readonly selected = input.required<string>();
  readonly disabled = input(false);
  readonly applied = output<JsonObject>();
  readonly rows = computed(() =>
    ((this.graph()['targets'] ?? []) as JsonObject[])
      .filter((row) => row['step'] === this.selected())
      .map((row) => ({ row, id: candidateKey(row) })),
  );
  readonly labels = signal<Readonly<Record<string, string>>>({});
  readonly error = signal('');
  readonly busy = signal(false);
  readonly String = String;
  private readonly api = inject(STUDIO_API);
  private generation = 0;
  private abort = new AbortController();
  constructor() {
    const locale = inject(Locale);
    effect(() => {
      locale.language();
      void this.restore(this.rows());
    });
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
  }
  private clear(): void {
    this.generation++;
    this.abort.abort();
    this.labels.set({});
    this.error.set('');
    this.busy.set(false);
  }
  private async restore(rows: readonly { row: JsonObject }[]): Promise<void> {
    this.clear();
    this.abort = new AbortController();
    const generation = this.generation;
    const resources = rows.flatMap(({ row }) =>
      ['user_ref', 'work_group_ref'].flatMap((key) =>
        typeof row[key] === 'string' && row[key]
          ? [
              {
                kind: key === 'user_ref' ? 'users' : 'work_groups',
                ref_id: row[key],
              },
            ]
          : [],
      ),
    );
    if (!resources.length) {
      return;
    }
    this.busy.set(true);
    try {
      const labels: Record<string, string> = {};
      for (let offset = 0; offset < resources.length; offset += 50) {
        const response = await this.api.auxiliary(
          'selected',
          { resources: resources.slice(offset, offset + 50) },
          undefined,
          this.abort.signal,
        );
        if (generation !== this.generation) {
          return;
        }
        if (!Array.isArray(response)) {
          throw Error('Invalid selection');
        }
        for (const entry of response as JsonObject[]) {
          if (
            entry['available'] === true &&
            typeof entry['label'] === 'string' &&
            resources.some(
              (resource) =>
                resource.kind === entry['kind'] &&
                resource.ref_id === entry['ref_id'],
            )
          ) {
            labels[String(entry['kind']) + ':' + entry['ref_id']] =
              entry['label'];
          }
        }
      }
      this.labels.set(labels);
    } catch {
      if (generation === this.generation) {
        this.error.set('Reference search failed. Retry or reload.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  label(row: JsonObject, key: string): string {
    return (
      this.labels()[
        (key === 'user_ref' ? 'users' : 'work_groups') + ':' + row[key]
      ] ?? 'The selected resource is unavailable. Choose again.'
    );
  }
  remove(id: string): void {
    if (this.disabled()) {
      return;
    }
    try {
      this.applied.emit(removeCandidate(this.graph(), this.selected(), id));
    } catch {
      this.error.set('The selected resource is unavailable. Choose again.');
    }
  }
}
