import { TestBed } from '@angular/core/testing';
import { Locale } from '../../../../core/localization/locale';
import { readMetric } from '../../domain/metrics';
import { MetricChart } from './metric-chart';
describe('Typed metric plot', () => {
  it('plots true zeros, leaves null gaps and positions missing civil dates on the time axis', async () => {
    const fixture = TestBed.createComponent(MetricChart);
    const metric = readMetric({
      metric_key: 'terminal_duration',
      version: 1,
      unit: 'seconds',
      availability: 'available',
      timezone: 'UTC',
      generated_at: '2026-10-14T00:00:00Z',
      as_of: '2026-10-14T00:00:00Z',
      total_value: 45,
      population_count: 3,
      sample_count: 2,
      unknown_count: 1,
      series: [
        {
          key: 'total',
          buckets: [
            {
              date: '2026-10-01',
              value: 0,
              population_count: 1,
              sample_count: 1,
              unknown_count: 0,
            },
            {
              date: '2026-10-02',
              value: null,
              population_count: 1,
              sample_count: 0,
              unknown_count: 1,
            },
            {
              date: '2026-10-04',
              value: 90,
              population_count: 1,
              sample_count: 1,
              unknown_count: 0,
            },
          ],
        },
      ],
      drilldown: null,
    });
    for (const [key, value] of Object.entries({
      metric,
      title: 'Terminal duration',
      start: '2026-10-01',
      end: '2026-10-05',
    })) {
      fixture.componentRef.setInput(key, value);
    }
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    expect(vm.series()[0].path.match(/M/g)).toHaveLength(2);
    expect(vm.y(0)).toBe(230);
    expect(vm.x('2026-10-04')).toBe(840);
    expect(vm.dates()).toEqual(['2026-10-01', '2026-10-02', '2026-10-04']);
    expect(fixture.nativeElement.querySelectorAll('.point')).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('seconds');
    TestBed.inject(Locale).numbering.set('arabext');
    await fixture.whenStable();
    expect(vm.dateLabel('2026-10-04')).toContain('۴');
    expect(vm.valueLabel(1.23456789123456)).toBe('۱.۲۳۴۵۶۷۸۹۱۲۳۴۵۶');
    expect(
      fixture.nativeElement.querySelector('.point title').textContent,
    ).toContain('۰');
    fixture.componentRef.setInput('end', '2026-10-31');
    await fixture.whenStable();
    expect(vm.dates()).toEqual(['2026-10-01']);
    expect(fixture.nativeElement.querySelectorAll('.point')).toHaveLength(2);
  });
});
