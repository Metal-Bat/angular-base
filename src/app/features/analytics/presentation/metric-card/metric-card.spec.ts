import { TestBed } from '@angular/core/testing';
import { Locale } from '../../../../core/localization/locale';
import { ActorState } from '../../../../core/auth/actor-state';
import { metricUnavailableReason } from '../metric-text';
import { readMetric } from '../../domain/metrics';
import { MetricCard } from './metric-card';
describe('Metric card lifecycle', () => {
  it('updates totals, exact bucket values, counts and civil dates with saved presentation preferences', async () => {
    const fixture = TestBed.createComponent(MetricCard);
    const locale = TestBed.inject(Locale);
    const exact = 1.23456789123456;
    const result = readMetric({
      metric_key: 'terminal_duration',
      version: 1,
      unit: 'seconds',
      availability: 'available',
      timezone: 'Pacific/Kiritimati',
      generated_at: '2026-10-08T08:00:00Z',
      as_of: '2026-10-08T08:00:00Z',
      total_value: exact,
      unknown_count: 2,
      sample_count: 3,
      population_count: 5,
      series: [
        {
          key: 'total',
          buckets: [
            {
              date: '2026-10-08',
              value: exact,
              population_count: 5,
              sample_count: 3,
              unknown_count: 2,
            },
          ],
        },
      ],
      drilldown: null,
    });
    for (const [key, value] of Object.entries({
      title: 'Average time to closure',
      start: '2026-10-08',
      end: '2026-10-09',
      result,
      state: 'ready',
    })) {
      fixture.componentRef.setInput(key, value);
    }
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.metric-total bdi')?.textContent?.trim()).toBe(
      String(exact),
    );
    locale.numbering.set('arabext');
    locale.calendarOverride.set('persian');
    await fixture.whenStable();
    const localized = '۱.۲۳۴۵۶۷۸۹۱۲۳۴۵۶';
    expect(root.querySelector('.metric-total bdi')?.textContent?.trim()).toBe(
      localized,
    );
    expect(root.querySelector('tbody')?.textContent).toContain(localized);
    expect(root.querySelector('tbody')?.textContent).toContain('۳');
    expect(root.querySelector('.metric-unknown')?.textContent).toContain('۲');
    const date = new Intl.DateTimeFormat('en', {
      calendar: 'persian',
      numberingSystem: 'arabext',
      timeZone: 'UTC',
      dateStyle: 'medium',
    }).format(new Date('2026-10-08T12:00:00Z'));
    expect(root.querySelector('.metric-period time')?.textContent).toBe(date);
    expect(
      root.querySelector('.metric-period time')?.getAttribute('datetime'),
    ).toBe('2026-10-08');
    expect(root.querySelector('tbody')?.textContent).toContain(date);
    const region = root.querySelector('.p-datatable-table-container');
    expect(region?.getAttribute('tabindex')).toBe('0');
    expect(region?.getAttribute('aria-label')).toBe('Data table');
    locale.numbering.set('latn');
    await fixture.whenStable();
    expect(root.querySelector('.metric-total bdi')?.textContent?.trim()).toBe(
      String(exact),
    );
  });

  it('keeps zero distinct from unknown, fences revoked output, and clones drilldown restrictions', async () => {
    const fixture = TestBed.createComponent(MetricCard);
    const result = readMetric({
      metric_key: 'submitted_requests',
      version: 1,
      unit: 'count',
      availability: 'available',
      timezone: 'UTC',
      generated_at: '2026-10-08T08:00:00Z',
      as_of: '2026-10-08T08:00:00Z',
      total_value: 0,
      series: [],
      drilldown: {
        route_key: 'requests',
        query: {
          filters: [
            { field_name: 'status', operation: 'eq', value: 'RUNNING' },
          ],
        },
      },
    });
    for (const [key, value] of Object.entries({
      title: 'Total',
      start: '2026-10-08',
      end: '2026-10-09',
      state: 'ready',
      result,
      canDrillDown: true,
    })) {
      fixture.componentRef.setInput(key, value);
    }
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    expect(vm.inclusiveEnd()).toBe('2026-10-08');
    expect(vm.end()).toBe('2026-10-09');
    const output = vi.fn();
    vm.drilldown.subscribe(output);
    vm.open();
    expect(output).toHaveBeenCalledExactlyOnceWith(result.drilldown);
    expect(output.mock.calls[0][0]).not.toBe(result.drilldown);
    expect(
      fixture.nativeElement.querySelector('.metric-total').textContent,
    ).toContain('Total: 0');
    fixture.componentRef.setInput('result', { ...result, total_value: null });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Unknown');
    TestBed.inject(ActorState).reset();
    vm.open();
    expect(output).toHaveBeenCalledTimes(1);
    expect(vm.rows()).toEqual([]);
    expect(vm.available()).toBe(false);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'Metrics are unavailable.',
    );
  });
  it('explains a configured unavailable metric without rendering a total or unknown producer code', async () => {
    const fixture = TestBed.createComponent(MetricCard);
    const result = readMetric({
      metric_key: 'integration_outcomes',
      version: 1,
      unit: 'count',
      availability: 'unavailable',
      timezone: 'UTC',
      generated_at: '2026-10-08T08:00:00Z',
      as_of: '2026-10-08T08:00:00Z',
      total_value: null,
      series: [],
      drilldown: null,
    });
    for (const [key, value] of Object.entries({
      title: 'Integration outcomes',
      start: '2026-10-08',
      end: '2026-10-09',
      state: 'ready',
      result,
      unavailableReason: metricUnavailableReason(
        'receipt_metric_not_configured',
      ),
    })) {
      fixture.componentRef.setInput(key, value);
    }
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'Integration outcome receipts are not configured.',
    );
    expect(fixture.nativeElement.querySelector('.metric-total')).toBeNull();
    expect(metricUnavailableReason('unreviewed_reason')).toBe('');
  });
});
