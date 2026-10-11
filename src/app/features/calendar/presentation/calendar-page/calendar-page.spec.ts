import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Feedback } from '../../../../core/feedback/feedback';
import { CalendarItem } from '../../application/calendar-port';
import { CALENDAR } from '../../bindings';
import { CalendarEditor } from '../calendar-editor/calendar-editor';
import { CalendarPage } from './calendar-page';

describe('Explicit current calendar reload', () => {
  it('preserves an unsaved draft on cancel and reads current authority only after confirmation', async () => {
    const original: CalendarItem = {
      ref_id: 'old',
      title: 'Appointment',
      editable: true,
      source_kind: 'manual',
      route_key: 'calendar_events',
      schedule: {
        kind: 'all_day',
        timezone: 'UTC',
        start_date: '2026-11-02',
        end_date: '2026-11-03',
      },
    };
    const detail = vi.fn().mockResolvedValue({
      ...original,
      ref_id: 'current',
      title: 'Competing title',
    });
    const confirm = vi.fn().mockResolvedValue(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CALENDAR,
          useValue: {
            search: vi.fn().mockResolvedValue({ items: [], totalPages: 0 }),
            detail,
            reminders: vi.fn().mockResolvedValue([]),
          },
        },
        { provide: Feedback, useValue: { confirm } },
      ],
    });
    const fixture = TestBed.createComponent(CalendarPage);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.selected.set(original);
    vm.editing.set(true);
    fixture.detectChanges();
    const editor = fixture.debugElement.query(By.directive(CalendarEditor))
      .componentInstance as CalendarEditor;
    editor.title = 'Unsaved title';
    await vm.reloadSelected();
    expect(detail).not.toHaveBeenCalled();
    expect(editor.title).toBe('Unsaved title');
    confirm.mockResolvedValue(true);
    await vm.reloadSelected();
    await fixture.whenStable();
    expect(detail).toHaveBeenCalledWith('old');
    expect(editor.title).toBe('Competing title');
    expect(vm.selected()?.ref_id).toBe('current');
    fixture.destroy();
  });
});
