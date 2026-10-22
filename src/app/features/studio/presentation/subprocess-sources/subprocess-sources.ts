import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { STUDIO_API } from '../../bindings';
import { StudioChoice } from '../studio-choice/studio-choice';
@Component({
  selector: 'app-subprocess-sources',
  imports: [ButtonDirective, LocalizePipe, StudioChoice],
  templateUrl: './subprocess-sources.html',
  styles:
    ':host { display:grid; gap:.75rem; min-inline-size:0; } .paging { display:flex; flex-wrap:wrap; gap:.5rem; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubprocessSources {
  readonly version = input.required<string>();
  readonly step = input.required<string>();
  readonly disabled = input(false);
  readonly loaded = output<readonly JsonObject[]>();
  readonly request = signal('');
  readonly busy = signal(false);
  readonly page = signal(1);
  readonly pages = signal(0);
  readonly error = signal('');
  private readonly api = inject(STUDIO_API);
  private generation = 0;
  constructor() {
    effect(() => {
      this.version();
      this.step();
      this.reset();
    });
    effect(() => {
      if (this.disabled()) {
        this.generation++;
        this.busy.set(false);
      }
    });
    const release = inject(ActorState).register(() => this.reset());
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
  }
  reset(): void {
    this.generation++;
    this.request.set('');
    this.busy.set(false);
    this.error.set('');
    this.page.set(1);
    this.pages.set(0);
    this.loaded.emit([]);
  }
  setRequest(value: string): void {
    if (this.disabled()) {
      return;
    }
    this.reset();
    this.request.set(value);
  }
  async load(page = 1): Promise<void> {
    if (this.disabled() || this.busy() || !this.request() || !this.version()) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    this.loaded.emit([]);
    try {
      const result = (await this.api.auxiliary('completion', {
        workflow_version_ref_id: this.version(),
        request_type_ref_id: this.request(),
        current_step_key: this.step(),
        page,
        size: 100,
      })) as { items: JsonObject[]; totalPages: number };
      if (generation !== this.generation || this.disabled()) {
        return;
      }
      this.loaded.emit(result.items);
      this.page.set(page);
      this.pages.set(result.totalPages);
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
}
