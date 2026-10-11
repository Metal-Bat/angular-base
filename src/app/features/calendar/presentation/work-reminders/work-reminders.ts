import {
  ApiFailure,
  knownRejection,
} from '../../../../core/transport/api-failure';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { CalendarItem, Reminder } from '../../application/calendar-port';
import { CALENDAR } from '../../bindings';
@Component({
  selector: 'app-work-reminders',
  imports: [
    FormsModule,
    RouterLink,
    ButtonDirective,
    SelectControl,
    LocalizePipe,
  ],
  templateUrl: './work-reminders.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkReminders {
  readonly item = input.required<CalendarItem>();
  readonly work = signal<{ ref_id: string; due_at: string | null } | null>(
    null,
  );
  readonly rows = signal<Reminder[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  offsets = ['900'];
  private readonly api = inject(CALENDAR);
  private readonly feedback = inject(Feedback);
  private generation = 0;
  private originalOffsets = JSON.stringify(this.offsets);
  dirty(): boolean {
    return (
      !!this.pending || JSON.stringify(this.offsets) !== this.originalOffsets
    );
  }
  readonly uncertain = signal(false);
  readonly reconcileRequired = signal(false);
  private pending: {
    ref: string;
    body: { offsets: number[]; command_key: string };
  } | null = null;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.work.set(null);
      this.rows.set([]);
      this.busy.set(false);
      this.error.set('');
      this.pending = null;
      this.uncertain.set(false);
      this.reconcileRequired.set(false);
      this.offsets = [];
      this.originalOffsets = JSON.stringify(this.offsets);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
    effect(() => {
      this.item();
      untracked(() => void this.load());
    });
  }
  async load(): Promise<void> {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const work = await this.api.work(this.item().ref_id);
      if (generation !== this.generation) {
        return;
      }
      const rows = await this.api.reminders({
        ...this.item(),
        ref_id: work.ref_id,
      });
      if (generation !== this.generation) {
        return;
      }
      this.work.set(work);
      this.rows.set(rows);
      this.pending = null;
      this.uncertain.set(false);
      this.reconcileRequired.set(false);
    } catch {
      if (generation === this.generation) {
        this.work.set(null);
        this.error.set('This resource is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async save(): Promise<void> {
    const work = this.work();
    if (
      this.busy() ||
      this.reconcileRequired() ||
      !work?.due_at ||
      (!this.pending && !this.offsets.length)
    ) {
      return;
    }
    const generation = this.generation;
    this.pending ??= {
      ref: work.ref_id,
      body: {
        offsets: this.offsets.map(Number),
        command_key: crypto.randomUUID(),
      },
    };
    this.uncertain.set(true);
    this.busy.set(true);
    this.error.set('');
    try {
      const rows = await this.api.configure(
        this.pending.ref,
        this.pending.body,
      );
      if (generation === this.generation) {
        this.rows.set(rows);
        this.offsets = this.pending.body.offsets.map(String);
        this.pending = null;
        this.uncertain.set(false);
        this.originalOffsets = JSON.stringify(this.offsets);
      }
    } catch (error) {
      if (generation === this.generation) {
        this.reconcileRequired.set(
          error instanceof ApiFailure && error.httpStatus === 409,
        );
        if (knownRejection(error)) {
          this.pending = null;
          this.uncertain.set(false);
        }
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
  async cancel(): Promise<void> {
    const work = this.work();
    const generation = this.generation;
    if (
      !work ||
      this.busy() ||
      this.uncertain() ||
      this.reconcileRequired() ||
      !(await this.feedback.confirm('Cancel these reminders?')) ||
      generation !== this.generation
    ) {
      return;
    }
    this.busy.set(true);
    try {
      await this.api.cancel(work.ref_id);
      if (generation === this.generation) {
        await this.load();
      }
    } catch {
      if (generation === this.generation) {
        this.reconcileRequired.set(true);
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
