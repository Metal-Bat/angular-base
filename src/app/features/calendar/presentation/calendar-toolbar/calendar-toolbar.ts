import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { CalendarView } from '../../domain/calendar-dates';

@Component({
  selector: 'app-calendar-toolbar',
  imports: [ButtonDirective, SelectControl, LocalizePipe],
  templateUrl: './calendar-toolbar.html',
  styleUrl: './calendar-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarToolbar {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly picker = viewChild(SelectControl);
  focusView(view: CalendarView): void {
    const button = this.host.nativeElement.querySelector<HTMLButtonElement>(
      '[data-calendar-view="' + view + '"]',
    );
    if (button?.getClientRects().length) {
      button.focus();
    } else {
      this.picker()?.focus();
    }
  }
  readonly title = input.required<string>();
  readonly view = input.required<CalendarView>();
  readonly periodMoved = output<number>();
  readonly todayRequested = output<void>();
  readonly viewChanged = output<CalendarView>();
  readonly views = ['day', 'week', 'month', 'agenda'] as const;
  readonly labels = {
    day: 'Day',
    week: 'Week',
    month: 'Month',
    agenda: 'Agenda',
  };
  changeView(value: unknown): void {
    if (this.views.includes(value as CalendarView)) {
      this.viewChanged.emit(value as CalendarView);
    }
  }
}
