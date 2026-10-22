import { calendarDraft } from './calendar-draft';
import { localTimeCandidates } from './calendar-dates';

it('keeps civil dates exclusive and midnight transitions local until the explicit editor resolves DST', () => {
  expect(calendarDraft('2026-12-31', 'Asia/Tehran')).toEqual({
    kind: 'all_day',
    timezone: 'Asia/Tehran',
    start: '2026-12-31',
    end: '2027-01-01',
  });
  expect(calendarDraft('2026-12-31', 'Asia/Tehran', 23)).toEqual({
    kind: 'timed',
    timezone: 'Asia/Tehran',
    start: '2026-12-31T23:00',
    end: '2027-01-01T00:00',
  });
  const gap = calendarDraft('2026-03-08', 'America/New_York', 2);
  expect(gap.start).toBe('2026-03-08T02:00');
  expect(localTimeCandidates(gap.start, gap.timezone)).toEqual([]);
  const fold = calendarDraft('2026-11-01', 'America/New_York', 1);
  expect(localTimeCandidates(fold.start, fold.timezone)).toHaveLength(2);
  expect(() => calendarDraft('2026-10-15', 'UTC', 24)).toThrow();
  expect(() => calendarDraft('2026-02-30', 'UTC', 1)).toThrow();
});
