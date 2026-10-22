import {
  constrainPopover,
  restorePopoverFocus,
} from '../../../../shared/ui/anchored-popover';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { CalendarItem } from '../../application/calendar-port';
import { CalendarEvent } from '../../domain/calendar-events';
import { shiftDate } from '../../domain/calendar-dates';
import { CalendarActivation } from '../calendar-activation';

@Component({
  selector: 'app-calendar-event-details',
  imports: [RouterLink, ButtonDirective, PopoverModule, LocalizePipe],
  templateUrl: './calendar-event-details.html',
  styleUrl: './calendar-event-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEventDetails {
  readonly busy = input(false);
  readonly editRequested = output<CalendarEvent>();
  readonly removeRequested = output<CalendarEvent>();
  readonly detail = signal<{
    event: CalendarEvent;
    item: CalendarItem;
    zone: string;
  } | null>(null);
  private readonly popup = viewChild(Popover);
  private readonly locale = inject(Locale);
  private trigger: HTMLElement | null = null;
  private pendingEdit: CalendarEvent | null = null;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.close();
      this.detail.set(null);
      this.trigger = null;
    });
    inject(DestroyRef).onDestroy(() => {
      this.pendingEdit = null;
      release();
    });
  }
  show(activation: CalendarActivation, item: CalendarItem, zone: string): void {
    this.pendingEdit = null;
    this.trigger = activation.trigger;
    this.detail.set({ event: activation.event, item, zone });
    this.popup()?.show(new Event('click'), activation.trigger);
  }
  shown(): void {
    constrainPopover(this.popup());
  }
  close(): void {
    this.pendingEdit = null;
    this.popup()?.hide();
  }
  hidden(): void {
    const event = this.pendingEdit;
    this.pendingEdit = null;
    restorePopoverFocus(this.popup(), this.trigger);
    if (event && !this.busy()) {
      this.editRequested.emit(event);
    }
  }
  edit(): void {
    const current = this.detail();
    if (
      !this.busy() &&
      current &&
      (current.item.source_kind === 'work_item' || current.item.editable)
    ) {
      this.pendingEdit = current.event;
      this.trigger?.focus({ preventScroll: true });
      this.popup()?.hide();
    }
  }
  remove(): void {
    const current = this.detail();
    if (
      !this.busy() &&
      current?.item.source_kind === 'manual' &&
      current.item.editable
    ) {
      this.removeRequested.emit(current.event);
    }
  }
  date(value: string, timed: boolean): string {
    return new Intl.DateTimeFormat(this.locale.language(), {
      calendar: this.locale.calendar(),
      numberingSystem: this.locale.numbering(),
      timeZone: timed ? this.detail()!.zone : 'UTC',
      dateStyle: 'medium',
      ...(timed ? { timeStyle: 'short' } : {}),
    }).format(new Date(timed ? value : value + 'T12:00:00Z'));
  }
  lastDay(end: string): string {
    return shiftDate(end, -1);
  }
}
