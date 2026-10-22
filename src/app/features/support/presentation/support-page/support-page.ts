import { LocalizedDateTimePipe } from '../../../../shared/ui/localized-datetime-pipe';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Incident, IncidentHistory } from '../../application/support-port';
import { SUPPORT } from '../../bindings';
@Component({
  selector: 'app-support-page',
  imports: [LocalizedDateTimePipe, ButtonDirective, TableModule, LocalizePipe],
  templateUrl: './support-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportPage {
  readonly rows = signal<Incident[]>([]);
  readonly selected = signal<Incident | null>(null);
  readonly history = signal<IncidentHistory[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly page = signal(1);
  readonly pages = signal(0);
  private readonly api = inject(SUPPORT);
  private readonly feedback = inject(Feedback);
  private generation = 0;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.rows.set([]);
      this.selected.set(null);
      this.history.set([]);
      this.busy.set(false);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
    const ref = inject(ActivatedRoute).snapshot.queryParamMap.get('incident');
    if (ref) {
      void this.open(ref);
    } else {
      void this.load();
    }
  }
  async load(page = 1): Promise<void> {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.api.search(page);
      if (generation !== this.generation) {
        return;
      }
      this.rows.set([...result.items]);
      this.page.set(result.page);
      this.pages.set(result.totalPages);
    } catch {
      if (generation === this.generation) {
        this.error.set('This resource is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async open(ref: string): Promise<void> {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    this.selected.set(null);
    this.history.set([]);
    try {
      const value = await this.api.detail(ref);
      if (generation !== this.generation) {
        return;
      }
      const history = await this.api.history(value.ref_id);
      if (generation !== this.generation) {
        return;
      }
      this.selected.set(value);
      this.history.set([...history]);
    } catch {
      if (generation === this.generation) {
        this.error.set('This resource is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  private async refreshHistory(ref: string, generation: number): Promise<void> {
    try {
      const history = await this.api.history(ref);
      if (generation === this.generation) {
        this.history.set([...history]);
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('History is unavailable. Reload current state.');
      }
    }
  }
  async act(resolve: boolean): Promise<void> {
    const value = this.selected();
    const generation = this.generation;
    if (
      !value ||
      this.busy() ||
      !(await this.feedback.confirm(
        resolve
          ? 'Resolve this support incident?'
          : 'Acknowledge this support incident?',
      )) ||
      generation !== this.generation
    ) {
      return;
    }
    this.busy.set(true);
    try {
      const result = await this.api.act(value.ref_id, resolve);
      if (generation === this.generation) {
        this.selected.set(result);
        this.rows.update((rows) =>
          rows.map((row) => (row.ref_id === value.ref_id ? result : row)),
        );
        await this.refreshHistory(result.ref_id, generation);
      }
    } catch {
      if (generation === this.generation) {
        this.error.set(
          'The command could not be confirmed. Refresh current state before retrying.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
