import {
  calendarIso,
  calendarMonth,
  calendarParts,
  calendarText,
  gregorianMillis,
} from './calendar-value';
import { compileQuery } from './list-query';
describe('Calendar presentation and canonical filters', () => {
  it('maps known Jalali and civil Hijri dates to Gregorian ISO without timezone shifts', () => {
    expect(calendarIso('1403-01-01', 'persian')).toBe('2024-03-20');
    expect(calendarIso('۱۴۰۳-۰۱-۰۱', 'persian')).toBe('2024-03-20');
    expect(calendarIso('1445-09-01', 'islamic-civil')).toBe('2024-03-11');
    expect(calendarIso('١٤٤٥-٠٩-٠١', 'islamic-civil')).toBe('2024-03-11');
  });
  it('roundtrips leap dates and year/month boundaries through all three calendars', () => {
    for (const iso of [
      '2024-02-29',
      '2025-03-20',
      '2025-03-21',
      '2026-12-31',
      '2000-01-01',
    ]) {
      for (const calendar of ['gregory', 'persian', 'islamic-civil'] as const) {
        expect(calendarIso(calendarText(iso, calendar), calendar)).toBe(iso);
      }
    }
    expect(calendarIso('1399-12-30', 'persian')).toBe('2021-03-20');
    expect(() => calendarIso('1400-12-30', 'persian')).toThrow();
    expect(() => calendarIso('1445-10-30', 'islamic-civil')).toThrow();
  });
  it('rejects impossible dates, invalid months and malformed drafts', () => {
    for (const value of [
      '0000-01-01',
      '2026-02-30',
      '2026-13-01',
      '2026-00-10',
      'invalid:2026-10-11',
    ]) {
      expect(() => gregorianMillis(value)).toThrow();
    }
    for (const calendar of ['persian', 'islamic-civil'] as const) {
      for (const value of ['1403-00-01', '1403-13-01', '1403-01-32', 'bad']) {
        expect(() => calendarIso(value, calendar)).toThrow();
      }
    }
  });
  it('builds actual selected-calendar month windows, with no adjacent-month days', () => {
    for (const calendar of ['gregory', 'persian', 'islamic-civil'] as const) {
      const days = calendarMonth('2024-03-20', calendar);
      expect(calendarParts(days[0], calendar)[2]).toBe(1);
      expect(days.length).toBeGreaterThanOrEqual(29);
      expect(days.length).toBeLessThanOrEqual(31);
    }
  });
  it('validates canonical dates/times for range and membership filters', () => {
    const fields = [
      { key: 'day', label: 'Day', type: 'date' },
      { key: 'clock', label: 'Time', type: 'time' },
    ] as const;
    expect(
      compileQuery(
        fields,
        [
          {
            field: 'day',
            operation: 'between',
            value: '2024-03-20',
            end: '2024-03-21',
          },
        ],
        [],
        20,
        {},
        [],
      ).filters[0].value,
    ).toEqual(['2024-03-20', '2024-03-21']);
    expect(
      compileQuery(
        fields,
        [
          {
            field: 'clock',
            operation: 'in',
            value: '00:00:00\n23:59:59',
            end: '',
          },
        ],
        [],
        20,
        {},
        [],
      ).filters[0].value,
    ).toEqual(['00:00:00', '23:59:59']);
    for (const [field, value] of [
      ['day', '2026-02-30'],
      ['clock', '24:01:00'],
      ['clock', '12:60:00'],
    ]) {
      expect(() =>
        compileQuery(
          fields,
          [{ field, value, operation: 'equal', end: '' }],
          [],
          20,
          {},
          [],
        ),
      ).toThrow();
    }
  });
});
