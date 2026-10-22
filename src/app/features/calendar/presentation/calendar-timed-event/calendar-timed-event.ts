import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { Locale } from '../../../../core/localization/locale';
import { CalendarActivation } from '../calendar-activation';
import { TimedRow } from '../calendar-grid/timed-event-layout';
import type { CalendarGrid } from '../calendar-grid/calendar-grid';

@Component({
  selector: 'app-calendar-timed-event',
  imports: [],
  host: { style: 'display:contents' },
  templateUrl: './calendar-timed-event.html',
  styleUrl: './calendar-timed-event.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarTimedEvent {
  readonly entry = input.required<TimedRow>();
  readonly view = input.required<Pick<CalendarGrid, 'timeLabel'>>();
  readonly locale = inject(Locale);
  readonly activated = output<CalendarActivation>();
  readonly agendaRequested = output<void>();
  activate(trigger: HTMLElement): void {
    const row = this.entry();
    if (row.kind === 'more') {
      this.agendaRequested.emit();
    } else {
      this.activated.emit({ event: row.event, trigger });
    }
  }
}
